export const CHAVE = "ecf:preferencias:v1";

export type Nivel = "iniciante" | "profissional";
export type Tema = "light" | "dark";
/** Os mesmos ids de content/regimes.json (um teste confere). */
export const REGIMES_PERFIL = ["real", "presumido", "arbitrado", "imune", "isenta"] as const;
export type RegimePerfil = (typeof REGIMES_PERFIL)[number];
export type Preferencias = {
  nivel: Nivel;
  /** null = escuro, o padrão do site */
  tema: Tema | null;
  /** null = ano padrão */
  ano: number | null;
  /** slugs das seções já estudadas */
  estudadas: string[];
  /** etapa atual do roteiro de preenchimento, por regime */
  roteiro: { regime: string; passo: number } | null;
  /** letras dos blocos e códigos dos registros já abertos */
  blocos: string[];
  registros: string[];
  /** marcos únicos: quiz, simulador, percurso */
  feitos: string[];
  /** teclas de atalho ligadas */
  atalhos: boolean;
  /** regime do perfil; null = ainda não sabe ou não respondeu */
  regime: RegimePerfil | null;
  /** o cartão de perfil já foi respondido ou pulado */
  perfil: "respondido" | "pulado" | null;
};

export const PADRAO: Preferencias = {
  nivel: "iniciante",
  tema: null,
  ano: null,
  estudadas: [],
  roteiro: null,
  blocos: [],
  registros: [],
  feitos: [],
  atalhos: true,
  regime: null,
  perfil: null,
};

/** Aceita qualquer coisa que esteja no armazenamento e devolve sempre um estado válido. */
export function interpretar(cru: string | null): Preferencias {
  if (!cru) return PADRAO;
  let v: unknown;
  try {
    v = JSON.parse(cru);
  } catch {
    return PADRAO;
  }
  if (typeof v !== "object" || v === null || Array.isArray(v)) return PADRAO;
  const o = v as Record<string, unknown>;
  return {
    nivel: o.nivel === "profissional" ? "profissional" : "iniciante",
    tema: o.tema === "light" || o.tema === "dark" ? o.tema : null,
    ano: typeof o.ano === "number" && Number.isInteger(o.ano) ? o.ano : null,
    estudadas: lista(o.estudadas, /^[a-z-]{1,40}$/, 50),
    roteiro: interpretarRoteiro(o.roteiro),
    blocos: lista(o.blocos, /^[0-9A-Z]$/, 36),
    registros: lista(o.registros, /^[0-9A-Z]\d{3}$/, 400),
    feitos: lista(o.feitos, /^(?:quiz|simulador|percurso)$/, 3),
    atalhos: o.atalhos !== false,
    regime: REGIMES_PERFIL.find((r) => r === o.regime) ?? null,
    perfil: o.perfil === "respondido" || o.perfil === "pulado" ? o.perfil : null,
  };
}

/** Só textos no formato esperado, sem repetição e com limite. */
function lista(v: unknown, formato: RegExp, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === "string" && formato.test(x)))].slice(0, max);
}

function interpretarRoteiro(v: unknown): Preferencias["roteiro"] {
  if (typeof v !== "object" || v === null) return null;
  const { regime, passo } = v as Record<string, unknown>;
  if (typeof regime !== "string" || !/^[a-z]{1,20}$/.test(regime)) return null;
  if (typeof passo !== "number" || !Number.isInteger(passo) || passo < 0 || passo > 50) return null;
  return { regime, passo };
}

export function alternarEstudada(estudadas: string[], slug: string): string[] {
  return estudadas.includes(slug) ? estudadas.filter((s) => s !== slug) : [...estudadas, slug];
}
