import { readFileSync } from "node:fs";

/** O que o monitor lê. Endereços fixos no código ou no conteúdo revisado do site: nada vem de fora. */
export type Alvo = {
  id: string;
  nome: string;
  url: string;
  /** Página para uma pessoa conferir. */
  pagina: string;
  tipo: "plone-lista" | "plone-pagina" | "norma" | "html";
  /** Só para html: trechos que interessam. Cada um precisa ser encontrado, senão a estrutura mudou. */
  trechos?: RegExp[];
  /** Alguma linha lida precisa casar com esta expressão; senão, a fonte não diz o que o site afirma. */
  exige?: RegExp;
  confianca: "primaria" | "secundaria";
};

const SPED = "https://www.gov.br/sped/++api++/pt-br/assuntos/";
const VER = "https://www.gov.br/sped/pt-br/assuntos/";
const NORMAS = "https://normasinternet2.receita.fazenda.gov.br/";

/** Comunicado citado no site como fonte da versão do programa. O endereço do gov.br pode herdar nome de outra versão. */
const programa = JSON.parse(readFileSync(new URL("../../content/programa.json", import.meta.url), "utf8")) as { versao: string; fonte: { url: string } };
if (!programa.fonte.url.startsWith(`${VER}comunicados/ecf/`)) throw new Error("Comunicado do programa fora do portal do Sped");
const versao = programa.versao.replaceAll(".", "\\.");

export const ALVOS: readonly Alvo[] = [
  {
    id: "comunicado-programa",
    nome: `Comunicado da versão ${programa.versao} do programa da ECF`,
    url: programa.fonte.url.replace(VER, SPED),
    pagina: programa.fonte.url,
    tipo: "plone-pagina",
    exige: new RegExp(`Vers[ãa]o ${versao}(?!\\.?\\d)`, "i"),
    confianca: "primaria",
  },
  {
    id: "programa-ecf",
    nome: "Download do programa da ECF",
    url: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/sped/ecf",
    pagina: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/sped/ecf",
    tipo: "html",
    trechos: [/Programa ECF\s+Vers[ãa]o\s*\d+(?:\.\d+)+/gi, /SpedE(?:cf|CF)_[\w-]+?-\d+(?:\.\d+)+\.(?:exe|sh)/gi],
    confianca: "primaria",
  },
  {
    id: "comunicados-ecf",
    nome: "Comunicados da ECF no portal do Sped",
    url: `${SPED}comunicados/ecf?b_size=100`,
    pagina: `${VER}comunicados/ecf`,
    tipo: "plone-lista",
    confianca: "primaria",
  },
  {
    id: "tabelas-dinamicas",
    nome: "Atualizações das tabelas dinâmicas do leiaute 12",
    url: `${SPED}comunicados/ecf/atualizacoes-do-arquivo-de-tabelas-dinamicas-leiaute-12`,
    pagina: `${VER}comunicados/ecf/atualizacoes-do-arquivo-de-tabelas-dinamicas-leiaute-12`,
    tipo: "plone-pagina",
    confianca: "primaria",
  },
  {
    id: "manuais-ecf",
    nome: "Manuais e documentos técnicos da ECF",
    url: `${SPED}escrituracoes-digitais/ecf/manuais-e-documentos-tecnicos?b_size=100`,
    pagina: `${VER}escrituracoes-digitais/ecf/manuais-e-documentos-tecnicos`,
    tipo: "plone-lista",
    confianca: "primaria",
  },
  {
    id: "modulo-ecf",
    nome: "Página da ECF no portal do Sped",
    url: `${SPED}escrituracoes-digitais/ecf`,
    pagina: `${VER}escrituracoes-digitais/ecf`,
    tipo: "plone-pagina",
    confianca: "primaria",
  },
  {
    id: "servico-ecf",
    nome: "Serviço: Entregar Escrituração Contábil Fiscal",
    url: "https://www.gov.br/pt-br/servicos/entregar-escrituracao-contabil-fiscal",
    pagina: "https://www.gov.br/pt-br/servicos/entregar-escrituracao-contabil-fiscal",
    tipo: "html",
    trechos: [/[ÚU]ltima Modifica[çc][ãa]o:?\s*\d{2}\/\d{2}\/\d{4}/gi],
    confianca: "primaria",
  },
  {
    id: "in-2004",
    nome: "Instrução Normativa RFB nº 2.004/2021",
    url: `${NORMAS}api/consulta-externa/ato/114966/visao/multivigente`,
    pagina: `${NORMAS}#/consulta/externa/114966`,
    tipo: "norma",
    confianca: "primaria",
  },
  {
    id: "in-2305",
    nome: "Instrução Normativa RFB nº 2.305/2025 (redução linear, LC 224)",
    url: `${NORMAS}api/consulta-externa/ato/148694/visao/multivigente`,
    pagina: `${NORMAS}#/consulta/externa/148694`,
    tipo: "norma",
    confianca: "primaria",
  },
  {
    id: "pr-lc224",
    nome: "Perguntas e Respostas da Receita sobre a redução de benefícios (LC 224)",
    url: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/beneficios-fiscais",
    pagina: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/beneficios-fiscais",
    tipo: "html",
    // O nome do arquivo traz a versão: uma versão nova muda o trecho e gera rascunho para revisão.
    trechos: [/perguntas-e-respostas-reducao-dos-incentivos-e-beneficios-tributarios-v\d+[a-z0-9-]*\.pdf/gi],
    confianca: "primaria",
  },
  {
    id: "sped-antigo",
    nome: "Destaques da ECF no portal antigo do Sped",
    url: "http://sped.rfb.gov.br/projeto/show/269",
    pagina: "http://sped.rfb.gov.br/projeto/show/269",
    tipo: "html",
    trechos: [/[^\n]{3,160}\n?\s*\(\d{2}\/\d{2}\/\d{4}\)/g],
    confianca: "secundaria",
  },
];

/** Sem leitura automática: viram lembrete em todo relatório. */
export const MANUAIS: readonly { nome: string; url: string; motivo: string }[] = [
  { nome: "Diário Oficial da União", url: "https://www.in.gov.br/consulta", motivo: "O site recusa acesso automático (403). O INLABS exige cadastro." },
  { nome: "Busca de normas da Receita Federal", url: "https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=ECF", motivo: "A busca não tem endereço de leitura simples." },
  { nome: "Leis no portal do Planalto", url: "https://www.planalto.gov.br/legislacao", motivo: "Mudam pouco; conferir quando um ato citar alteração." },
  { nome: "LC nº 224/2025 (texto compilado)", url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp224.htm", motivo: "Já alterada pelas LCs 235 e 239 de 2026; conferir a cada nova lei complementar sobre benefícios." },
  { nome: "Demonstrativo de gastos tributários (LOA)", url: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/relatorios/renuncia/gastos-tributarios-ploa", motivo: "Com a LC nº 239/2026, a lista dos benefícios alcançados passa a seguir a LOA de cada ano." },
];
