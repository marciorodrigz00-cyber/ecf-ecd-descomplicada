/**
 * Regras de validação do Manual da ECF, em código, só para os registros com simulação.
 * Cada função segue o texto do Manual do leiaute 12; o texto fica ao lado, na página do registro.
 * Puro e sem atalhos de caminho: o hook do Claude Code também importa este arquivo.
 */
import type { LinhaArq } from "./arquivo.ts";

export type Estado = "passou" | "falhou" | "nao-se-aplica";
export type Resultado = { estado: Estado; detalhe: string };
export type Contexto = {
  linha: LinhaArq;
  arquivo: readonly LinhaArq[];
  /** Valores de outros registros quando o exemplo não traz o arquivo todo (ex.: "0000.CNPJ"). */
  extras: Readonly<Record<string, string>>;
  /** Tabela oficial: ano-calendário → leiaute (“12”). */
  leiautePorAno: Readonly<Record<number, string>>;
  /** Mesma tabela, coluna das situações especiais: ano do evento → leiaute (2026 → “12”). */
  leiauteSituacaoEspecial?: Readonly<Record<number, string>>;
  /** Tipo da linha na tabela dinâmica (E, R, CA, CNA…), quando houver. */
  tipoDaLinha: (reg: string, codigo: string) => string | undefined;
};
type Regra = (c: Contexto) => Resultado;

const ok = (detalhe: string): Resultado => ({ estado: "passou", detalhe });
const erro = (detalhe: string): Resultado => ({ estado: "falhou", detalhe });
const naoAplica = (detalhe: string): Resultado => ({ estado: "nao-se-aplica", detalhe });
const conferir = (passou: boolean, sim: string, nao: string) => (passou ? ok(sim) : erro(nao));

/** Valor de outro registro: primeiro o arquivo, depois os extras do roteiro. */
export function valorDe(c: Contexto, chave: string): string | undefined {
  const [reg, campo] = chave.split(".") as [string, string];
  return c.arquivo.find((l) => l.reg === reg)?.v[campo] ?? c.extras[chave];
}
const campo = (c: Contexto, nome: string) => c.linha.v[nome] ?? "";
const filhos = (c: Contexto, regs: readonly string[]) => c.arquivo.filter((l) => l.pai === c.linha.indice && regs.includes(l.reg));

