import { z } from "zod";

/** Hosts aceitos como fonte oficial de conteúdo fiscal. */
export const HOSTS_OFICIAIS = [
  "www.gov.br",
  "sped.rfb.gov.br",
  "normasinternet2.receita.fazenda.gov.br",
  "normas.receita.fazenda.gov.br",
  "www.planalto.gov.br",
  "www.in.gov.br",
] as const;

const texto = z.string().trim().min(1);
const ano = z.number().int().min(2014).max(2100);

const urlOficial = z.url().refine((u) => {
  const { protocol, hostname, port, username } = new URL(u);
  if (port || username) return false;
  if (!(HOSTS_OFICIAIS as readonly string[]).includes(hostname)) return false;
  // O portal SPED antigo só responde por HTTP; todos os demais exigem HTTPS.
  return protocol === "https:" || (protocol === "http:" && hostname === "sped.rfb.gov.br");
}, "A URL precisa ser de uma fonte oficial da allowlist");

export const Fonte = z.strictObject({
  id: texto,
  nome: texto,
  orgao: texto,
  url: urlOficial,
  papel: z.enum(["primaria", "secundaria"]),
  observacao: texto.optional(),
});

export const Fontes = z.array(Fonte).min(1);

export const Status = z.enum(["extraido", "conferido", "revisado", "a-verificar"]);

const rastreavel = {
  id: texto,
  fonte: z.strictObject({ id: texto, url: urlOficial, trecho: texto }),
  norma: texto,
  /** Leiautes que cobrem a vigência. O carregador confere com content/leiautes/anos.json. */
  leiautes: z.array(z.string().regex(/^\d+$/)),
  vigencia: z.strictObject({
    acNormal: z.array(ano),
    situacaoEspecial: z.array(ano),
    inicio: z.iso.date().optional(),
    fim: z.iso.date().optional(),
  }),
  verificadoEm: z.iso.date(),
  status: Status,
  revisor: texto.optional(),
};

type ComVigencia = { status: string; leiautes: string[]; vigencia: { acNormal: number[]; situacaoEspecial: number[] } };
/** Só um item "a verificar" pode ficar sem leiaute ou sem ano-calendário. */
const temLeiaute = (v: ComVigencia) => v.status === "a-verificar" || v.leiautes.length > 0;
const msgLeiaute = { message: "informe a versão do leiaute", path: ["leiautes"] };
const temAno = (v: ComVigencia) =>
  v.status === "a-verificar" || v.vigencia.acNormal.length + v.vigencia.situacaoEspecial.length > 0;
const msgAno = { message: "informe o ano-calendário", path: ["vigencia", "acNormal"] };

const exigeRevisor = (v: { status: string; revisor?: string | undefined }) =>
  v.status !== "revisado" || Boolean(v.revisor);
const msgRevisor = { message: "status 'revisado' exige revisor (pessoa)", path: ["revisor"] };

/** Rastreabilidade que vale para o arquivo inteiro. */
export const Rastreio = z
  .strictObject(rastreavel)
  .refine(exigeRevisor, msgRevisor)
  .refine(temLeiaute, msgLeiaute)
  .refine(temAno, msgAno);

/** Tabela oficial: qual leiaute vale em cada ano. */
export const LeiautePorAno = z.strictObject({
  rastreio: Rastreio,
  linhas: z
    .array(z.strictObject({ leiaute: texto, anoCalendario: ano, situacaoEspecial: ano, ato: texto }))
    .min(1),
});

export const Valor = z.discriminatedUnion("tipo", [
  z.strictObject({ tipo: z.literal("texto"), texto }),
  z.strictObject({ tipo: z.literal("dinheiro"), centavos: z.number().int() }),
  /** Pontos-base: 1500 = 15,00 por cento. */
  z.strictObject({ tipo: z.literal("percentual"), pontosBase: z.number().int() }),
  z.strictObject({ tipo: z.literal("data"), data: z.iso.date() }),
]);

export const Regra = z
  .strictObject({ ...rastreavel, titulo: texto, resumo: texto.optional(), valor: Valor })
  .refine(exigeRevisor, msgRevisor)
  .refine(temLeiaute, msgLeiaute)
  .refine(temAno, msgAno);

