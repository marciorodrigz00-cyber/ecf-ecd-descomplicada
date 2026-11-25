import { ler } from "@/lib/conteudo";
import { legendas, linhaRegime, registroDoAno } from "@/lib/conteudo/leiautes";
import * as S from "@/schemas";
import type { Registro } from "@/schemas";
import { ANO_EXEMPLOS, exemplos } from "./index";
import { validarArquivo } from "./validar";

export const ilustrativos = ler("exemplos/ilustrativos.json", S.ExemplosIlustrativos);

export type ParteExemplo = {
  nome: string;
  descricao: string;
  valor: string;
  /** Como o próprio Manual lê este valor, quando a lista dele bate com a linha. */
  leitura: string | null;
};
export type ExemploRegistro = {
  origem: "ficticio" | "ilustrativo" | "manual";
  titulo: string;
  linha: string;
  /** null: a linha não tem a quantidade de campos da tabela, então não dá para decompor. */
  partes: ParteExemplo[] | null;
  nota: string;
};
export type ResumoRegistro = {
  codigo: string;
  nome: string;
  campos: number;
  descricao: string[];
  /** A descrição oficial é maior do que o trecho. */
  descricaoCortada: boolean;
  obrigatoriedade: string;
  exemplos: ExemploRegistro[];
  /** Por que não há exemplo. */
  semExemplo: string | null;
};

