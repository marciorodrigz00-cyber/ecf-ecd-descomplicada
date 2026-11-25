/**
 * Extrai registros e campos do Manual (.docx) para content/leiautes/<n>/registros/<bloco>.json.
 * Uso: node tools/extrair-leiaute/index.ts <leiaute> <manual.docx>
 * Tudo sai como "extraido". O que já foi conferido fica em content/leiautes/<n>/conferidos.json.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { lerDocx, type Item, type Tab } from "./docx.ts";

export type Campo = {
  numero: number;
  nome: string;
  descricao: string;
  tipo: string;
  tamanho: string;
  decimal: string;
  valores: string;
  obrigatorio: string;
};
export type RegraCampo = { campo: string; regras: { codigo: string; texto: string; tipo: string }[] };
export type Registro = {
  codigo: string;
  nome: string;
  ordem: number;
  nivel: string;
  ocorrencia: string;
  chave: string;
  entrada: string;
  saida: string;
  descricao: string[];
  campos: Campo[];
  regrasRegistro: { codigo: string; texto: string }[];
  regrasCampo: RegraCampo[];
  exemplo: string[];
};

/** Só tipografia: ordinais e "nº" que no Word estão como letra "o" elevada. O texto não muda. */
export function tipografia(s: string): string {
  return s
    .replace(/\b(Lei|Leis|Decreto|Decreto-Lei|Decreto-lei|RFB|SRF|Provisória|Complementar|Cofis|Cosit) no (?=\d)/g, "$1 nº ")
    .replace(/(art\.|arts\.|§|§§) ?(\d+)o(?=[\s,;.)-]|$)/gi, "$1 $2º")
    .replace(/(\b\d)o (?=\(|trimestre|mês|de janeiro)/gi, "$1º ");
}

/** Erros de digitação do próprio Manual, corrigidos com registro. */
const CORRECOES: Record<string, string> = { "9099": "9990" };
const FORA_DO_ESCOPO = new Set(["S"]);

const vazio = (s: string | undefined) => {
  const t = tipografia((s ?? "").trim());
  return t === "" || t === "-" || t === "–" ? "—" : t;
};
/** O Manual alterna S, sim e Sim para a mesma resposta. */
const simNao = (s: string) => (/^s(im)?$/i.test(s) ? "Sim" : /^n([ãa]o)?$/i.test(s) ? "Não" : s);
const eTabela = (i: Item): i is Tab => i.tipo === "t";

/** Linha sem número nem nome é a continuação da anterior, quebrada pelo Word entre páginas. */
function juntarContinuacao(linhas: string[][]): string[][] {
  const saida: string[][] = [];
  for (const l of linhas) {
    const anterior = saida.at(-1);
    if (anterior && !l[0] && !l[1]) l.forEach((c, i) => c && (anterior[i] = [anterior[i], c].filter(Boolean).join("\n")));
    else saida.push([...l]);
  }
  return saida;
}