/** “1.234,56” ou “-88000,00” → centavos. */
export function centavos(v: string): bigint {
  const m = /^(-?)(\d+)(?:,(\d{1,2}))?$/.exec(v.trim());
  if (!m) throw new Error(`Valor fora do formato da ECF: “${v}”`);
  const c = BigInt(m[2]!) * 100n + BigInt((m[3] ?? "0").padEnd(2, "0"));
  return m[1] ? -c : c;
}
export const reais = (c: bigint) => {
  const neg = c < 0n;
  const a = neg ? -c : c;
  const inteiro = (a / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}${inteiro},${(a % 100n).toString().padStart(2, "0")}`;
};
/** Saldo com indicador D/C → valor com sinal (devedor positivo). */
const saldo = (valor: string, ind: string) => (ind === "C" ? -centavos(valor) : centavos(valor));

/** DDMMAAAA → número AAAAMMDD, para comparar. */
const data = (v: string) => {
  if (!/^\d{8}$/.test(v)) return null;
  return Number(v.slice(4) + v.slice(2, 4) + v.slice(0, 2));
};
const diaAnterior = (v: string) => {
  const d = new Date(Date.UTC(Number(v.slice(4)), Number(v.slice(2, 4)) - 1, Number(v.slice(0, 2)) - 1));
  return `${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCMonth() + 1).padStart(2, "0")}${d.getUTCFullYear()}`;
};

/** Dígitos verificadores do CNPJ numérico (módulo 11). */
export function cnpjValido(v: string): boolean {
  if (!/^\d{14}$/.test(v) || /^(\d)\1{13}$/.test(v)) return false;
  const dv = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (const d of base) {
      soma += Number(d) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(v.slice(0, 12));
  return d1 === Number(v[12]) && dv(v.slice(0, 13)) === Number(v[13]);
}

// ---------- 0035 e 0000: identificação ----------

// 0035: “Verifica se o campo 0035.COD_SCP possui 14 caracteres.”
const tamanhoScp0035: Regra = (c) => {
  const v = campo(c, "COD_SCP");
  return conferir(v.length === 14, "COD_SCP tem 14 caracteres.", `COD_SCP tem ${v.length} caracteres; o Manual pede 14.`);
};
// 0000: “O campo 0000.COD_SCP da SCP deve conter exatamente 14 números.”
const tamanhoScp0000: Regra = (c) => {
  const v = campo(c, "COD_SCP");
  if (v === "") return naoAplica("COD_SCP vazio: só se confere quando preenchido.");
  return conferir(/^\d{14}$/.test(v), "COD_SCP tem 14 números.", `COD_SCP precisa ter exatamente 14 números; tem “${v}”.`);
};
const scpDiferenteDoCnpj: Regra = (c) => {
  const v = campo(c, "COD_SCP");
  const cnpj = valorDe(c, "0000.CNPJ");
  if (c.linha.reg === "0000" && v === "") return naoAplica("COD_SCP vazio: só se confere quando preenchido.");
  if (cnpj === undefined) throw new Error("REGRA_CNPJ_DIFERENTE_SCP sem 0000.CNPJ");
  return conferir(v !== cnpj, `COD_SCP (${v}) é diferente do CNPJ da empresa (${cnpj}).`, `COD_SCP é igual ao 0000.CNPJ (${cnpj}): a SCP precisa de CNPJ próprio.`);
};

const sit = (c: Contexto) => campo(c, "SIT_ESPECIAL");
const tip = (c: Contexto) => campo(c, "TIP_ECF");
const vazio = (c: Contexto, nome: string) => campo(c, nome) === "";
/** Leiaute do ano-calendário; em situação especial, também o da coluna de situações especiais (ex.: 2026 → 12). */
const leiautesValidos = (c: Contexto, ano: number) =>
  [c.leiautePorAno[ano], sit(c) !== "" && sit(c) !== "0" ? c.leiauteSituacaoEspecial?.[ano] : undefined].filter((l): l is string => l !== undefined);

const r0000: Record<string, Regra> = {
  "COD_VER:REGRA_LEIAUTE_VIGENTE": (c) => {
    const ano = Number(campo(c, "DT_INI").slice(4));
    const validos = leiautesValidos(c, ano);
    if (!validos.length) return erro(`Não há leiaute para o ano ${ano}.`);
    const esperados = validos.map((l) => l.padStart(4, "0"));
    return conferir(
      esperados.includes(campo(c, "COD_VER")),
      `COD_VER ${campo(c, "COD_VER")}: leiaute ${Number(campo(c, "COD_VER"))}, válido para ${ano}.`,
      `COD_VER ${campo(c, "COD_VER")}, mas ${ano} usa o leiaute ${esperados.join(" ou ")}.`,
    );
  },
  "CNPJ:REGRA_VALIDA_CNPJ": (c) => conferir(cnpjValido(campo(c, "CNPJ")), "Dígitos verificadores do CNPJ conferem.", "Dígitos verificadores do CNPJ não conferem."),
  "PAT_REMAN_CIS:REGRA_PAT_REMAN_CIS_OBRIGATORIO": (c) =>
    sit(c) === "6" ? conferir(!vazio(c, "PAT_REMAN_CIS"), "Cisão parcial com patrimônio remanescente informado.", "Cisão parcial sem PAT_REMAN_CIS.") : naoAplica(`SIT_ESPECIAL = ${sit(c)}: só vale para cisão parcial (6).`),
  "PAT_REMAN_CIS:REGRA_NAO_PREENCHER_SIT_ESP_CISAO_PARCIAL": (c) =>
    sit(c) !== "6" ? conferir(vazio(c, "PAT_REMAN_CIS"), "Sem cisão parcial, PAT_REMAN_CIS fica vazio.", "PAT_REMAN_CIS preenchido sem cisão parcial.") : naoAplica("Há cisão parcial."),
  "DT_SIT_ESP:REGRA_DT_SIT_OBRIGATORIO": (c) =>
    sit(c) !== "" && sit(c) !== "0" ? conferir(!vazio(c, "DT_SIT_ESP"), "Situação especial com data.", "Situação especial sem DT_SIT_ESP.") : naoAplica("Sem situação especial (SIT_ESPECIAL = 0)."),
  "DT_SIT_ESP:REGRA_NAO_PREENCHER_SIT_ESP_NORMAL": (c) =>
    sit(c) === "0" ? conferir(vazio(c, "DT_SIT_ESP"), "Sem situação especial, DT_SIT_ESP fica vazio.", "DT_SIT_ESP preenchido sem situação especial.") : naoAplica("Há situação especial."),
  // O texto diz “maior que 01/01/2014”; 01/01/2014 é o início do primeiro ano da ECF e é aceito.
  "DT_INI:REGRA_DATA_MINIMA": (c) => conferir((data(campo(c, "DT_INI")) ?? 0) >= 20140101, "DT_INI não é anterior a 01/01/2014.", "DT_INI anterior a 01/01/2014."),
  "DT_INI:REGRA_DT_INICIO_ESCRITURACAO": (c) =>
    campo(c, "IND_SIT_INI_PER") === "0"
      ? conferir(campo(c, "DT_INI").startsWith("0101"), "Período normal começa em 1º de janeiro.", "Período normal precisa começar em 01/01.")
      : naoAplica(`IND_SIT_INI_PER = ${campo(c, "IND_SIT_INI_PER")}: o período não começa no início do ano.`),
  "DT_INI:REGRA_SEM_LEIAUTE": (c) => {
    const ano = Number(campo(c, "DT_INI").slice(4));
    return conferir(leiautesValidos(c, ano).length > 0, `Há leiaute para ${ano}.`, `Não há leiaute para ${ano}.`);
  },
  "DT_INI:REGRA_DATA_INI_MAIOR": (c) => conferir((data(campo(c, "DT_FIN")) ?? 0) > (data(campo(c, "DT_INI")) ?? 0), "DT_FIN é depois de DT_INI.", "DT_FIN não é depois de DT_INI."),
  "DT_INI:REGRA_ANO_DIFERENTE": (c) => conferir(campo(c, "DT_INI").slice(4) === campo(c, "DT_FIN").slice(4), "DT_INI e DT_FIN no mesmo ano.", "DT_INI e DT_FIN em anos diferentes."),
  "DT_FIN:REGRA_DT_FINAL_ESCRITURACAO": (c) =>
    sit(c) === "0" || campo(c, "EVENTO_SCP") === "0"
      ? conferir(campo(c, "DT_FIN").startsWith("3112"), "Sem situação especial, o período termina em 31/12.", `Sem situação especial, DT_FIN precisa ser 31/12; está ${campo(c, "DT_FIN").slice(0, 2)}/${campo(c, "DT_FIN").slice(2, 4)}.`)
      : naoAplica("Há situação especial ou evento de SCP."),
  "DT_FIN:REGRA_EVENTO_ACONTECIMENTO": (c) => {
    if (["1", "2", "3", "4", "5", "6"].includes(sit(c))) return conferir(campo(c, "DT_FIN") === campo(c, "DT_SIT_ESP"), "DT_FIN igual à data do evento.", "DT_FIN diferente da data do evento.");
    if (["7", "8", "9"].includes(sit(c))) return conferir(campo(c, "DT_FIN") === diaAnterior(campo(c, "DT_SIT_ESP")), "DT_FIN é a véspera do evento.", "DT_FIN precisa ser a véspera do evento.");
    return naoAplica(`SIT_ESPECIAL = ${sit(c)}: sem evento.`);
  },
  "NUM_REC:REGRA_REC_ANTERIOR_OBRIGATORIO": (c) =>
    ["S", "F"].includes(campo(c, "RETIFICADORA")) ? conferir(!vazio(c, "NUM_REC"), "Retificadora com recibo da anterior.", "Retificadora sem NUM_REC.") : naoAplica("ECF original (RETIFICADORA = N)."),
  "NUM_REC:REGRA_NRO_REC_ANTERIOR_NAO_SE_APLICA": (c) =>
    campo(c, "RETIFICADORA") === "N" ? conferir(vazio(c, "NUM_REC"), "ECF original, NUM_REC vazio.", "ECF original com NUM_REC preenchido.") : naoAplica("ECF retificadora."),
  "COD_SCP:REGRA_SCP_OBRIGATORIO": (c) => (tip(c) === "2" ? conferir(!vazio(c, "COD_SCP"), "ECF da SCP com COD_SCP.", "ECF da SCP sem COD_SCP.") : naoAplica(`TIP_ECF = ${tip(c)}: não é ECF da SCP.`)),
  "COD_SCP:REGRA_SCP_NAO_PREENCHER": (c) =>
    ["0", "1"].includes(tip(c)) ? conferir(vazio(c, "COD_SCP"), `TIP_ECF = ${tip(c)}: COD_SCP fica vazio.`, "COD_SCP preenchido em ECF que não é da SCP.") : naoAplica("ECF da SCP."),
  "COD_SCP:REGRA_VALIDA_TAM_SCP": tamanhoScp0000,
  "COD_SCP:REGRA_CNPJ_DIFERENTE_SCP": scpDiferenteDoCnpj,
  "COD_SCP:REGRA_VALIDA_CNPJ": (c) => (vazio(c, "COD_SCP") ? naoAplica("COD_SCP vazio.") : conferir(cnpjValido(campo(c, "COD_SCP")), "CNPJ da SCP válido.", "CNPJ da SCP inválido.")),
  "EVENTO_SCP:REGRA_EVENTO_SCP_OBRIGATORIO": (c) =>
    tip(c) === "2" && sit(c) === "0" ? conferir(!vazio(c, "EVENTO_SCP"), "ECF da SCP sem situação especial, com EVENTO_SCP.", "ECF da SCP sem EVENTO_SCP.") : naoAplica("Só vale para ECF da SCP sem situação especial."),
  "EVENTO_SCP:REGRA_EVENTO_SCP_NAO_PREENCHER": (c) =>
    tip(c) !== "2" || sit(c) !== "0"
      ? conferir(vazio(c, "EVENTO_SCP"), "EVENTO_SCP vazio, como deve ser.", "EVENTO_SCP preenchido fora da ECF da SCP sem situação especial.")
      : naoAplica("ECF da SCP sem situação especial."),
};

// ---------- M300: parte A do e-Lalur ----------

const tipoM300 = (c: Contexto) => c.tipoDaLinha("M300", campo(c, "CODIGO"));
const tipoE = (nome: string): Record<string, Regra> => ({
  [`${nome}:REGRA_OBRIGATORIO_TIPO_E`]: (c) =>
    tipoM300(c) === "E" ? conferir(!vazio(c, nome), `Linha do tipo E com ${nome}.`, `Linha do tipo E sem ${nome}.`) : naoAplica(`Linha do tipo ${tipoM300(c)}.`),
});
// REGRA_NAO_PREENCHER_TIPO_DIFERENTE_E em TIPO_LANCAMENTO e IND_RELACAO fica fora: os textos do Manual só falam da linha E,
// e “vazio fora do E” viria só do nome da regra.

const rM300: Record<string, Regra> = {
  ...tipoE("TIPO_LANCAMENTO"),
  ...tipoE("IND_RELACAO"),
  "*:REGRA_VALOR_DETALHADO": (c) => {
    const rel = campo(c, "IND_RELACAO");
    if (!["1", "2", "3"].includes(rel)) return naoAplica(`IND_RELACAO = ${rel || "vazio"}.`);
    const adicao = ["A", "L"].includes(campo(c, "TIPO_LANCAMENTO"));
    const natureza = (cta: string) => c.arquivo.find((l) => l.reg === "J050" && l.v.COD_CTA === cta)?.v.COD_NAT;
    const sinalM305 = (ind: string) => ((ind === "D") === adicao ? 1n : -1n);
    const sinalM310 = (cta: string, ind: string) => {
      const nat = natureza(cta);
      if (!nat) throw new Error(`Conta ${cta} sem J050`);
      const resultado = nat === "04" || nat === "4";
      return (ind === "D") === (resultado === adicao) ? 1n : -1n;
    };
    const s305 = filhos(c, ["M305"]).reduce((t, l) => t + sinalM305(l.v.IND_VL_CTA!) * centavos(l.v.VL_CTA!), 0n);
    const s310 = filhos(c, ["M310"]).reduce((t, l) => t + sinalM310(l.v.COD_CTA!, l.v.IND_VL_CTA!) * centavos(l.v.VL_CTA!), 0n);
    const valor = centavos(campo(c, "VALOR"));
    const aceitos = rel === "1" ? [s305] : rel === "2" ? [s310] : [s305, s310, s305 + s310];
    return conferir(
      aceitos.includes(valor),
      `VALOR ${reais(valor)} bate com o detalhamento (parte B: ${reais(s305)}; contas contábeis: ${reais(s310)}).`,
      `VALOR ${reais(valor)} não bate com o detalhamento (parte B: ${reais(s305)}; contas contábeis: ${reais(s310)}).`,
    );
  },
  "TIPO_LANCAMENTO:REGRA_RELACAO_INEXISTENTE": (c) => {
    const b = filhos(c, ["M305", "M355"]).length > 0;
    const k = filhos(c, ["M310", "M360"]).length > 0;
    const esperado: Record<string, [boolean, boolean]> = { "1": [true, false], "2": [false, true], "3": [true, true], "4": [false, false] };
    const rel = campo(c, "IND_RELACAO");
    const e = esperado[rel];
    if (!e) return naoAplica("IND_RELACAO vazio.");
    return conferir(e[0] === b && e[1] === k, `IND_RELACAO = ${rel} e os filhos combinam.`, `IND_RELACAO = ${rel}, mas há ${b ? "" : "nenhum "}M305 e ${k ? "" : "nenhum "}M310.`);
  },
  "IND_RELACAO:REGRA_IND_RELACAO": (c) =>
    campo(c, "TIPO_LANCAMENTO") === "P" ? conferir(campo(c, "IND_RELACAO") === "1", "Compensação de prejuízo ligada à parte B.", "Compensação de prejuízo precisa de IND_RELACAO = 1.") : naoAplica(`TIPO_LANCAMENTO = ${campo(c, "TIPO_LANCAMENTO")}.`),
  "HIST_LAN_LAL:REGRA_NAO_PREENCHER_TIPO_DIFERENTE_E": (c) =>
    tipoM300(c) === "E" && campo(c, "IND_RELACAO") === "4" ? conferir(!vazio(c, "HIST_LAN_LAL"), "Lançamento sem relacionamento com histórico.", "Lançamento sem relacionamento precisa de histórico.") : naoAplica("Só vale para linha E sem relacionamento (IND_RELACAO = 4)."),
};

// ---------- L100: balanço ----------

const contaL100 = (c: Contexto, codigo: string, periodo: string | null) => c.arquivo.find((l) => l.reg === "L100" && l.periodo === periodo && l.v.CODIGO === codigo);
const k156DaConta = (c: Contexto) => c.arquivo.filter((l) => l.reg === "K156" && l.periodo === c.linha.periodo && l.v.COD_CTA_REF === campo(c, "CODIGO"));

const rL100: Record<string, Regra> = {
  "VAL_CTA_REF_FIN:REGRA_VALIDACAO_SALDO_FINAL_BAL": (c) => {
    const ini = saldo(campo(c, "VAL_CTA_REF_INI"), campo(c, "IND_VAL_CTA_REF_INI"));
    const fin = saldo(campo(c, "VAL_CTA_REF_FIN"), campo(c, "IND_VAL_CTA_REF_FIN"));
    const conta = ini + centavos(campo(c, "VAL_CTA_REF_DEB")) - centavos(campo(c, "VAL_CTA_REF_CRED"));
    return conferir(fin === conta, `Inicial ${reais(ini)} + débitos − créditos = ${reais(conta)}, igual ao saldo final.`, `Inicial + débitos − créditos dá ${reais(conta)}, mas o saldo final informado é ${reais(fin)}.`);
  },
  "VAL_CTA_REF_DEB:REGRA_COMPARA_CONT_REF_DEB": (c) => {
    const s = k156DaConta(c).reduce((t, l) => t + centavos(l.v.VL_DEB!), 0n);
    const v = centavos(campo(c, "VAL_CTA_REF_DEB"));
    return conferir(s === v, `Débitos ${reais(v)} iguais à soma do K156 (${reais(s)}).`, `Débitos ${reais(v)}, mas o K156 soma ${reais(s)}.`);
  },
  "VAL_CTA_REF_CRED:REGRA_COMPARA_CONT_REF_CRED": (c) => {
    const s = k156DaConta(c).reduce((t, l) => t + centavos(l.v.VL_CRED!), 0n);
    const v = centavos(campo(c, "VAL_CTA_REF_CRED"));
    return conferir(s === v, `Créditos ${reais(v)} iguais à soma do K156 (${reais(s)}).`, `Créditos ${reais(v)}, mas o K156 soma ${reais(s)}.`);
  },
  "*:REGRA_COMPARA_CONT_REF_SI": (c) => {
    // Soma dos saldos iniciais dos K155 “pai” × saldo final do K156 ÷ saldo final do K155 “pai”.
    let soma = 0;
    for (const k of k156DaConta(c)) {
      const pai = c.arquivo[k.pai!]!;
      const finPai = Number(saldo(pai.v.VL_SLD_FIN!, pai.v.IND_VL_SLD_FIN!));
      if (finPai === 0) return naoAplica("Saldo final do K155 é zero: a proporção não se calcula.");
      soma += (Number(saldo(pai.v.VL_SLD_INI!, pai.v.IND_VL_SLD_INI!)) * Number(saldo(k.v.VL_SLD_FIN!, k.v.IND_VL_SLD_FIN!))) / finPai;
    }
    const v = Number(saldo(campo(c, "VAL_CTA_REF_INI"), campo(c, "IND_VAL_CTA_REF_INI")));
    return conferir(Math.abs(soma - v) < 1, `Saldo inicial ${reais(BigInt(v))} bate com o K155 e o K156.`, `Saldo inicial ${reais(BigInt(v))}, mas o K155 e o K156 dão ${reais(BigInt(Math.round(soma)))}.`);
  },
  "VAL_CTA_REF_INI:REGRA_BAL_SI_IGUAL_ANT": (c) => {
    if (valorDe(c, "0010.FORMA_APUR") !== "T") return naoAplica("Só vale para apuração trimestral.");
    const periodos = c.arquivo.filter((l) => l.reg === "L030").map((l) => l.v.PER_APUR!);
    const i = periodos.indexOf(c.linha.periodo ?? "");
    if (i <= 0) return naoAplica("Primeiro trimestre da escrituração: não há período anterior.");
    const ant = contaL100(c, campo(c, "CODIGO"), periodos[i - 1]!);
    if (!ant) return erro(`Conta ${campo(c, "CODIGO")} não existe em ${periodos[i - 1]}.`);
    const ini = saldo(campo(c, "VAL_CTA_REF_INI"), campo(c, "IND_VAL_CTA_REF_INI"));
    const finAnt = saldo(ant.v.VAL_CTA_REF_FIN!, ant.v.IND_VAL_CTA_REF_FIN!);
    return conferir(ini === finAnt, `Saldo inicial igual ao final de ${periodos[i - 1]} (${reais(finAnt)}).`, `Saldo inicial ${reais(ini)}, mas o final de ${periodos[i - 1]} foi ${reais(finAnt)}.`);
  },
  "*:REGRA_BALANCO_SALDO_FINAL": (c) => {
    if (!["A00", "A12", "T04"].includes(c.linha.periodo ?? "")) return naoAplica(`Período ${c.linha.periodo}: a regra vale para A00, A12 e T04.`);
    const at = contaL100(c, "1", c.linha.periodo);
    const pa = contaL100(c, "2", c.linha.periodo);
    if (!at || !pa) return erro("Balanço sem ativo (1) ou passivo (2).");
    const a = saldo(at.v.VAL_CTA_REF_FIN!, at.v.IND_VAL_CTA_REF_FIN!);
    const p = saldo(pa.v.VAL_CTA_REF_FIN!, pa.v.IND_VAL_CTA_REF_FIN!);
    return conferir(a === -p, `Ativo ${reais(a)} igual ao passivo ${reais(-p)} no fim de ${c.linha.periodo}.`, `Ativo ${reais(a)} diferente do passivo ${reais(-p)}.`);
  },
  "*:REGRA_BALANCO_SALDO_INICIAL": (c) => {
    const lista = ["A00", "A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10", "A11", "A12", "T01"];
    if (!lista.includes(c.linha.periodo ?? "")) return naoAplica(`Período ${c.linha.periodo}: a regra vale para A00 a A12 e T01.`);
    const at = contaL100(c, "1", c.linha.periodo);
    const pa = contaL100(c, "2", c.linha.periodo);
    if (!at || !pa) return erro("Balanço sem ativo (1) ou passivo (2).");
    const a = saldo(at.v.VAL_CTA_REF_INI!, at.v.IND_VAL_CTA_REF_INI!);
    const p = saldo(pa.v.VAL_CTA_REF_INI!, pa.v.IND_VAL_CTA_REF_INI!);
    return conferir(a === -p, "Ativo inicial igual ao passivo inicial.", `Ativo inicial ${reais(a)} diferente do passivo ${reais(-p)}.`);
  },
};

const prefixar = (reg: string, r: Record<string, Regra>) => Object.fromEntries(Object.entries(r).map(([k, f]) => [`${reg}.${k}`, f]));

/** Chave: “REGISTRO.CAMPO:CODIGO”; “*” no lugar do campo para regra do registro. */
export const REGRAS: Readonly<Record<string, Regra>> = {
  "0035.COD_SCP:REGRA_VALIDA_TAM_SCP": tamanhoScp0035,
  "0035.COD_SCP:REGRA_CNPJ_DIFERENTE_SCP": scpDiferenteDoCnpj,
  ...prefixar("0000", r0000),
  ...prefixar("M300", rM300),
  ...prefixar("L100", rL100),
};

export const chaveRegra = (reg: string, campoNome: string, codigo: string) => `${reg}.${campoNome}:${codigo}`;