const cortar = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max).replace(/\s+\S*$/, "")}…`);

/** Parágrafos inteiros até o limite, para não parar no meio de uma lista. */
function trecho(paragrafos: string[], max = 900): Pick<ResumoRegistro, "descricao" | "descricaoCortada"> {
  const descricao: string[] = [];
  let usado = 0;
  for (const p of paragrafos) {
    if (descricao.length > 0 && usado + p.length > max) break;
    descricao.push(cortar(p, max));
    usado += p.length;
  }
  // Uma frase que termina em dois-pontos anuncia algo que ficou de fora.
  while (descricao.length > 1 && descricao.length < paragrafos.length && descricao.at(-1)!.endsWith(":")) descricao.pop();
  return { descricao, descricaoCortada: descricao.length < paragrafos.length || paragrafos.some((p) => p.length > max) };
}

function decompor(r: Registro, valores: string[], leituras: (string | null)[] = []): ParteExemplo[] | null {
  if (valores.length !== r.campos.length) return null;
  return r.campos.map((c, i) => ({ nome: c.nome, descricao: cortar(c.descricao, 400), valor: valores[i]!, leitura: leituras[i] ?? null }));
}

/** "|A|B|" → ["A", "B"]. */
const separar = (linha: string) => linha.split("|").slice(1, -1).map((x) => x.trim());

export function exemploDoManual(r: Registro): ExemploRegistro | null {
  const linhas = r.exemplo.map((x) => x.trim());
  const i = linhas.findIndex((x) => x.startsWith(`|${r.codigo}|`) && x.endsWith("|") && separar(x).length > 1);
  if (i < 0) return null;
  const linha = linhas[i]!;
  const valores = separar(linha);
  // As explicações do Manual só entram se todas baterem, na ordem, com os valores da linha.
  const lidas = linhas.slice(i + 1).map((x) => /^\|([^|]*)\|:\s*(.+)$/.exec(x));
  const bate = lidas.length >= valores.length && valores.every((v, n) => lidas[n]?.[1]?.trim() === v);
  const partes = decompor(r, valores, bate ? valores.map((_, n) => lidas[n]![2]!) : []);
  return {
    origem: "manual",
    titulo: "Exemplo do Manual",
    linha,
    partes,
    nota: partes
      ? "Transcrito do Manual, com dados de teste do próprio Manual. Pode trazer códigos de versões anteriores."
      : "Transcrito do Manual. A linha não tem a mesma quantidade de campos da tabela do registro, por isso não foi separada.",
  };
}

function exemplosFicticios(r: Registro, ano: number): ExemploRegistro[] {
  if (ano !== ANO_EXEMPLOS) return [];
  return exemplos.flatMap(({ dados, arquivo }) => {
    const linhas = arquivo.linhas.filter((l) => l.reg === r.codigo);
    if (linhas.length === 0) return [];
    // A linha mais preenchida ensina mais.
    const cheia = linhas.reduce((a, b) => (b.campos.filter(Boolean).length > a.campos.filter(Boolean).length ? b : a));
    const valores = [cheia.reg, ...cheia.campos];
    return [
      {
        origem: "ficticio" as const,
        titulo: `${dados.titulo} (${dados.regime})`,
        linha: `|${valores.join("|")}|`,
        partes: decompor(r, valores),
        nota: `${cheia.explicacao} Empresa e números fictícios.`,
      },
    ];
  });
}

/** As datas do ano-base acompanham o ano pedido; o resto da linha é o mesmo. */
export function exemploIlustrativo(r: Registro, ano: number): ExemploRegistro | null {
  const item = ilustrativos.itens.find((x) => x.registro === r.codigo && (!x.anos || x.anos.includes(ano)));
  if (!item) return null;
  const campos = item.campos.map((c) => (/^\d{8}$/.test(c) && c.endsWith(String(ilustrativos.ano)) ? c.slice(0, 4) + ano : c));
  // Linha fora do leiaute derruba o build; só o campo pendente pode ficar vazio.
  const problemas = validarArquivo([{ reg: r.codigo, campos, explicacao: item.nota }], () => r).filter(
    (p) => !item.pendentes.some((c) => p === `${r.codigo}.${c}="": obrigatório vazio`),
  );
  if (problemas.length) throw new Error(`Exemplo ilustrativo fora do leiaute (AC ${ano}):\n${problemas.join("\n")}`);
  const valores = [r.codigo, ...campos];
  const aviso = item.pendentes.length ? ` A verificar: ${item.pendentes.join(", ")} depende de tabela não encontrada na fonte e ficou em branco.` : "";
  return {
    origem: "ilustrativo",
    titulo: "Montado por este site",
    linha: `|${valores.join("|")}|`,
    partes: decompor(r, valores),
    nota: `${item.nota}${aviso} Linha ilustrativa, com números fictícios.`,
  };
}

/** Registros que só o programa preenche e que nenhuma fonte lida exemplifica. */
const SEM_FONTE: Record<string, string> = {
  Y750: "O programa preenche este registro sozinho, e a planilha oficial de tabelas não traz os códigos dele.",
  "9100": "O programa grava aqui os avisos da validação. O Manual não lista os códigos de regra nem traz exemplo.",
};

export function resumoRegistro(codigo: string, ano: number): ResumoRegistro {
  const r = registroDoAno(codigo, ano);
  if (!r) throw new Error(`Registro ${codigo} não existe no AC ${ano}`);
  const manual = exemploDoManual(r);
  const ficticios = exemplosFicticios(r, ano);
  // O ilustrativo só entra quando não há outra linha que dê para ler campo a campo.
  const ilustrativo = [...ficticios, manual].some((e) => e?.partes) ? null : exemploIlustrativo(r, ano);
  const lista = [...ficticios, ...(ilustrativo ? [ilustrativo] : []), ...(manual ? [manual] : [])];
  const sigla = /^(OC|FC|O|F|N)\b/.exec(r.saida)?.[1];
  return {
    codigo: r.codigo,
    nome: r.nome,
    campos: r.campos.length,
    ...trecho(r.descricao),
    obrigatoriedade: sigla ? legendas.obrigatoriedade[sigla]! : "Veja a condição na página do registro",
    exemplos: lista,
    semExemplo: lista.length ? null : (SEM_FONTE[codigo] ?? `O Manual não traz exemplo preenchido deste registro. Bloco ${codigo[0]}: ${linhaRegime(codigo[0]!).nota}`),
  };
}
