/**
 * Conferência dos roteiros de simulação (content/roteiros/**), além do schema.
 * Usa o mesmo motor de regras do site (src/lib/simulacao), sem atalhos de caminho.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ } from "./entrada.mjs";

let motor;
async function carregar() {
  const dir = path.join(RAIZ, "src", "lib", "simulacao");
  motor ??= {
    ...(await import(pathToFileURL(path.join(dir, "regras.ts")).href)),
    ...(await import(pathToFileURL(path.join(dir, "arquivo.ts")).href)),
  };
  return motor;
}

const ler = (...p) => JSON.parse(readFileSync(path.join(RAIZ, ...p), "utf8"));
const lista = (z) => (Array.isArray(z) ? z : (z.registros ?? Object.values(z).find(Array.isArray)));

/** Formato de um valor pelo leiaute: tipo, tamanho e lista simples de valores válidos. */
function formato(c, v) {
  if (v === "") return c.obrigatorio === "Sim" ? `${c.nome} obrigatório vazio` : null;
  if ((c.tipo === "N" || c.tipo === "NS") && !/^-?\d+(,\d{1,4})?$/.test(v)) return `${c.nome}="${v}" não é número`;
  const max = /^\d+$/.test(c.tamanho) ? Number(c.tamanho) : null;
  if (max && v.replace(/[-,]/g, "").length > max) return `${c.nome}="${v}" maior que ${max}`;
  return null;
}

/** Devolve a lista de problemas. Empresa fictícia do site: os cenários completos são conferidos no build e nos testes. */
export async function conferirRoteiro(rel, r) {
  const erros = [];
  const avisos = [];
  const esperado = `content/roteiros/${r.registro[0].toLowerCase()}/${r.registro.toLowerCase()}.json`;
  if (rel !== esperado) erros.push(`o arquivo precisa ficar em ${esperado}`);

  const linhaAno = ler("content", "leiautes", "anos.json").linhas.find((l) => l.anoCalendario === r.ano);
  if (!linhaAno) return { erros: [...erros, `não há leiaute para o AC ${r.ano}`], avisos };
  const leiaute = (reg) => {
    try {
      return lista(ler("content", "leiautes", linhaAno.leiaute, "registros", `${reg[0]}.json`)).find((x) => x.codigo === reg);
    } catch {
      return undefined;
    }
  };
  const reg = leiaute(r.registro);
  if (!reg) return { erros: [...erros, `${r.registro} não existe no leiaute ${linhaAno.leiaute}`], avisos };
  const nomes = new Set(reg.campos.map((c) => c.nome));
  const existe = (campo) => {
    if (!campo.includes(".")) return nomes.has(campo);
    const [outro, nome] = campo.split(".");
    return leiaute(outro)?.campos.some((c) => c.nome === nome) ?? false;
  };

  for (const n of Object.keys(r.linha.campos)) if (!nomes.has(n)) erros.push(`linha.campos: ${n} não existe no ${r.registro}`);
  for (const f of r.fatos) for (const c of f.campos) if (!existe(c)) erros.push(`fatos: campo ${c} não existe`);
  for (const n of Object.keys(r.legendas ?? {})) if (!nomes.has(n)) erros.push(`legendas: ${n} não existe no ${r.registro}`);
  if (!nomes.has(r.erro.campo) || r.erro.campo === "REG") erros.push(`erro.campo: ${r.erro.campo} não pode ser usado`);

  // Todas as regras do Manual, e só elas.
  const chave = (campo, codigo) => `${r.registro}.${campo}:${codigo}`;
  const doManual = new Set([...reg.regrasRegistro.map((x) => chave("*", x.codigo)), ...reg.regrasCampo.flatMap((g) => g.regras.map((x) => chave(g.campo, x.codigo)))]);
  const doRoteiro = new Set(r.regras.map((x) => chave(x.campo, x.codigo)));
  for (const k of doManual) if (!doRoteiro.has(k)) erros.push(`regra do Manual fora do roteiro: ${k}`);
  for (const k of doRoteiro) if (!doManual.has(k)) erros.push(`regra que não está no Manual: ${k}`);
  const { REGRAS, montarArquivo, montarLinha } = await carregar();
  for (const x of r.regras) if (x.simulada && !REGRAS[chave(x.campo, x.codigo)]) erros.push(`${x.codigo} marcada como simulada, sem código em src/lib/simulacao/regras.ts`);
  if (erros.length) return { erros, avisos };

  const campoErro = reg.campos.find((c) => c.nome === r.erro.campo);
  const ruim = formato(campoErro, r.erro.valor);
  if (ruim) erros.push(`erro.valor fora do formato do campo (${ruim}): o cenário precisa falhar na regra, não no formato`);

  if (r.empresa.origem !== "manual") {
    avisos.push(`${rel}: cenários com a empresa fictícia do site são conferidos no build e nos testes`);
    return { erros, avisos };
  }
  const campos = reg.campos.slice(1).map((c) => r.linha.campos[c.nome] ?? "");
  for (const [i, c] of reg.campos.slice(1).entries()) {
    const f = formato(c, campos[i]);
    if (f) erros.push(`linha: ${f}`);
  }
  if (montarLinha(r.registro, campos) !== reg.exemplo[0]) erros.push(`a linha gerada (${montarLinha(r.registro, campos)}) difere do exemplo do Manual (${reg.exemplo[0]})`);
  const pai = { codigo: r.registro, nivel: reg.nivel, campos: reg.campos };
  const avaliar = (vals, x) => {
    const [linha] = montarArquivo([{ reg: r.registro, campos: vals }], () => pai);
    return REGRAS[chave(x.campo, x.codigo)]({ linha, arquivo: [linha], extras: r.extras ?? {}, leiautePorAno: { [r.ano]: linhaAno.leiaute }, tipoDaLinha: () => undefined });
  };
  for (const x of r.regras.filter((y) => y.simulada)) {
    const res = avaliar(campos, x);
    if (res.estado === "falhou") erros.push(`cenário normal falha em ${x.codigo}: ${res.detalhe}`);
  }
  const i = reg.campos.findIndex((c) => c.nome === r.erro.campo) - 1;
  const errados = campos.map((v, n) => (n === i ? r.erro.valor : v));
  const regraErro = r.regras.find((x) => x.codigo === r.erro.regra && x.simulada);
  if (regraErro && avaliar(errados, regraErro).estado !== "falhou") erros.push(`o cenário de erro não falha em ${r.erro.regra}`);
  return { erros, avisos };
}
