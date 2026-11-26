/**
 * Arquivo da ECF como árvore: cada linha sabe o pai e o período de apuração.
 * Puro e sem atalhos de caminho: o hook do Claude Code também importa este arquivo.
 */

export type CampoLeiaute = { nome: string };
export type RegistroLeiaute = { codigo: string; nivel: string; campos: CampoLeiaute[] };
export type LinhaBruta = { reg: string; campos: string[] };
export type LinhaArq = {
  indice: number;
  reg: string;
  /** Valor de cada campo pelo nome, incluindo REG. */
  v: Record<string, string>;
  pai: number | null;
  /** PER_APUR do registro de período (K030, L030, M030…) acima da linha. */
  periodo: string | null;
};

/** “|0035|111|SCP|” a partir dos valores, na ordem do leiaute. Nunca escrita à mão. */
export const montarLinha = (reg: string, campos: readonly string[]) => `|${[reg, ...campos].join("|")}|`;

/** “|A|B|” → ["A", "B"]. */
export const separarLinha = (linha: string) => linha.split("|").slice(1, -1);

export function montarArquivo(linhas: readonly LinhaBruta[], leiaute: (reg: string) => RegistroLeiaute | undefined): LinhaArq[] {
  const saida: LinhaArq[] = [];
  // Último índice visto em cada nível: o pai é o mais próximo acima, num nível menor.
  const pilha: { nivel: number; indice: number }[] = [];
  for (const [indice, l] of linhas.entries()) {
    const r = leiaute(l.reg);
    if (!r) throw new Error(`Registro ${l.reg} fora do leiaute`);
    const nivel = Number(r.nivel);
    if (!Number.isInteger(nivel)) throw new Error(`Nível ${r.nivel} inválido em ${l.reg}`);
    if (r.campos.length !== l.campos.length + 1) throw new Error(`${l.reg}: ${l.campos.length} campos, o leiaute tem ${r.campos.length - 1}`);
    while (pilha.length && pilha.at(-1)!.nivel >= nivel) pilha.pop();
    const pai = pilha.at(-1)?.indice ?? null;
    const v = Object.fromEntries(r.campos.map((c, i) => [c.nome, i === 0 ? l.reg : l.campos[i - 1]!]));
    const doPai = pai === null ? null : saida[pai]!;
    const periodo = /^[A-Z]030$/.test(l.reg) ? (v.PER_APUR ?? null) : (doPai?.periodo ?? null);
    saida.push({ indice, reg: l.reg, v, pai, periodo });
    pilha.push({ nivel, indice });
  }
  return saida;
}
