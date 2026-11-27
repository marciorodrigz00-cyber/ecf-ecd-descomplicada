import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ, relativo } from "./entrada.mjs";
import { conferirRoteiro } from "./roteiros.mjs";

/**
 * Cada arquivo de content/ precisa estar aqui. Modos:
 *  itens    lista em que cada item tem a própria rastreabilidade
 *  item     o arquivo é um único item rastreável
 *  arquivo  a rastreabilidade vale para o arquivo inteiro (chave "rastreio")
 *  citacao  texto que precisa citar regras existentes
 *  apoio    sem regra fiscal própria: só o schema (catálogo de fontes, controle, dados fictícios)
 *  roteiro  simulação de preenchimento: schema, rastreio e conferência com o Manual e o motor de regras
 *  incentivo ficha de incentivo (etapa 4): schema, rastreio, registros do leiaute 12 e regras citadas
 */
const MAPA = [
  [/^content\/regras\/[\w-]+\.json$/, "Regra", "itens"],
  [/^content\/novidades\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.json$/, "Novidade", "item"],
  [/^content\/glossario\.json$/, "Termo", "itens"],
  [/^content\/linha-do-tempo\.json$/, "Evento", "itens"],
  [/^content\/programa\.json$/, "Programa", "item"],
  [/^content\/leiautes\/\d+\/leiaute\.json$/, "Leiaute", "item"],
  [/^content\/leiautes\/\d+\/registros\/[0-9A-Z]\.json$/, "ArquivoRegistros", "arquivo"],
  [/^content\/leiautes\/anos\.json$/, "LeiautePorAno", "arquivo"],
  [/^content\/leiautes\/\d+\/tabelas\.json$/, "Tabelas", "arquivo"],
  [/^content\/leiautes\/\d+\/conferidos\.json$/, "Conferidos", "apoio"],
  [/^content\/legendas\.json$/, "Legendas", "arquivo"],
  [/^content\/regimes\.json$/, "Regimes", "arquivo"],
  [/^content\/grafo\.json$/, "Grafo", "arquivo"],
  [/^content\/blocos\.json$/, "Didaticos", "arquivo"],
  [/^content\/divergencias\.json$/, "Divergencias", "arquivo"],
  [/^content\/paginas\/[\w-]+\.json$/, "Pagina", "citacao"],
  [/^content\/quiz\/[\w-]+\.json$/, "Quiz", "citacao"],
  [/^content\/fontes\.json$/, "Fontes", "apoio"],
  [/^content\/exemplos\/lucro-real\.json$/, "ExemploReal", "apoio"],
  [/^content\/exemplos\/lucro-presumido\.json$/, "ExemploPresumido", "apoio"],
  [/^content\/exemplos\/ilustrativos\.json$/, "ExemplosIlustrativos", "apoio"],
  [/^content\/exemplos\/isenta\.json$/, "ExemploIsenta", "apoio"],
  [/^content\/roteiros\/[0-9a-z]\/[0-9a-z]{4}\.json$/, "Roteiro", "roteiro"],
  [/^content\/incentivos\/[a-z0-9-]+\.json$/, "Incentivo", "incentivo"],
  [/^content\/lc224\.json$/, "PaginaLc224", "apoio"],
];

const RASTREIO = new Set(["fonte", "norma", "leiautes", "vigencia", "verificadoEm"]);

export const eConteudo = (rel) => rel !== null && /^content\/.+\.(json|mdx)$/i.test(rel);

const cheio = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim() !== "" : v !== undefined && v !== null);

/** Campos obrigatórios da rastreabilidade que faltam no item. */
export function camposAusentes(x) {
  const faltam = [];
  if (!cheio(x?.fonte?.url)) faltam.push("fonte oficial (fonte.url)");
  if (!cheio(x?.norma)) faltam.push("norma");
  if (!cheio(x?.leiautes)) faltam.push("versão do leiaute (leiautes)");
  const anos = [...(x?.vigencia?.acNormal ?? []), ...(x?.vigencia?.situacaoEspecial ?? [])];
  if (anos.length === 0) faltam.push("ano-calendário (vigencia.acNormal)");
  if (!cheio(x?.verificadoEm)) faltam.push("data da última verificação (verificadoEm)");
  return faltam;
}

