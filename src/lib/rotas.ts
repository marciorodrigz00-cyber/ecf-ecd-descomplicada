/** Rotas do site. A URL é a fonte da verdade do ano-calendário. */
export type Secao = {
  slug: string;
  titulo: string;
  curto: string;
  iniciante: string;
  profissional: string;
  fase: number;
};

export const SECOES: readonly Secao[] = [
  {
    slug: "o-que-e",
    titulo: "O que é a ECF",
    curto: "O que é",
    iniciante: "Descubra o que é esse arquivo, de onde ele veio e por que existe.",
    profissional: "Origem, base legal e posição no ecossistema SPED, com linha do tempo.",
    fase: 3,
  },
  {
    slug: "importancia",
    titulo: "Por que a ECF importa",
    curto: "Importância",
    iniciante: "Veja para que o Fisco usa a ECF e o que acontece quando ela atrasa.",
    profissional: "Cruzamentos, riscos e penalidades com o dispositivo legal de cada uma.",
    fase: 3,
  },
  {
    slug: "quem-deve-entregar",
    titulo: "Quem deve entregar",
    curto: "Quem entrega",
    iniciante: "Responda a um quiz curto e saiba se a sua empresa precisa entregar.",
    profissional: "Obrigatoriedade e dispensas por regime, com fundamento.",
    fase: 3,
  },
  {
    slug: "blocos",
    titulo: "Blocos e preenchimento",
    curto: "Blocos",
    iniciante: "Conheça cada parte do arquivo, uma de cada vez.",
    profissional: "Registros, campos, regras de validação e obrigatoriedade por regime.",
    fase: 4,
  },
  {
    slug: "exemplos",
    titulo: "Exemplos fictícios",
    curto: "Exemplos",
    iniciante: "Acompanhe três empresas inventadas, do balanço ao arquivo.",
    profissional: "Três escriturações coerentes, com cada registro explicado.",
    fase: 5,
  },
  {
    slug: "simulador",
    titulo: "Simulador de IRPJ e CSLL",
    curto: "Simulador",
    iniciante: "Digite os números e veja a conta ser feita passo a passo.",
    profissional: "Apuração com memória de cálculo e referência a cada regra.",
    fase: 5,
  },
  {
    slug: "novidades",
    titulo: "Novidades e legislação",
    curto: "Novidades",
    iniciante: "O que mudou, explicado em poucas linhas.",
    profissional: "Leiautes, normas, prazos e versões do programa, com a fonte oficial.",
    fase: 6,
  },
  {
    slug: "glossario",
    titulo: "Glossário",
    curto: "Glossário",
    iniciante: "Os termos técnicos, traduzidos para o dia a dia.",
    profissional: "Definições curtas com remissão aos registros.",
    fase: 7,
  },
];

const PREFIXO = /^\/ac\/(\d{4})(?=\/|$)/;

export function anoDaUrl(pathname: string, padrao: number): number {
  const m = PREFIXO.exec(pathname);
  return m ? Number(m[1]) : padrao;
}

/** Caminho sem o prefixo de ano. Sempre começa com "/". */
export function caminhoBase(pathname: string): string {
  const semAno = pathname.replace(PREFIXO, "").replace(/\/+$/, "");
  return semAno === "" ? "/" : semAno;
}

export function rota(base: string, ano: number, padrao: number): string {
  if (ano === padrao) return base;
  return base === "/" ? `/ac/${ano}` : `/ac/${ano}${base}`;
}

const AVULSAS = ["fontes", "preencher", "meu-progresso", "incentivos"];
/** Códigos de registro que não existem em cada ano. */
export type Ausentes = Readonly<Record<number, readonly string[]>>;

/** Mesmo lugar em outro ano. Registro ausente leva ao bloco; endereço desconhecido, ao início. */
export function rotaEmOutroAno(base: string, ano: number, padrao: number, ausentes: Ausentes): string {
  const [, secao, letra, registro] = base.split("/");
  if (base !== "/" && !AVULSAS.includes(secao!) && !SECOES.some((s) => s.slug === secao)) return rota("/", ano, padrao);
  if (secao === "blocos" && registro && ausentes[ano]?.includes(registro.toUpperCase())) return rota(`/blocos/${letra}`, ano, padrao);
  return rota(base, ano, padrao);
}

export function secaoDoCaminho(base: string): Secao | undefined {
  const primeiro = base.split("/")[1];
  return SECOES.find((s) => s.slug === primeiro);
}