/** Só são códigos de regra os que abrem um trecho ("REGRA_X:"), não os citados no meio. */
export function separarRegras(texto: string): { codigo: string; texto: string }[] {
  const partes = texto.split(/(?:^|\n|(?<=[.”"] ?))(?=(?:REGRA|TIPO_DOACAO)[_A-ZÀ-Ú0-9]+ ?:)/);
  return partes
    .map((p) => /^((?:REGRA|TIPO_DOACAO)[_A-ZÀ-Ú0-9]+) ?:\s*([\s\S]*)$/.exec(p.trim()))
    .filter((m) => m !== null)
    .map((m) => ({ codigo: m[1]!, texto: tipografia(m[2]!.trim()) }));
}

export function extrair(itens: Item[]): { registros: Registro[]; blocos: { letra: string; descricao: string }[]; avisos: string[] } {
  const avisos: string[] = [];
  const obrig = itens.filter(eTabela).find((t) => t.linhas[0]?.[0] === "Registro" && t.linhas[0].length === 6);
  if (!obrig) throw new Error("Tabela de obrigatoriedade não encontrada");
  const porCodigo = new Map(
    obrig.linhas.slice(1).map((l) => [CORRECOES[l[0]!] ?? l[0]!, { entrada: vazio(l[3]), saida: vazio(l[4]), ocorrencia: vazio(l[5]) }]),
  );
  const tBlocos = itens.filter(eTabela).find((t) => t.linhas[0]?.[0] === "Bloco" && t.linhas[0].length === 3);
  if (!tBlocos) throw new Error("Tabela de blocos não encontrada");
  const blocos = tBlocos.linhas
    .slice(1)
    .filter((l) => !FORA_DO_ESCOPO.has(l[0]!))
    .map((l) => ({ letra: l[0]!, descricao: tipografia(l[2]!) }));

  const inicios = itens.flatMap((x, n) => (x.tipo === "p" && x.estilo === "Ttulo4" && /^Registro \w{4} ?:/.test(x.texto) ? [n] : []));
  const registros: Registro[] = [];
  for (const [k, ini] of inicios.entries()) {
    const proximoTitulo = itens.findIndex((x, n) => n > ini && x.tipo === "p" && /^Ttulo[1-4]$/.test(x.estilo) && x.texto !== "");
    const fim = Math.min(inicios[k + 1] ?? itens.length, proximoTitulo < 0 ? itens.length : proximoTitulo);
    const trecho = itens.slice(ini, fim);
    const titulo = trecho[0] as { texto: string };
    const m = /^Registro (\w{4}) ?:\s*([\s\S]+)$/.exec(titulo.texto)!;
    const codigo = m[1]!;
    if (FORA_DO_ESCOPO.has(codigo[0]!)) continue;

    const iCab = trecho.findIndex((x) => eTabela(x) && /^REGISTRO \w{4}/i.test(x.linhas[0]?.[0] ?? ""));
    const iCampos = trecho.findIndex((x) => eTabela(x) && x.linhas[0]?.[1] === "Campo" && x.linhas[0].length === 8);
    if (iCab < 0 || iCampos < 0) {
      avisos.push(`${codigo}: sem cabeçalho ou tabela de campos`);
      continue;
    }
    const cab = (trecho[iCab] as Tab).linhas.map((l) => l.join(" ")).join("\n");
    const campos = juntarContinuacao((trecho[iCampos] as Tab).linhas.slice(1)).flatMap((l) => {
      if (l.length !== 8 || !/^\d+$/.test(l[0]!)) {
        avisos.push(`${codigo}: linha de campo fora do padrão: ${l.join(" ¦ ").slice(0, 120)}`);
        return [];
      }
      return [{ numero: Number(l[0]), nome: l[1]!.replace(/\s+/g, ""), descricao: vazio(l[2]), tipo: vazio(l[3]), tamanho: vazio(l[4]), decimal: vazio(l[5]), valores: vazio(l[6]), obrigatorio: simNao(vazio(l[7])) }];
    });
    campos.forEach((c, n) => c.numero !== n + 1 && avisos.push(`${codigo}: campo ${c.nome} com número ${c.numero}, esperado ${n + 1}`));

    const regrasCampo: RegraCampo[] = [];
    for (const t of trecho.slice(iCampos + 1).filter(eTabela)) {
      if (!/^regras de validação do campo/i.test(t.linhas[0]?.[2] ?? "")) continue;
      for (const l of juntarContinuacao(t.linhas.slice(1))) {
        const tipos = (l[3] ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
        const regras = separarRegras(l[2] ?? "").map((r, n, todas) => ({
          ...r,
          tipo: tipos.length === todas.length ? tipos[n]! : new Set(tipos).size === 1 ? tipos[0]! : "a verificar",
        }));
        if (regras.length === 0) avisos.push(`${codigo}.${l[1]}: regra sem código: ${(l[2] ?? "").slice(0, 80)}`);
        // O Manual às vezes traz a mesma tabela duas vezes (ex.: 0000): junta por campo e descarta repetições iguais.
        const campo = (l[1] ?? "").replace(/\s+/g, "");
        const atual = regrasCampo.find((c) => c.campo === campo);
        if (!atual) regrasCampo.push({ campo, regras });
        else {
          for (const r of regras) {
            const igual = atual.regras.find((x) => x.codigo === r.codigo);
            if (!igual) atual.regras.push(r);
            else if (igual.texto !== r.texto) avisos.push(`${codigo}.${campo} ${r.codigo}: textos diferentes em tabelas repetidas; mantido o primeiro`);
          }
        }
      }
    }

    // Parágrafos depois da tabela de campos: regras do registro e exemplo.
    const pars = trecho.slice(iCampos + 1).flatMap((x) => (x.tipo === "p" && x.texto ? [x.texto] : []));
    const corte = (re: RegExp) => pars.findIndex((p) => re.test(p));
    const iRR = corte(/^I+ ?[–-] ?Regras? de Validação do Registro/i);
    let textoRR = "";
    if (iRR >= 0) {
      const ate = pars.findIndex((p, n) => n > iRR && (/^I+V? ?[–-] /.test(p) || /^Exemplo/i.test(p)));
      textoRR = pars.slice(iRR + 1, ate < 0 ? undefined : ate).join("\n");
    }
    const iEx = corte(/^Exemplos? de Preenchimento/i);
    const exemplo = iEx >= 0 ? pars.slice(iEx + 1).filter((p) => p.startsWith("|")).map(tipografia) : [];
    if (registros.some((r) => r.codigo === codigo)) {
      avisos.push(`${codigo}: seção repetida no Manual; mantida a primeira`);
      continue;
    }
    const o = porCodigo.get(codigo);
    if (!o) avisos.push(`${codigo}: fora da tabela de obrigatoriedade`);

    registros.push({
      codigo,
      nome: tipografia(m[2]!.trim()),
      ordem: registros.length,
      nivel: /Nível Hierárquico ?[–-] ?(\d)/i.exec(cab)?.[1] ?? "—",
      ocorrencia: o?.ocorrencia ?? "—",
      chave: vazio(/Campo\(s\) chave: ?([^\n]+)/i.exec(cab)?.[1]),
      entrada: o?.entrada ?? "—",
      saida: o?.saida ?? "—",
      descricao: trecho.slice(1, iCab).flatMap((x) => (x.tipo === "p" && x.texto ? [tipografia(x.texto)] : [])),
      campos,
      regrasRegistro: separarRegras(textoRR),
      regrasCampo,
      exemplo,
    });
  }
  for (const c of porCodigo.keys()) {
    if (!FORA_DO_ESCOPO.has(c[0]!) && !registros.some((r) => r.codigo === c)) avisos.push(`${c}: na tabela, sem seção`);
  }
  return { registros, blocos, avisos };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [leiaute, docx] = process.argv.slice(2);
  if (!leiaute || !/^\d+$/.test(leiaute) || !docx) throw new Error("Uso: index.ts <leiaute> <manual.docx>");
  const { registros, blocos, avisos } = extrair(lerDocx(docx));
  const base = path.resolve("content/leiautes", leiaute);
  // A rastreabilidade de cada bloco vem do leiaute de onde ele saiu; sem conferência, fica "extraido".
  const { fonte, norma, leiautes, vigencia, verificadoEm } = JSON.parse(readFileSync(path.join(base, "leiaute.json"), "utf8"));
  const rastreio = (letra: string) => ({
    id: `arq-${leiaute}-${letra.toLowerCase()}`,
    fonte: { id: fonte.id, url: fonte.url, trecho: `Seção do bloco ${letra}` },
    norma, leiautes, vigencia, verificadoEm,
    status: "extraido",
  });
  rmSync(path.join(base, "registros"), { recursive: true, force: true });
  mkdirSync(path.join(base, "registros"), { recursive: true });
  for (const b of blocos) {
    const doBloco = registros.filter((r) => r.codigo[0] === b.letra);
    writeFileSync(path.join(base, "registros", `${b.letra}.json`), JSON.stringify({ rastreio: rastreio(b.letra), bloco: b.letra, descricao: b.descricao, registros: doBloco }, null, 1) + "\n");
  }
  console.log(`Leiaute ${leiaute}: ${registros.length} registros, ${registros.reduce((n, r) => n + r.campos.length, 0)} campos`);
  for (const a of avisos) console.log("AVISO", a);
}
