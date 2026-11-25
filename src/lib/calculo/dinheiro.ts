/** Dinheiro em centavos (bigint) e percentuais em pontos-base inteiros. Nada de ponto flutuante. */
export type Centavos = bigint;

/** valor × pontosBase / 10.000, arredondado ao centavo, metade para longe do zero. */
export function aplicar(valor: Centavos, pontosBase: number): Centavos {
  const bruto = valor * BigInt(pontosBase);
  const meio = bruto < 0n ? -5000n : 5000n;
  return (bruto + meio) / 10000n;
}

export const positivo = (v: Centavos): Centavos => (v > 0n ? v : 0n);
export const menor = (a: Centavos, b: Centavos): Centavos => (a < b ? a : b);
export const soma = (...vs: Centavos[]): Centavos => vs.reduce((a, b) => a + b, 0n);

const LIMITE = 10n ** 15n;

/** Lê "1.234,56", "1234,5", "-10" ou "". Vazio vale zero; o que não for número pt-BR devolve null. */
export function lerDinheiro(texto: string): Centavos | null {
  const t = texto.replace(/\s|R\$/g, "").replace(/[−–]/g, "-");
  if (t === "") return 0n;
  if (!/^-?(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(t)) return null;
  const negativo = t.startsWith("-");
  const [inteiro, decimal = ""] = t.replace("-", "").replaceAll(".", "").split(",") as [string, string?];
  const v = BigInt(inteiro) * 100n + BigInt(decimal.padEnd(2, "0"));
  if (v > LIMITE) return null;
  return negativo ? -v : v;
}
