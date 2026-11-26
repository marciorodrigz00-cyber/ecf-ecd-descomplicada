import { readdirSync } from "node:fs";
import path from "node:path";
import { conferirRastreio, leiautePorAno, ler } from "@/lib/conteudo";
import { legendas, registroDoAno } from "@/lib/conteudo/leiautes";
import { realMontado, tabelas } from "@/lib/exemplos";
import { validarArquivo } from "@/lib/exemplos/validar";
import * as S from "@/schemas";
import { montarArquivo, montarLinha, type LinhaArq, type LinhaBruta } from "./arquivo";
import { REGRAS, chaveRegra, type Contexto, type Resultado } from "./regras";

const PASTA = path.join(process.cwd(), "content", "roteiros");
export const roteiros: S.Roteiro[] = readdirSync(PASTA, { recursive: true, encoding: "utf8" })
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const r = ler(`roteiros/${f.replaceAll("\\", "/")}`, S.Roteiro);
    if (f.replaceAll("\\", "/") !== `${r.registro[0]!.toLowerCase()}/${r.registro.toLowerCase()}.json`) throw new Error(`roteiros/${f}: o caminho precisa ser bloco/registro.json`);
    conferirRastreio(r.rastreio);
    return r;
  });

export const roteiroDe = (codigo: string, ano: number) => roteiros.find((r) => r.registro === codigo && r.ano === ano);

type Nivelado = { iniciante: string; profissional: string };
export type RegraSimulada = { campo: string; codigo: string; texto: string; tipo: string; simulada: boolean; motivo: string | null; resultado: Resultado | null };
export type Simulacao = {
  codigo: string;
  nome: string;
  ano: number;
  leiaute: string;
  empresa: { nome: string; origem: "manual" | "lucro-real"; aviso: string | null };
  fatos: { texto: Nivelado; campos: string[] }[];
  decisao: { pergunta: Nivelado; sim: Nivelado; nao: Nivelado; condicao: string } | null;
  obrigatoriedade: string;
  campos: { nome: string; descricao: string; tipo: string; tamanho: string; obrigatorio: string; valor: string; legenda: Nivelado | null }[];
  linha: string;
  regras: RegraSimulada[];
  erro: { campo: string; certo: string; errado: string; linha: string; regra: RegraSimulada; explicacao: Nivelado; comoCorrigir: Nivelado };
  paraQueServe: Nivelado;
  fonte: { url: string; trecho: string; verificadoEm: string; status: string };
};

const leiauteDoReg = (ano: number) => (reg: string) => registroDoAno(reg, ano);
const leiautesPorAno = Object.fromEntries(leiautePorAno.linhas.map((l) => [l.anoCalendario, l.leiaute]));
const leiauteSituacaoEspecial = Object.fromEntries(leiautePorAno.linhas.map((l) => [l.situacaoEspecial, l.leiaute]));
const tipoDaLinha = (reg: string, codigo: string) => (tabelas.lalur as Record<string, { codigo: string; tipo: string }[]>)[reg]?.find((l) => l.codigo === codigo)?.tipo;

function arquivoEAlvo(r: S.Roteiro): { brutas: LinhaBruta[]; alvo: number } {
  const reg = registroDoAno(r.registro, r.ano)!;
  if (r.empresa.origem === "manual") {
    const campos = reg.campos.slice(1).map((c) => r.linha.campos[c.nome] ?? "");
    const sobra = Object.keys(r.linha.campos).filter((n) => !reg.campos.some((c) => c.nome === n));
    if (sobra.length) throw new Error(`Roteiro ${r.registro}: campos fora do leiaute (${sobra.join(", ")})`);
    // O exemplo do Manual é a fonte: a linha gerada precisa ser a mesma.
    if (montarLinha(r.registro, campos) !== reg.exemplo[0]) throw new Error(`Roteiro ${r.registro}: linha gerada difere do exemplo do Manual`);
    return { brutas: [{ reg: r.registro, campos }], alvo: 0 };
  }
  const brutas = realMontado.arquivo.linhas.map((l) => ({ reg: l.reg, campos: l.campos }));
  const arq = montarArquivo(brutas, leiauteDoReg(r.ano));
  const achadas = arq.filter((l) => l.reg === r.registro && (!r.linha.periodo || l.periodo === r.linha.periodo) && Object.entries(r.linha.campos).every(([k, v]) => l.v[k] === v));
  if (achadas.length !== 1) throw new Error(`Roteiro ${r.registro}: a seleção acha ${achadas.length} linhas`);
  return { brutas, alvo: achadas[0]!.indice };
}

function avaliar(r: S.Roteiro, arquivo: LinhaArq[], alvo: number, chave: string): Resultado {
  const ctx: Contexto = { linha: arquivo[alvo]!, arquivo, extras: r.extras ?? {}, leiautePorAno: leiautesPorAno, leiauteSituacaoEspecial, tipoDaLinha };
  return REGRAS[chave]!(ctx);
}