export const FAMILIAS = [
  "identificacao",
  "recuperacao",
  "contabil",
  "apuracao",
  "internacional",
  "informacoes",
] as const;
export const Familia = z.enum(FAMILIAS);

export const Bloco = z.strictObject({ letra: z.string().regex(/^[0-9A-Z]$/), nome: texto, familia: Familia });

export const Leiaute = z
  .strictObject({
    ...rastreavel,
    numero: texto,
    anoCalendario: ano,
    blocos: z.array(Bloco).min(1),
  })
  .refine(exigeRevisor, msgRevisor)
  .refine(temLeiaute, msgLeiaute)
  .refine(temAno, msgAno)
  .refine((l) => new Set(l.blocos.map((b) => b.letra)).size === l.blocos.length, {
    message: "letra de bloco repetida",
    path: ["blocos"],
  });

export const Programa = z
  .strictObject({ ...rastreavel, versao: z.string().regex(/^\d+\.\d+\.\d+$/), paginaAtualizadaEm: z.iso.date() })
  .refine(exigeRevisor, msgRevisor)
  .refine(temLeiaute, msgLeiaute)
  .refine(temAno, msgAno);

export const Pagina = z
  .array(
    z.strictObject({
      id: z.string().regex(/^[a-z-]+$/),
      titulo: texto,
      iniciante: z.array(texto).min(1),
      profissional: z.array(texto).min(1),
      /** Toda seção precisa apontar ao menos uma regra. */
      regras: z.array(texto).min(1),
    }),
  )
  .min(1);

export const Evento = z
  .strictObject({
    ...rastreavel,
    quando: z.union([z.strictObject({ data: z.iso.date() }), z.strictObject({ ano })]),
    titulo: texto,
    iniciante: texto,
    profissional: texto,
  })
  .refine(exigeRevisor, msgRevisor)
  .refine(temLeiaute, msgLeiaute)
  .refine(temAno, msgAno);

export const TIPOS_NOVIDADE = ["programa", "leiaute", "norma", "comunicado"] as const;
export const Novidade = z
  .strictObject({
    ...rastreavel,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    data: z.iso.date(),
    tipo: z.enum(TIPOS_NOVIDADE),
    titulo: texto,
    iniciante: texto,
    profissional: texto,
    /** O que a pessoa precisa fazer, se houver algo. */
    fazer: texto.optional(),
    registros: z.array(z.string().regex(/^[0-9A-Z]\d{3}$/)),
  })
  .refine(exigeRevisor, msgRevisor)
  .refine(temLeiaute, msgLeiaute)
  .refine(temAno, msgAno);

export const Termo = z
  .strictObject({
    ...rastreavel,
    id: z.string().regex(/^[a-z0-9-]+$/),
    termo: texto,
    sinonimos: z.array(texto),
    /** Marca com dica nos textos do site. Palavras comuns demais ficam só no glossário. */
    dica: z.boolean(),
    iniciante: texto,
    profissional: texto,
    regras: z.array(texto),
    registros: z.array(z.string().regex(/^[0-9A-Z]\d{3}$/)),
  })
  .refine(exigeRevisor, msgRevisor)
  .refine(temLeiaute, msgLeiaute)
  .refine(temAno, msgAno);

const Opcao = z.union([
  z.strictObject({ id: texto, texto, proximo: texto, complemento: texto.optional() }),
  z.strictObject({ id: texto, texto, resultado: texto, complemento: texto.optional() }),
]);

export const Quiz = z.strictObject({
  inicio: texto,
  perguntas: z.array(z.strictObject({ id: texto, texto, ajuda: texto, opcoes: z.array(Opcao).min(2) })).min(1),
  resultados: z
    .array(
      z.strictObject({
        id: texto,
        situacao: z.enum(["obrigada", "dispensada"]),
        titulo: texto,
        iniciante: texto,
        profissional: texto,
        regras: z.array(texto).min(1),
      }),
    )
    .min(1),
  complementos: z.array(z.strictObject({ id: texto, texto, regras: z.array(texto).min(1) })),
});

