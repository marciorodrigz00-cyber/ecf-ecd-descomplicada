import type { z } from "zod";
import * as S from "@/schemas";
import { anos, conferirRastreio, ler, leiautes, leiauteDoAno } from "./index";
import type { Registro } from "@/schemas";

/** Registros, matriz de regimes, grafo e textos didáticos. Lidos e validados em build. */
const arquivoDidatico = ler("blocos.json", S.Didaticos);
export const didaticos = arquivoDidatico.blocos;
export const regimes = ler("regimes.json", S.Regimes);
export const grafo = ler("grafo.json", S.Grafo);
const arquivoDivergencias = ler("divergencias.json", S.Divergencias);
export const divergencias = arquivoDivergencias.itens;
export const legendas = ler("legendas.json", S.Legendas);

/** Fonte única do nome de um bloco: oficial, do leiaute do ano; curto e descrição, dos textos didáticos. */
export function nomeBloco(letra: string, ano: number): { letra: string; nome: string; curto: string; objetivo: string; ecd: boolean } {
  const oficial = leiauteDoAno(ano).blocos.find((b) => b.letra === letra);
  if (!oficial) throw new Error(`Bloco ${letra} não existe no AC ${ano}`);
  const d = didatico(letra);
  return { letra, nome: oficial.nome, curto: d.curto, objetivo: d.objetivo, ecd: d.ecd === true };
}

for (const a of [arquivoDidatico, regimes, grafo, arquivoDivergencias, legendas]) conferirRastreio(a.rastreio);

type Dados = { registros: Registro[]; descricoes: Map<string, string>; conferidos: z.infer<typeof S.Conferidos> };

const porLeiaute = new Map<string, Dados>(
  leiautes.map((l) => {
    const arquivos = l.blocos.map((b) => ler(`leiautes/${l.numero}/registros/${b.letra}.json`, S.ArquivoRegistros));
    for (const a of arquivos) conferirRastreio(a.rastreio);
    const registros = arquivos.flatMap((a) => a.registros);
    const conferidos = ler(`leiautes/${l.numero}/conferidos.json`, S.Conferidos);
    return [
      l.numero,
      { registros, descricoes: new Map(arquivos.map((a) => [a.bloco, a.descricao])), conferidos },
    ];
  }),
);

// Integridade: códigos únicos, referências existentes nos dois leiautes.
for (const l of leiautes) {
  const { registros } = porLeiaute.get(l.numero)!;
  const codigos = new Set(registros.map((r) => r.codigo));
  if (codigos.size !== registros.length) throw new Error(`Leiaute ${l.numero}: registro repetido`);
  const letras = l.blocos.map((b) => b.letra);
  const exige = (cod: string, regra: string | null, onde: string) => {
    const r = registros.find((x) => x.codigo === cod);
    if (!r) throw new Error(`${onde}: registro ${cod} não existe no leiaute ${l.numero}`);
    if (regra && !regrasDe(r).includes(regra)) throw new Error(`${onde}: ${cod}.${regra} não existe no leiaute ${l.numero}`);
  };
  if (didaticos.map((d) => d.letra).join() !== letras.join()) throw new Error("blocos.json fora da ordem do leiaute");
  if (regimes.linhas.map((x) => x.bloco).join() !== letras.join()) throw new Error("regimes.json fora da ordem do leiaute");
  for (const d of didaticos) for (const e of d.erros) exige(e.registro, e.regra, `erro do bloco ${d.letra}`);
  for (const x of regimes.linhas) for (const cod of x.base) exige(cod, null, `regime do bloco ${x.bloco}`);
  const nos = new Set([...letras, ...grafo.externos.map((x) => x.id)]);
  for (const a of grafo.arestas) {
    if (!nos.has(a.de) || !nos.has(a.para)) throw new Error(`grafo: ${a.de}→${a.para}`);
    exige(a.base.registro, a.base.regra, `grafo ${a.de}→${a.para}`);
  }
}

export function regrasDe(r: Registro): string[] {
  return [...r.regrasRegistro, ...r.regrasCampo.flatMap((c) => c.regras)].map((x) => x.codigo);
}

function dados(ano: number): Dados {
  return porLeiaute.get(leiauteDoAno(ano).numero)!;
}

export const registrosDoAno = (ano: number) => dados(ano).registros;
export const registrosDoBloco = (letra: string, ano: number) => dados(ano).registros.filter((r) => r.codigo[0] === letra);
export const registroDoAno = (codigo: string, ano: number) => dados(ano).registros.find((r) => r.codigo === codigo);