let schemas;
async function carregarSchemas() {
  schemas ??= await import(pathToFileURL(path.join(RAIZ, "src", "schemas", "index.ts")).href);
  return schemas;
}

function regrasExistentes() {
  const dir = path.join(RAIZ, "content", "regras");
  const ids = new Set();
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    try {
      for (const r of JSON.parse(readFileSync(path.join(dir, f), "utf8"))) ids.add(r.id);
    } catch {
      // Arquivo inválido é apontado quando ele próprio for validado.
    }
  }
  return ids;
}

/** Códigos de registro do leiaute 12, o que documenta a LC nº 224/2025. */
function registrosDoLeiaute12() {
  const dir = path.join(RAIZ, "content", "leiautes", "12", "registros");
  const cods = new Set();
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    try {
      for (const r of JSON.parse(readFileSync(path.join(dir, f), "utf8")).registros) cods.add(r.codigo);
    } catch {
      // Arquivo inválido é apontado quando ele próprio for validado.
    }
  }
  return cods;
}

/** Trechos internos marcados como "a verificar", com o caminho de cada um. */
function pendencias(x, caminho = []) {
  if (typeof x === "string") return /^a verificar(?![\p{L}])/iu.test(x) ? [caminho.join(".")] : [];
  if (x === null || typeof x !== "object") return [];
  return Object.entries(x).flatMap(([k, v]) => pendencias(v, [...caminho, Array.isArray(x) ? (v?.codigo ?? v?.campo ?? v?.id ?? k) : k]));
}

const nomear = (x, i) => x?.id ?? x?.codigo ?? x?.titulo ?? `item ${i + 1}`;
const mensagens = (erro, prefixo = []) =>
  erro.issues.slice(0, 12).map((e) => `${[...prefixo, ...e.path].join(".") || "(raiz)"}: ${e.message}`);