export type Pagina = z.infer<typeof Pagina>;
export type Novidade = z.infer<typeof Novidade>;
export type Termo = z.infer<typeof Termo>;
export type Evento = z.infer<typeof Evento>;
export type Quiz = z.infer<typeof Quiz>;
const Campo = z.strictObject({
  numero: z.number().int().positive(),
  nome: texto,
  descricao: texto,
  tipo: z.enum(["C", "N", "NS", "D", "—"]),
  tamanho: texto,
  decimal: texto,
  valores: texto,
  obrigatorio: texto,
});
const RegraValidacao = z.strictObject({ codigo: texto, texto: z.string() });

export const Registro = z
  .strictObject({
    codigo: z.string().regex(/^[0-9A-Z]\d{3}$/),
    nome: texto,
    ordem: z.number().int().nonnegative(),
    nivel: texto,
    ocorrencia: texto,
    chave: texto,
    entrada: texto,
    saida: texto,
    descricao: z.array(texto),
    campos: z.array(Campo).min(1),
    regrasRegistro: z.array(RegraValidacao),
    regrasCampo: z.array(
      z.strictObject({
        campo: texto,
        regras: z.array(RegraValidacao.extend({ tipo: z.enum(["Erro", "Aviso", "Habilita", "a verificar"]) })),
      }),
    ),
    exemplo: z.array(texto),
  })
  .refine((r) => r.campos.every((c, i) => c.numero === i + 1), "numeração de campos com falha")
  .refine((r) => r.campos[0]!.nome === "REG", "o primeiro campo precisa ser REG");

export const ArquivoRegistros = z.strictObject({
  rastreio: Rastreio,
  bloco: z.string().regex(/^[0-9A-Z]$/),
  descricao: texto,
  registros: z.array(Registro).min(1),
});
export const Conferidos = z.strictObject({ verificadoEm: z.iso.date(), metodo: texto, codigos: z.array(texto) });

export const Didatico = z.strictObject({
  letra: z.string().regex(/^[0-9A-Z]$/),
  /** Nome curto, só para o mapa. O nome oficial vem do leiaute. */
  curto: texto.max(24),
  objetivo: texto,
  analogia: texto,
  origem: texto,
  /** Os dados chegam da ECD: o bloco é da ECF, mas o conteúdo vem da escrituração contábil. */
  ecd: z.literal(true).optional(),
  erros: z
    .array(z.strictObject({ titulo: texto, comoEvitar: texto, registro: texto, regra: texto.nullable() }))
    .min(1),
});

/** Textos didáticos dos blocos. */
export const Didaticos = z.strictObject({ rastreio: Rastreio, blocos: z.array(Didatico).min(1) });

export const REGIMES = ["real", "presumido", "arbitrado", "imune", "isenta"] as const;
const Situacao = z.enum(["sim", "depende", "nao"]);
export const Regimes = z.strictObject({
  rastreio: Rastreio,
  regimes: z.array(z.strictObject({ id: z.enum(REGIMES), nome: texto, forma: texto })).length(REGIMES.length),
  linhas: z.array(
    z.strictObject({
      bloco: texto,
      base: z.array(texto).min(1),
      nota: texto,
      celulas: z.strictObject({ real: Situacao, presumido: Situacao, arbitrado: Situacao, imune: Situacao, isenta: Situacao }),
    }),
  ),
});

export const Grafo = z.strictObject({
  rastreio: Rastreio,
  externos: z.array(z.strictObject({ id: texto, nome: texto })),
  arestas: z.array(
    z.strictObject({
      de: texto,
      para: texto,
      o: texto,
      base: z.strictObject({ registro: texto, regra: texto.nullable(), tabela: texto.optional() }),
    }),
  ),
});
export const Legendas = z.strictObject({
  rastreio: Rastreio,
  tipos: z.record(z.string(), texto),
  obrigatoriedade: z.record(z.string(), texto),
  entrada: texto,
  saida: texto,
});

const Nivelado = z.strictObject({ iniciante: texto, profissional: texto });

