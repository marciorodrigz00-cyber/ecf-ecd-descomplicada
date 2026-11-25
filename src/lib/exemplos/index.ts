import { conferirRastreio, ler } from "@/lib/conteudo";
import { registroDoAno } from "@/lib/conteudo/leiautes";
import { parametros } from "@/lib/conteudo/tributos";
import * as S from "@/schemas";
import { moeda } from "@/lib/formatos";
import { montarIsenta, montarPresumido, montarReal, type Arquivo } from "./montar";
import { validarArquivo } from "./validar";

/** Exemplos montados e validados em build: linha fora do leiaute derruba o build. */
export const tabelas = ler("leiautes/12/tabelas.json", S.Tabelas);
conferirRastreio(tabelas.rastreio);
export const real = ler("exemplos/lucro-real.json", S.ExemploReal);
export const presumido = ler("exemplos/lucro-presumido.json", S.ExemploPresumido);
export const isenta = ler("exemplos/isenta.json", S.ExemploIsenta);

export const ANO_EXEMPLOS = real.ano;
const par = parametros(ANO_EXEMPLOS);
export const realMontado = montarReal(real, tabelas, par);
export const presumidoMontado = montarPresumido(presumido, tabelas, par);
export const isentaMontada = montarIsenta(isenta, tabelas);

const ultimoReal = realMontado.periodos.at(-1)!;
const ultimoPresumido = presumido.periodos.at(-1)!;
const somaAjustes = (tipo: string) =>
  ultimoReal.per.ajustes
    .filter((a) => tabelas.lalur.M300.find((l) => l.codigo === a.linha)!.lancamento === tipo)
    .reduce((s, a) => s + BigInt(a.valor), 0n);

/** Valores com que o simulador abre: o último trimestre das empresas fictícias. Zero fica em branco. */
export const entradaInicial: Record<string, string> = Object.fromEntries(
  Object.entries({
    lucro: ultimoReal.lucroAntes,
    adicoes: somaAjustes("A"),
    exclusoes: somaAjustes("E"),
    prejuizo: ultimoReal.antes.prejuizo,
    baseNegativa: ultimoReal.antes.baseNegativa,
    geral: BigInt(ultimoPresumido.receitas.geral),
    servicos: BigInt(ultimoPresumido.receitas.servicos),
    financeiras: BigInt(ultimoPresumido.financeiras),
    irRetidoP: BigInt(ultimoPresumido.irrf),
  })
    .filter(([, v]) => v !== 0n)
    .map(([k, v]) => [k, moeda(v).replace(/R\$\s/, "")]),
);

export type Exemplo = { dados: S.ExemploReal | S.ExemploPresumido | S.ExemploIsenta; arquivo: Arquivo };
export const exemplos: readonly Exemplo[] = [
  { dados: real, arquivo: realMontado.arquivo },
  { dados: presumido, arquivo: presumidoMontado.arquivo },
  { dados: isenta, arquivo: isentaMontada.arquivo },
];
export const exemplo = (slug: string) => exemplos.find((e) => e.dados.slug === slug);

for (const e of exemplos) {
  const problemas = validarArquivo(e.arquivo.linhas, (reg) => registroDoAno(reg, e.dados.ano));
  if (problemas.length) throw new Error(`Exemplo ${e.dados.slug} fora do leiaute:\n${problemas.join("\n")}`);
}