/** Devolve { erros: [{item, faltam, schema}], avisos: [texto] }. */
export async function validarArquivo(arquivo) {
  const rel = relativo(arquivo);
  const erros = [];
  const avisos = [];
  const regra = MAPA.find(([re]) => re.test(rel));
  if (!regra) {
    erros.push({ item: "(arquivo)", faltam: [], schema: [`não há schema Zod ligado a ${rel}; registre-o em .claude/hooks/lib/conteudo.mjs`] });
    return { erros, avisos };
  }
  const [, nome, modo] = regra;
  let dado;
  try {
    dado = JSON.parse(readFileSync(path.join(RAIZ, rel), "utf8"));
  } catch (e) {
    erros.push({ item: "(arquivo)", faltam: [], schema: [`JSON inválido: ${e.message}`] });
    return { erros, avisos };
  }
  const S = await carregarSchemas();
  const schema = S[nome];
  if (!schema) {
    erros.push({ item: "(arquivo)", faltam: [], schema: [`o schema ${nome} não existe em src/schemas/index.ts`] });
    return { erros, avisos };
  }

  const conferir = (item, rotulo, resultado) => {
    const faltam = camposAusentes(item);
    let sch = resultado.success ? [] : mensagens(resultado.error);
    if (item?.status === "a-verificar") {
      // Perdoa a falta de rastreabilidade, não um conteúdo malformado.
      const malformado = resultado.success ? [] : resultado.error.issues.filter((e) => !RASTREIO.has(String(e.path.find((p) => p !== "rastreio"))));
      if (malformado.length) erros.push({ item: rotulo, faltam: [], schema: mensagens({ issues: malformado }) });
      sch = [];
      avisos.push(`${rel} › ${rotulo}: marcado como "a verificar"${faltam.length ? `; faltam ${faltam.join(", ")} (o build do site só aceita o item depois de preenchidos)` : ""}`);
    } else if (faltam.length || sch.length) erros.push({ item: rotulo, faltam, schema: sch });
  };

  if (modo === "itens") {
    if (!Array.isArray(dado)) erros.push({ item: "(arquivo)", faltam: [], schema: ["era esperada uma lista"] });
    else {
      const ids = new Set();
      dado.forEach((x, i) => {
        conferir(x, nomear(x, i), schema.safeParse(x));
        if (x?.id && ids.has(x.id)) erros.push({ item: x.id, faltam: [], schema: ["id repetido no arquivo"] });
        ids.add(x?.id);
      });
    }
  } else if (modo === "item") {
    conferir(dado, nomear(dado, 0), schema.safeParse(dado));
  } else if (modo === "arquivo") {
    const r = schema.safeParse(dado);
    if (!dado?.rastreio) erros.push({ item: "(arquivo inteiro)", faltam: camposAusentes({}), schema: r.success ? [] : mensagens(r.error) });
    else conferir(dado.rastreio, "(arquivo inteiro)", r);
    for (const p of pendencias(dado)) avisos.push(`${rel} › ${p}: trecho "a verificar"`);
  } else if (modo === "roteiro") {
    const r = schema.safeParse(dado);
    if (!dado?.rastreio) erros.push({ item: "(arquivo inteiro)", faltam: camposAusentes({}), schema: r.success ? [] : mensagens(r.error) });
    else conferir(dado.rastreio, "(arquivo inteiro)", r);
    if (r.success) {
      const extra = await conferirRoteiro(rel, r.data);
      if (extra.erros.length) erros.push({ item: dado.registro, faltam: [], schema: extra.erros });
      avisos.push(...extra.avisos);
    }
  } else if (modo === "incentivo") {
    const r = schema.safeParse(dado);
    conferir(dado, nomear(dado, 0), r);
    if (r.success) {
      const extra = [];
      if (path.basename(rel, ".json") !== r.data.id) extra.push("o nome do arquivo precisa ser o id da ficha");
      const regs = registrosDoLeiaute12();
      const soltos = r.data.registros.filter((c) => !regs.has(c));
      if (soltos.length) extra.push(`registros que não existem no leiaute 12: ${soltos.join(", ")}`);
      const ids = regrasExistentes();
      const soltas = r.data.porAno.flatMap((p) => p.regras).filter((id) => !ids.has(id));
      if (soltas.length) extra.push(`cita regra inexistente: ${soltas.join(", ")}`);
      if (!r.data.porAno.some((p) => p.status !== "a-verificar") && r.data.situacao !== "a-verificar") extra.push("a situação não é 'a verificar', mas nenhum ano-calendário foi conferido");
      if (extra.length) erros.push({ item: r.data.id, faltam: [], schema: extra });
    }
  } else {
    const r = schema.safeParse(dado);
    if (!r.success) erros.push({ item: "(arquivo)", faltam: [], schema: mensagens(r.error) });
    else if (modo === "citacao") {
      const ids = regrasExistentes();
      const partes = Array.isArray(dado) ? dado : [...dado.resultados, ...dado.complementos];
      for (const x of partes) {
        const soltas = x.regras.filter((id) => !ids.has(id));
        if (soltas.length) erros.push({ item: x.id, faltam: [], schema: [`cita regra inexistente: ${soltas.join(", ")}`] });
      }
    }
  }
  return { erros, avisos };
}

export function todosOsArquivos() {
  const base = path.join(RAIZ, "content");
  if (!existsSync(base)) return [];
  return readdirSync(base, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && /\.(json|mdx)$/i.test(d.name))
    .map((d) => path.join(d.parentPath, d.name))
    .sort();
}

export function formatar(rel, erros) {
  return erros
    .map((e) => {
      const linhas = [`- ${rel} › ${e.item}`];
      if (e.faltam.length) linhas.push(`    campos ausentes: ${e.faltam.join("; ")}`);
      for (const s of e.schema) linhas.push(`    schema: ${s}`);
      return linhas.join("\n");
    })
    .join("\n");
}