/** Roteiro da simulação de preenchimento de um registro. Só o que não sai dos dados; a linha é gerada por código. */
export const Roteiro = z
  .strictObject({
    rastreio: Rastreio,
    registro: z.string().regex(/^[0-9A-Z]\d{3}$/),
    ano,
    empresa: z.strictObject({
      /** “manual”: dados de teste do Manual; “lucro-real”: empresa fictícia do site. */
      origem: z.enum(["manual", "lucro-real"]),
      nome: texto,
      aviso: texto.optional(),
    }),
    /** Manual: todos os valores. Empresa do site: os valores que escolhem a linha. */
    linha: z.strictObject({ campos: z.record(texto, z.string()), periodo: texto.optional() }),
    /** Valores de outros registros que as regras usam quando o exemplo não traz o arquivo todo. */
    extras: z.record(z.string().regex(/^[0-9A-Z]\d{3}\.[A-Z_]+$/), z.string()).optional(),
    fatos: z.array(z.strictObject({ texto: Nivelado, campos: z.array(texto).min(1) })).min(1),
    /** Pergunta de obrigatoriedade; a condição vem do leiaute. Nula para registro obrigatório. */
    decisao: z.strictObject({ pergunta: Nivelado, sim: Nivelado, nao: Nivelado }).nullable(),
    legendas: z.record(texto, Nivelado).optional(),
    /** Todas as regras do Manual para o registro, simuladas ou com o motivo de não serem. */
    regras: z
      .array(z.strictObject({ campo: texto, codigo: z.string().regex(/^REGRA_[A-Z0-9_]+$/), simulada: z.boolean(), motivo: texto.optional() }))
      .min(1)
      .refine((rs) => rs.every((r) => r.simulada || r.motivo), "regra não simulada precisa de motivo"),
    erro: z.strictObject({ campo: texto, valor: z.string(), regra: z.string().regex(/^REGRA_[A-Z0-9_]+$/), explicacao: Nivelado, comoCorrigir: Nivelado }),
    paraQueServe: Nivelado,
  })
  .refine((r) => r.regras.some((x) => x.codigo === r.erro.regra && x.simulada), "o cenário de erro precisa usar uma regra simulada");

export const Divergencias = z.strictObject({
  rastreio: Rastreio,
  itens: z.array(z.strictObject({ onde: texto, leiautes: z.array(texto).min(1), texto })),
});

export type Registro = z.infer<typeof Registro>;
export type Didatico = z.infer<typeof Didatico>;
export type Regimes = z.infer<typeof Regimes>;
export type Grafo = z.infer<typeof Grafo>;
export type Regime = (typeof REGIMES)[number];
export type Situacao = z.infer<typeof Situacao>;
const centavos = z.number().int().nonnegative();
const LinhaTabela = z.strictObject({ codigo: texto, descricao: texto, tipo: texto, formula: texto.optional(), lancamento: texto.optional() });
const ContaRef = z.strictObject({
  codigo: texto,
  descricao: texto,
  tipo: z.enum(["S", "A"]),
  superior: texto.nullable(),
  nivel: z.number().int(),
  natureza: texto,
});
export const Tabelas = z.strictObject({
  rastreio: Rastreio,
  planos: z.strictObject({ L100: z.array(ContaRef), L300: z.array(ContaRef) }),
  lalur: z.strictObject({
    M300: z.array(LinhaTabela.extend({ lancamento: texto })),
    M350: z.array(LinhaTabela.extend({ lancamento: texto })),
  }),
  linhas: z.record(z.string(), z.array(LinhaTabela)),
});

const baseExemplo = {
  slug: z.string().regex(/^[a-z-]+$/),
  ano,
  titulo: texto,
  regime: texto,
  iniciante: z.array(texto).min(1),
  profissional: z.array(texto).min(1),
  inicio: z.iso.date(),
  fim: z.iso.date(),
  cadastro: z.strictObject({
    nome: texto, cnpj: z.string().regex(/^\d{14}$/), natJur: texto, cnae: texto, endereco: texto, numero: texto,
    bairro: texto, uf: texto, municipio: texto, cep: texto, telefone: texto, email: texto,
  }),
  assinantes: z
    .array(z.strictObject({ nome: texto, cpf: texto, qualif: texto, crc: z.string(), email: texto, fone: texto }))
    .min(1),
};
const socios = z.array(
  z.strictObject({ desde: z.iso.date(), nome: texto, cpf: texto, qualif: texto, percentual: texto }),
);
const periodo = { id: texto, inicio: z.iso.date(), fim: z.iso.date(), meses: z.number().int().min(1).max(12) };