/** Monta a simulação e confere: regras do Manual todas cobertas, cenário normal sem falha e cenário de erro falhando na regra dele. */
export function montarSimulacao(r: S.Roteiro): Simulacao {
  const reg = registroDoAno(r.registro, r.ano);
  if (!reg) throw new Error(`Roteiro ${r.registro}: registro não existe no AC ${r.ano}`);
  const { brutas, alvo } = arquivoEAlvo(r);
  const arquivo = montarArquivo(brutas, leiauteDoReg(r.ano));
  const linhaAlvo = brutas[alvo]!;
  const formato = validarArquivo([{ ...linhaAlvo, explicacao: "" }], leiauteDoReg(r.ano));
  if (formato.length) throw new Error(`Roteiro ${r.registro}: ${formato.join("; ")}`);

  // Regras do Manual, sem repetir a mesma chave (o L100 repete uma regra com dois textos).
  const doManual = new Map<string, { campo: string; codigo: string; texto: string; tipo: string }>();
  for (const x of reg.regrasRegistro) {
    const k = chaveRegra(r.registro, "*", x.codigo);
    const antes = doManual.get(k);
    const tipo = /gera um aviso/i.test(x.texto) ? "Aviso" : "Erro";
    // Mesmo código com dois textos (L100): mostra os dois tipos, se forem diferentes.
    const tipos = [...new Set([...(antes?.tipo.split("/") ?? []), tipo])].join("/");
    doManual.set(k, { campo: "*", codigo: x.codigo, texto: [antes?.texto, x.texto].filter(Boolean).join("\n\n"), tipo: tipos });
  }
  for (const g of reg.regrasCampo) for (const x of g.regras) doManual.set(chaveRegra(r.registro, g.campo, x.codigo), { campo: g.campo, codigo: x.codigo, texto: x.texto, tipo: x.tipo });
  const doRoteiro = new Map(r.regras.map((x) => [chaveRegra(r.registro, x.campo, x.codigo), x]));
  const faltam = [...doManual.keys()].filter((k) => !doRoteiro.has(k));
  const sobram = [...doRoteiro.keys()].filter((k) => !doManual.has(k));
  if (faltam.length || sobram.length) throw new Error(`Roteiro ${r.registro}: regras faltando (${faltam.join(", ")}) ou fora do Manual (${sobram.join(", ")})`);

  const regras: RegraSimulada[] = [...doManual.entries()].map(([k, m]) => {
    const rot = doRoteiro.get(k)!;
    if (rot.simulada && !REGRAS[k]) throw new Error(`Roteiro ${r.registro}: ${k} marcada como simulada, mas não há código para ela`);
    return { ...m, simulada: rot.simulada, motivo: rot.motivo ?? null, resultado: rot.simulada ? avaliar(r, arquivo, alvo, k) : null };
  });
  const falhas = regras.filter((x) => x.resultado?.estado === "falhou");
  if (falhas.length) throw new Error(`Roteiro ${r.registro}: o cenário normal falha em ${falhas.map((x) => x.codigo).join(", ")}`);

  // Cenário com erro: troca um valor e reavalia a regra que ele demonstra.
  const i = reg.campos.findIndex((c) => c.nome === r.erro.campo);
  if (i < 1) throw new Error(`Roteiro ${r.registro}: campo do erro fora do leiaute`);
  const errados = brutas.map((b, n) => (n === alvo ? { ...b, campos: b.campos.map((v, j) => (j === i - 1 ? r.erro.valor : v)) } : b));
  const arquivoErrado = montarArquivo(errados, leiauteDoReg(r.ano));
  const regraErro = regras.find((x) => x.codigo === r.erro.regra && x.simulada)!;
  const resultadoErro = avaliar(r, arquivoErrado, alvo, chaveRegra(r.registro, regraErro.campo, regraErro.codigo));
  if (resultadoErro.estado !== "falhou") throw new Error(`Roteiro ${r.registro}: o cenário de erro não falha em ${r.erro.regra}`);

  const sigla = /^(OC|FC|O|F|N)\b/.exec(reg.saida)?.[1];
  const obrigatoriedade = sigla ? legendas.obrigatoriedade[sigla]! : reg.saida;
  const nivelado = (n: { iniciante: string; profissional: string }) => ({ iniciante: n.iniciante, profissional: n.profissional });
  return {
    codigo: r.registro,
    nome: reg.nome,
    ano: r.ano,
    leiaute: leiautesPorAno[r.ano]!,
    empresa: { nome: r.empresa.nome, origem: r.empresa.origem, aviso: r.empresa.aviso ?? null },
    fatos: r.fatos.map((f) => ({ texto: nivelado(f.texto), campos: f.campos })),
    decisao: r.decisao
      ? { pergunta: nivelado(r.decisao.pergunta), sim: nivelado(r.decisao.sim), nao: nivelado(r.decisao.nao), condicao: reg.saida.replace(/^(OC|FC|O|F|N)\s*/, "").trim() }
      : null,
    obrigatoriedade,
    campos: reg.campos.map((c, n) => ({
      nome: c.nome,
      descricao: c.descricao,
      tipo: c.tipo,
      tamanho: c.tamanho,
      obrigatorio: c.obrigatorio,
      valor: n === 0 ? r.registro : linhaAlvo.campos[n - 1]!,
      legenda: r.legendas?.[c.nome] ? nivelado(r.legendas[c.nome]!) : null,
    })),
    linha: montarLinha(r.registro, linhaAlvo.campos),
    regras,
    erro: {
      campo: r.erro.campo,
      certo: linhaAlvo.campos[i - 1]!,
      errado: r.erro.valor,
      linha: montarLinha(r.registro, errados[alvo]!.campos),
      regra: { ...regraErro, resultado: resultadoErro },
      explicacao: nivelado(r.erro.explicacao),
      comoCorrigir: nivelado(r.erro.comoCorrigir),
    },
    paraQueServe: nivelado(r.paraQueServe),
    fonte: { url: r.rastreio.fonte.url, trecho: r.rastreio.fonte.trecho, verificadoEm: r.rastreio.verificadoEm, status: r.rastreio.status },
  };
}

export const simulacaoDe = (codigo: string, ano: number) => {
  const r = roteiroDe(codigo, ano);
  return r ? montarSimulacao(r) : null;
};

