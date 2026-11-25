/** Única porta de saída de números e datas do site. Nenhum componente formata por conta própria. */
const LOCAL = "pt-BR";

const fInteiro = new Intl.NumberFormat(LOCAL, { maximumFractionDigits: 0 });
const fMoeda = new Intl.NumberFormat(LOCAL, { style: "currency", currency: "BRL" });
const fPercentual = new Intl.NumberFormat(LOCAL, {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const fData = new Intl.DateTimeFormat(LOCAL, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export const NAO_SE_APLICA = "—";

export function inteiro(n: number | null | undefined): string {
  return n == null ? NAO_SE_APLICA : fInteiro.format(n);
}

/** Recebe centavos. Usa string decimal para não perder precisão em valores grandes. */
export function moeda(centavos: bigint | null | undefined): string {
  if (centavos == null) return NAO_SE_APLICA;
  const negativo = centavos < 0n;
  const abs = negativo ? -centavos : centavos;
  const decimal = `${negativo ? "-" : ""}${abs / 100n}.${String(abs % 100n).padStart(2, "0")}`;
  // Espaço comum no lugar do não separável, para o texto ser igual em toda parte.
  return fMoeda.format(decimal as `${number}`).replace(/ /g, " ");
}

/** Recebe pontos-base: 1500 → 15 por cento. */
export function percentual(pontosBase: number | null | undefined): string {
  return pontosBase == null ? NAO_SE_APLICA : fPercentual.format(pontosBase / 10_000);
}

/** Recebe AAAA-MM-DD e devolve DD/MM/AAAA, sem deslocamento de fuso. */
export function data(iso: string | null | undefined): string {
  if (iso == null) return NAO_SE_APLICA;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Data inválida: ${iso}`);
  return fData.format(d);
}

/** Impede quebra de linha dentro de "R$ 1,00", "nº 1" e "§ 1º". */
export function semQuebra(texto: string): string {
  return texto.replace(/(R\$|nº|§|art\.|arts\.) (?=\d)/gi, "$1\u00a0");
}

export function ordinal(n: number): string {
  return `${fInteiro.format(n)}º`;
}
