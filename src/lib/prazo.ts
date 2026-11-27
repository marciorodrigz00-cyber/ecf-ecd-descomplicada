/**
 * Prazo da ECF pela regra geral (IN RFB nº 2.004/2021, art. 3º): último dia útil de julho do ano seguinte ao ano-calendário.
 * Julho não tem feriado nacional, então o último dia útil é o último dia de semana do mês. A data é derivada da regra
 * e a interface diz isso.
 */
export function prazoDoAno(ac: number): string {
  const d = new Date(Date.UTC(ac + 1, 6, 31));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export type Prazo = { ac: number; data: string };
export type Situacao = { tipo: "contagem"; ac: number; data: string; dias: number } | { tipo: "a-confirmar"; ac: number };

function dias(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);
}

/**
 * O prazo do ano escolhido, se ainda não passou; senão, o próximo com regra cadastrada.
 * Sem regra para o ano seguinte, o próximo prazo fica "a confirmar": nada de data inventada.
 */
export function situacaoDoPrazo(prazos: Prazo[], ano: number, hoje: string): Situacao {
  const ordem = [...prazos].sort((a, b) => a.ac - b.ac);
  const doAno = ordem.find((p) => p.ac === ano && p.data >= hoje);
  const proximo = doAno ?? ordem.find((p) => p.ac > ano && p.data >= hoje) ?? ordem.find((p) => p.data >= hoje);
  if (proximo) return { tipo: "contagem", ac: proximo.ac, data: proximo.data, dias: dias(hoje, proximo.data) };
  const ultimo = ordem.at(-1)?.ac ?? ano;
  return { tipo: "a-confirmar", ac: ultimo + 1 };
}

/** Quantos itens caem nos últimos `janela` dias, contando hoje. */
export function recentes(datas: string[], hoje: string, janela = 90): number {
  return datas.filter((d) => d <= hoje && dias(d, hoje) < janela).length;
}
