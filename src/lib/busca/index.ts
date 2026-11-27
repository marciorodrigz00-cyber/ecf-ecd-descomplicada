/** Busca local, sem biblioteca: o índice tem poucos milhares de linhas curtas. */
export const TIPOS = ["bloco", "registro", "campo", "termo", "secao", "novidade", "regra"] as const;
export type TipoItem = (typeof TIPOS)[number];
/** Compacto de propósito: [índice do tipo, código, título, endereço, texto extra para achar]. */
export type LinhaIndice = [tipo: number, codigo: string, titulo: string, href: string, extra: string];
export type Resultado = { tipo: TipoItem; codigo: string; titulo: string; href: string };

/** Sem acento, sem caixa, sem espaço sobrando. */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const pontos = (codigo: string, titulo: string, extra: string, termos: string[], inteira: string): number => {
  if (codigo === inteira) return 1000;
  if (titulo === inteira) return 900;
  const tudo = `${codigo} ${titulo} ${extra}`;
  if (!termos.every((t) => tudo.includes(t))) return 0;
  let p = 10;
  if (codigo.startsWith(inteira)) p += 500;
  // Nome exato do campo, sem o registro na frente (COD_SCP acha 0035.COD_SCP).
  if (codigo.endsWith(`.${inteira}`)) p += 400;
  if (titulo.startsWith(inteira)) p += 300;
  // Início de palavra vale mais que o meio dela.
  for (const t of termos) if (new Set(`${codigo} ${titulo}`.split(/[\s./()-]+/)).has(t)) p += 60;
  else if (`${codigo} ${titulo}`.split(/[\s./()-]+/).some((x) => x.startsWith(t))) p += 30;
  return p;
};
/** Empate: o que a pessoa costuma querer primeiro. */
const PESO: Record<TipoItem, number> = { bloco: 50, secao: 45, termo: 40, registro: 35, novidade: 10, campo: 0, regra: 0 };

export type Indice = { linhas: readonly LinhaIndice[]; chaves: readonly [string, string, string][] };
export function preparar(linhas: readonly LinhaIndice[]): Indice {
  return { linhas, chaves: linhas.map(([, c, t, , x]) => [normalizar(c), normalizar(t), normalizar(x)]) };
}

export function buscar({ linhas, chaves }: Indice, consulta: string, limite = 40): Resultado[] {
  const inteira = normalizar(consulta).slice(0, 80);
  if (inteira === "") return [];
  const termos = inteira.split(" ");
  return linhas
    .map((l, i) => ({ l, i, p: pontos(...chaves[i]!, termos, inteira) }))
    .filter((x) => x.p > 0)
    .map((x) => ({ ...x, p: x.p + PESO[TIPOS[x.l[0]]!] }))
    // A posição original desempata: filtrar nunca muda a ordem entre iguais.
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .slice(0, limite)
    .map(({ l }) => ({ tipo: TIPOS[l[0]]!, codigo: l[1], titulo: l[2], href: l[3] }));
}

/** Resultados juntos por tipo. Os grupos seguem a ordem do melhor resultado de cada um; dentro do grupo, a ordem não muda. */
export function agrupar(rs: readonly Resultado[]): Resultado[] {
  const ordem: TipoItem[] = [];
  for (const r of rs) if (!ordem.includes(r.tipo)) ordem.push(r.tipo);
  return ordem.flatMap((t) => rs.filter((r) => r.tipo === t));
}
