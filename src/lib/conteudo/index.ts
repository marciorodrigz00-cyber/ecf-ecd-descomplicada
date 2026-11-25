import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import * as S from "@/schemas";
import { data, moeda, percentual } from "@/lib/formatos";
import { validarQuiz } from "@/lib/quiz";

/** Leitura em tempo de build. Conteúdo inválido derruba o build. */
const RAIZ = path.join(process.cwd(), "content");

export function ler<T>(relativo: string, schema: z.ZodType<T>): T {
  const r = schema.safeParse(JSON.parse(readFileSync(path.join(RAIZ, relativo), "utf8")));
  if (!r.success) throw new Error(`Conteúdo inválido em content/${relativo}\n${z.prettifyError(r.error)}`);
  return r.data;
}

export const fontes = ler("fontes.json", S.Fontes);
export const leiautePorAno = ler("leiautes/anos.json", S.LeiautePorAno);
export const programa = ler("programa.json", S.Programa);

export const regras = readdirSync(path.join(RAIZ, "regras"))
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => ler(`regras/${f}`, z.array(S.Regra)));

export const leiautes = readdirSync(path.join(RAIZ, "leiautes"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map(({ name: n }) => ler(`leiautes/${n}/leiaute.json`, S.Leiaute))
  .sort((a, b) => b.anoCalendario - a.anoCalendario);

export const linhaDoTempo = ler("linha-do-tempo.json", z.array(S.Evento).min(1));
export const paginas = {
  "o-que-e": ler("paginas/o-que-e.json", S.Pagina),
  importancia: ler("paginas/importancia.json", S.Pagina),
};
export const novidades = readdirSync(path.join(RAIZ, "novidades"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const n = ler(`novidades/${f}`, S.Novidade);
    if (f !== `${n.data}-${n.slug}.json`) throw new Error(`novidades/${f}: o nome precisa ser data-slug`);
    return n;
  })
  .sort((a, b) => b.data.localeCompare(a.data) || a.slug.localeCompare(b.slug));
export const glossario = ler("glossario.json", z.array(S.Termo).min(1));
export const quiz = ler("quiz/quem-deve-entregar.json", S.Quiz);

export const anos = leiautes.map((l) => l.anoCalendario);
export const ANO_PADRAO = anos[0]!;

// Integridade entre arquivos: ids únicos e fontes existentes.
const rastreaveis = [programa, ...leiautes, ...regras, ...linhaDoTempo, ...novidades];
const ids = new Set<string>();

/** Leiautes da vigência, pela tabela oficial do Manual. */
export function leiautesDaVigencia({ acNormal, situacaoEspecial }: S.Rastreio["vigencia"]): string[] {
  return leiautePorAno.linhas
    .filter((l) => acNormal.includes(l.anoCalendario) || situacaoEspecial.includes(l.situacaoEspecial))
    .map((l) => l.leiaute);
}

/** Id único, fonte do catálogo e leiautes coerentes com os anos. */
export function conferirRastreio(item: S.Rastreio): void {
  if (ids.has(item.id)) throw new Error(`id repetido: ${item.id}`);
  ids.add(item.id);
  if (!fontes.some((f) => f.id === item.fonte.id)) throw new Error(`${item.id}: fonte inexistente (${item.fonte.id})`);
  const esperados = leiautesDaVigencia(item.vigencia).join();
  if (item.status !== "a-verificar" && item.leiautes.join() !== esperados) {
    throw new Error(`${item.id}: leiautes ${item.leiautes.join()}, a tabela oficial dá ${esperados}`);
  }
}
[leiautePorAno.rastreio, ...rastreaveis].forEach(conferirRastreio);

// O id do termo é a âncora da página: espaço próprio, sem misturar com os ids das regras.
for (const t of glossario) conferirRastreio({ ...t, id: `termo-${t.id}` });
const nomesDeTermos = glossario.flatMap((t) => [t.termo, ...t.sinonimos]).map((x) => x.toLowerCase());
if (new Set(nomesDeTermos).size !== nomesDeTermos.length) throw new Error("glossário: nome repetido");

// Toda regra citada em texto ou quiz precisa existir em todos os anos oferecidos.
const citadas = [
  ...Object.values(paginas).flat(),
  ...quiz.resultados,
  ...quiz.complementos,
  ...glossario,
].flatMap((x) => x.regras);
for (const id of citadas) {
  for (const a of anos) {
    if (!regras.some((r) => r.id === id && r.vigencia.acNormal.includes(a))) {
      throw new Error(`Regra citada e inexistente: ${id} (AC ${a})`);
    }
  }
}
validarQuiz(quiz);

export function leiauteDoAno(ano: number): S.Leiaute {
  const l = leiautes.find((x) => x.anoCalendario === ano);
  if (!l) throw new Error(`Ano-calendário sem leiaute: ${ano}`);
  return l;
}

export function regra(id: string, ano: number): S.Regra {
  const r = regras.find((x) => x.id === id && x.vigencia.acNormal.includes(ano));
  if (!r) throw new Error(`Regra ${id} não existe para o AC ${ano}`);
  return r;
}

export function textoDoValor(v: S.Valor): string {
  switch (v.tipo) {
    case "texto":
      return v.texto;
    case "dinheiro":
      return moeda(BigInt(v.centavos));
    case "percentual":
      return percentual(v.pontosBase);
    case "data":
      return data(v.data);
  }
}

/** O selo usa sempre a data mais antiga entre os itens exibidos. */
export function verificacaoMaisAntiga(itens: { verificadoEm: string }[]): string {
  if (itens.length === 0) throw new Error("Selo sem itens");
  return itens.map((i) => i.verificadoEm).sort()[0]!;
}

export { rastreaveis };