export const ExemploReal = z.strictObject({
  ...baseExemplo,
  tipo: z.literal("real"),
  contas: z.array(z.strictObject({ codigo: texto, nome: texto, natureza: texto, ref: texto.nullable() })),
  papeis: z.strictObject({
    despesaCsll: texto, despesaIrpj: texto, csllARecolher: texto, irpjARecolher: texto, lucros: texto, prejuizos: texto,
  }),
  parteB: z.array(z.strictObject({ codigo: texto, nome: texto, padrao: texto, tributo: z.enum(["I", "C"]) })),
  periodos: z.array(
    z.strictObject({
      ...periodo,
      lancamentos: z.array(z.strictObject({ d: texto, c: texto, valor: centavos, historico: texto })),
      ajustes: z.array(
        z.strictObject({ linha: texto, conta: texto, parteB: texto.nullable(), valor: centavos, historico: texto }),
      ),
    }),
  ),
  socios,
});
export const ExemploPresumido = z.strictObject({
  ...baseExemplo,
  tipo: z.literal("presumido"),
  periodos: z.array(
    z.strictObject({
      ...periodo,
      receitas: z.strictObject({ geral: centavos, servicos: centavos }),
      financeiras: centavos,
      irrf: centavos,
    }),
  ),
  caixaInicial: centavos,
  caixa: z.array(z.strictObject({ data: z.iso.date(), historico: texto, entrada: centavos, saida: centavos })),
  outras: z.strictObject({
    capitalAnterior: centavos, capital: centavos, estoqueAnterior: centavos, estoque: centavos,
    pagarAnterior: centavos, pagar: centavos, compras: centavos, avaliacaoEstoque: texto,
  }),
  retencao: z.strictObject({ cnpj: texto, nome: texto, codigo: texto }),
  socios,
});
export const ExemploIsenta = z.strictObject({
  ...baseExemplo,
  tipo: z.literal("isenta"),
  tipoEntidade: texto,
  x390: z.record(z.string(), centavos),
  dirigentes: z.array(
    z.strictObject({ cpf: texto, nome: texto, qualif: texto, remuneracao: centavos, demais: centavos, ir: centavos }),
  ),
});
/** Linhas montadas por este site para registros sem exemplo aproveitável no Manual. */
export const ExemplosIlustrativos = z.strictObject({
  ano,
  itens: z.array(
    z.strictObject({
      registro: z.string().regex(/^[0-9A-Z]\d{3}$/),
      campos: z.array(z.string()).min(1),
      nota: texto,
      /** Campos cujo código depende de tabela não encontrada na fonte: ficam em branco, com aviso. */
      pendentes: z.array(texto),
      /** Ausente: vale para todos os anos. */
      anos: z.array(ano).optional(),
    }),
  ),
});
export type Tabelas = z.infer<typeof Tabelas>;
export type ExemploReal = z.infer<typeof ExemploReal>;
export type ExemploPresumido = z.infer<typeof ExemploPresumido>;
export type ExemploIsenta = z.infer<typeof ExemploIsenta>;

export type Rastreio = z.infer<typeof Rastreio>;
export type Fonte = z.infer<typeof Fonte>;
export type Regra = z.infer<typeof Regra>;
export type Valor = z.infer<typeof Valor>;
export type Bloco = z.infer<typeof Bloco>;
export type Leiaute = z.infer<typeof Leiaute>;
export type Programa = z.infer<typeof Programa>;
export type Familia = z.infer<typeof Familia>;
export type Status = z.infer<typeof Status>;
export type Roteiro = z.infer<typeof Roteiro>;