/** Âncora de cada campo pelo nome: COD_SCP → "cod-scp"; nome repetido no registro ganha o número da ocorrência ("valor-2"). */
export function ancorasDosCampos<C extends { nome: string }>(campos: readonly C[]): [C, string][] {
  const vistos = new Map<string, number>();
  return campos.map((c) => {
    const base = c.nome.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
    const n = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, n);
    return [c, n === 1 ? base : `${base}-${n}`];
  });
}

/**
 * Âncora de cada regra, na ordem da página: primeiro as do registro, depois as dos campos.
 * "regra-regra-cnpj-diferente-scp" (do registro) ou "regra-cod-scp-regra-cnpj-diferente-scp" (do campo); repetida ganha o número.
 */
export function ancorasDasRegras(r: Registro) {
  const vistos = new Map<string, number>();
  const ancora = (base: string) => {
    const n = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  const limpo = (s: string) => s.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
  return [
    ...r.regrasRegistro.map((x) => ({ campo: "*", tipo: null as string | null, ...x, ancora: ancora(`regra-${limpo(x.codigo)}`) })),
    ...r.regrasCampo.flatMap((g) => g.regras.map((x) => ({ campo: g.campo, ...x, ancora: ancora(`regra-${limpo(g.campo)}-${limpo(x.codigo)}`) }))),
  ];
}

/** Registros na ordem do arquivo (blocos na ordem do leiaute), com o anterior e o próximo, atravessando blocos. */
export function vizinhos(codigo: string, ano: number) {
  const ordem = leiauteDoAno(ano).blocos.flatMap((b) => registrosDoBloco(b.letra, ano));
  const i = ordem.findIndex((r) => r.codigo === codigo);
  return { anterior: i > 0 ? ordem[i - 1]! : null, proximo: i >= 0 && i < ordem.length - 1 ? ordem[i + 1]! : null, posicao: i + 1, total: ordem.length };
}

/** Para cada ano, os registros que existem em outro ano mas não neste (o seletor de ano avisa). */
export function ausentesPorAno(): Record<number, string[]> {
  const codigos = new Set(anos.flatMap((a) => registrosDoAno(a).map((r) => r.codigo)));
  return Object.fromEntries(anos.map((a) => [a, [...codigos].filter((c) => !registroDoAno(c, a))]));
}
export const descricaoOficial = (letra: string, ano: number) => dados(ano).descricoes.get(letra)!;
export const conferencia = (ano: number) => dados(ano).conferidos;
export const statusRegistro = (codigo: string, ano: number): S.Status =>
  dados(ano).conferidos.codigos.includes(codigo) ? "conferido" : "extraido";
export const didatico = (letra: string) => didaticos.find((d) => d.letra === letra)!;
export const linhaRegime = (letra: string) => regimes.linhas.find((l) => l.bloco === letra)!;

export type Mudanca = { tipo: "novo" } | { tipo: "alterado"; itens: string[] } | null;

/** Compara com o leiaute anterior oferecido. Só estrutura, não redação. */
export function mudancas(codigo: string, ano: number): { de: string; mudanca: Mudanca } | null {
  const i = leiautes.findIndex((l) => l.anoCalendario === ano);
  const anterior = leiautes[i + 1];
  const atual = registroDoAno(codigo, ano);
  if (!anterior || !atual) return null;
  const antes = registroDoAno(codigo, anterior.anoCalendario);
  if (!antes) return { de: anterior.numero, mudanca: { tipo: "novo" } };
  const itens: string[] = [];
  const nomes = (r: Registro) => new Set(r.campos.map((c) => c.nome));
  for (const c of atual.campos) if (!nomes(antes).has(c.nome)) itens.push(`Campo novo: ${c.nome}`);
  for (const c of antes.campos) if (!nomes(atual).has(c.nome)) itens.push(`Campo removido: ${c.nome}`);
  for (const c of atual.campos) {
    const x = antes.campos.find((y) => y.nome === c.nome);
    if (!x) continue;
    if (x.obrigatorio !== c.obrigatorio) itens.push(`${c.nome}: obrigatoriedade de “${x.obrigatorio}” para “${c.obrigatorio}”`);
    if (x.tamanho !== c.tamanho || x.tipo !== c.tipo || x.decimal !== c.decimal) itens.push(`${c.nome}: formato alterado`);
    if (x.valores.replace(/\s/g, "") !== c.valores.replace(/\s/g, "")) itens.push(`${c.nome}: valores válidos alterados`);
  }
  if (antes.saida.replace(/\s/g, "") !== atual.saida.replace(/\s/g, "")) itens.push("Condição de obrigatoriedade do registro alterada");
  for (const r of regrasDe(atual)) if (!regrasDe(antes).includes(r)) itens.push(`Regra nova: ${r}`);
  return { de: anterior.numero, mudanca: itens.length ? { tipo: "alterado", itens: [...new Set(itens)] } : null };
}
