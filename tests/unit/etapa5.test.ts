import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "vitest";
import { registroDoAno } from "@/lib/conteudo/leiautes";
import { realMontado } from "@/lib/exemplos";
import { montarArquivo, montarLinha, separarLinha, type LinhaArq } from "@/lib/simulacao/arquivo";
import { montarSimulacao, roteiros, simulacaoDe } from "@/lib/simulacao/montar";
import { REGRAS, centavos, cnpjValido, reais, type Contexto } from "@/lib/simulacao/regras";
import * as S from "@/schemas";

const { conferirRoteiro } = await import(/* @vite-ignore */ pathToFileURL(path.resolve(".claude/hooks/lib/roteiros.mjs")).href);

const linha = (reg: string, v: Record<string, string>, extra: Partial<LinhaArq> = {}): LinhaArq => ({ indice: 0, reg, v: { REG: reg, ...v }, pai: null, periodo: null, ...extra });
const ctx = (l: LinhaArq, outros: Partial<Contexto> = {}): Contexto => ({
  linha: l,
  arquivo: [l],
  extras: {},
  leiautePorAno: { 2024: "11", 2025: "12" },
  tipoDaLinha: () => undefined,
  ...outros,
});
const estado = (chave: string, c: Contexto) => REGRAS[chave]!(c).estado;

describe("Etapa 5: motor de regras com casos feitos à mão", () => {
  test("[CN-074] dinheiro em centavos, sem ponto flutuante", () => {
    expect(centavos("1.234,56".replace(/\./g, ""))).toBe(123456n);
    expect(centavos("-88000,00")).toBe(-8800000n);
    expect(centavos("0,5")).toBe(50n);
    expect(centavos("7")).toBe(700n);
    expect(() => centavos("12.5")).toThrow();
    expect(reais(-8800000n)).toBe("-88.000,00");
    expect(reais(5n)).toBe("0,05");
  });

  test("[CN-074] CNPJ: dígitos verificadores calculados à mão", () => {
    // 11.111.111/0001-91: DV1 = 11 − (46 mod 11) = 9; DV2 = 11 − (65 mod 11) = 1.
    expect(cnpjValido("11111111000191")).toBe(true);
    // 11.111.111/0002-91 (o da SCP no exemplo do Manual): o DV1 seria 7. O 0035 não confere dígitos.
    expect(cnpjValido("11111111000291")).toBe(false);
    expect(cnpjValido("00000000000000")).toBe(false);
    expect(cnpjValido("1111111100019")).toBe(false);
  });

  test("[CN-074] 0035: tamanho e CNPJ diferente da sócia ostensiva", () => {
    const extras = { "0000.CNPJ": "11111111000191" };
    expect(estado("0035.COD_SCP:REGRA_VALIDA_TAM_SCP", ctx(linha("0035", { COD_SCP: "11111111000291" })))).toBe("passou");
    expect(estado("0035.COD_SCP:REGRA_VALIDA_TAM_SCP", ctx(linha("0035", { COD_SCP: "1111111100029" })))).toBe("falhou");
    expect(estado("0035.COD_SCP:REGRA_VALIDA_TAM_SCP", ctx(linha("0035", { COD_SCP: "111111110002911" })))).toBe("falhou");
    expect(estado("0035.COD_SCP:REGRA_CNPJ_DIFERENTE_SCP", ctx(linha("0035", { COD_SCP: "11111111000291" }), { extras }))).toBe("passou");
    expect(estado("0035.COD_SCP:REGRA_CNPJ_DIFERENTE_SCP", ctx(linha("0035", { COD_SCP: "11111111000191" }), { extras }))).toBe("falhou");
    // O CNPJ da empresa no próprio arquivo vence o dos extras.
    const l0 = linha("0000", { CNPJ: "22222222000191" });
    const l1 = linha("0035", { COD_SCP: "22222222000191" }, { indice: 1 });
    expect(estado("0035.COD_SCP:REGRA_CNPJ_DIFERENTE_SCP", ctx(l1, { arquivo: [l0, l1], extras }))).toBe("falhou");
  });

  test("[CN-074] 0000: datas, leiaute e campos condicionais", () => {
    const base = { COD_VER: "0012", DT_INI: "01012025", DT_FIN: "31122025", SIT_ESPECIAL: "0", IND_SIT_INI_PER: "0", RETIFICADORA: "N", NUM_REC: "", TIP_ECF: "0", COD_SCP: "", DT_SIT_ESP: "" };
    const c = (v: Record<string, string>) => ctx(linha("0000", { ...base, ...v }));
    expect(estado("0000.COD_VER:REGRA_LEIAUTE_VIGENTE", c({}))).toBe("passou");
    expect(estado("0000.COD_VER:REGRA_LEIAUTE_VIGENTE", c({ COD_VER: "0011" }))).toBe("falhou");
    expect(estado("0000.DT_FIN:REGRA_DT_FINAL_ESCRITURACAO", c({ DT_FIN: "30122025" }))).toBe("falhou");
    expect(estado("0000.DT_INI:REGRA_DATA_MINIMA", c({ DT_INI: "01012014" }))).toBe("passou");
    expect(estado("0000.DT_INI:REGRA_DATA_MINIMA", c({ DT_INI: "31122013" }))).toBe("falhou");
    expect(estado("0000.DT_INI:REGRA_ANO_DIFERENTE", c({ DT_FIN: "31122026" }))).toBe("falhou");
    expect(estado("0000.DT_INI:REGRA_SEM_LEIAUTE", c({ DT_INI: "01012030" }))).toBe("falhou");
    expect(estado("0000.NUM_REC:REGRA_NRO_REC_ANTERIOR_NAO_SE_APLICA", c({ NUM_REC: "123" }))).toBe("falhou");
    expect(estado("0000.NUM_REC:REGRA_REC_ANTERIOR_OBRIGATORIO", c({}))).toBe("nao-se-aplica");
    expect(estado("0000.NUM_REC:REGRA_REC_ANTERIOR_OBRIGATORIO", c({ RETIFICADORA: "S" }))).toBe("falhou");
    expect(estado("0000.COD_SCP:REGRA_SCP_OBRIGATORIO", c({ TIP_ECF: "2" }))).toBe("falhou");
    expect(estado("0000.COD_SCP:REGRA_SCP_NAO_PREENCHER", c({ COD_SCP: "11111111000191" }))).toBe("falhou");
    // Véspera do evento (SIT_ESPECIAL 7 a 9), virando o mês.
    expect(estado("0000.DT_FIN:REGRA_EVENTO_ACONTECIMENTO", c({ SIT_ESPECIAL: "8", DT_SIT_ESP: "01072025", DT_FIN: "30062025" }))).toBe("passou");
    expect(estado("0000.DT_FIN:REGRA_EVENTO_ACONTECIMENTO", c({ SIT_ESPECIAL: "8", DT_SIT_ESP: "01072025", DT_FIN: "01072025" }))).toBe("falhou");
  });

  test("[CN-074] M300: valor detalhado com a conversão de sinais", () => {
    const j050 = (cta: string, nat: string, i: number) => linha("J050", { COD_CTA: cta, COD_NAT: nat }, { indice: i });
    const caso = (tipo: string, nat: string, ind: string, valor = "1000,00") => {
      const m300 = linha("M300", { CODIGO: "2", TIPO_LANCAMENTO: tipo, IND_RELACAO: "2", VALOR: valor }, { indice: 1 });
      const m310 = linha("M310", { COD_CTA: "X", IND_VL_CTA: ind, VL_CTA: "1000,00" }, { indice: 2, pai: 1 });
      return estado("M300.*:REGRA_VALOR_DETALHADO", ctx(m300, { arquivo: [j050("X", nat, 0), m300, m310] }));
    };
    // Adição com conta de resultado (natureza 04) a débito: soma.
    expect(caso("A", "04", "D")).toBe("passou");
    expect(caso("A", "04", "C")).toBe("falhou");
    expect(caso("A", "04", "D", "999,99")).toBe("falhou");
    // Adição com conta patrimonial (01): o sinal se inverte.
    expect(caso("A", "01", "C")).toBe("passou");
    // Exclusão com conta de resultado a crédito.
    expect(caso("E", "04", "C")).toBe("passou");
    expect(caso("E", "4", "C")).toBe("passou");
  });

  test("[CN-074] M300: relacionamento e compensação de prejuízo", () => {
    const m300 = (v: Record<string, string>) => linha("M300", { TIPO_LANCAMENTO: "A", IND_RELACAO: "1", ...v });
    const comFilho = (l: LinhaArq, filho: string) => ctx(l, { arquivo: [l, linha(filho, {}, { indice: 1, pai: 0 })] });
    expect(estado("M300.TIPO_LANCAMENTO:REGRA_RELACAO_INEXISTENTE", comFilho(m300({}), "M305"))).toBe("passou");
    expect(estado("M300.TIPO_LANCAMENTO:REGRA_RELACAO_INEXISTENTE", comFilho(m300({}), "M310"))).toBe("falhou");
    expect(estado("M300.TIPO_LANCAMENTO:REGRA_RELACAO_INEXISTENTE", ctx(m300({ IND_RELACAO: "4" })))).toBe("passou");
    expect(estado("M300.IND_RELACAO:REGRA_IND_RELACAO", ctx(m300({ TIPO_LANCAMENTO: "P", IND_RELACAO: "2" })))).toBe("falhou");
    expect(estado("M300.IND_RELACAO:REGRA_IND_RELACAO", ctx(m300({ TIPO_LANCAMENTO: "A", IND_RELACAO: "2" })))).toBe("nao-se-aplica");
  });

  test("[CN-074] L100: saldo final = inicial + débitos − créditos, com D/C", () => {
    const l100 = (v: Record<string, string>) =>
      ctx(linha("L100", { CODIGO: "1.01", VAL_CTA_REF_INI: "100,00", IND_VAL_CTA_REF_INI: "D", VAL_CTA_REF_DEB: "50,00", VAL_CTA_REF_CRED: "30,00", VAL_CTA_REF_FIN: "120,00", IND_VAL_CTA_REF_FIN: "D", ...v }));
    const k = "L100.VAL_CTA_REF_FIN:REGRA_VALIDACAO_SALDO_FINAL_BAL";
    expect(estado(k, l100({}))).toBe("passou");
    expect(estado(k, l100({ VAL_CTA_REF_FIN: "120,01" }))).toBe("falhou");
    // −100 + 50 − 30 = −80: saldo credor.
    expect(estado(k, l100({ IND_VAL_CTA_REF_INI: "C", VAL_CTA_REF_FIN: "80,00", IND_VAL_CTA_REF_FIN: "C" }))).toBe("passou");
    expect(estado(k, l100({ IND_VAL_CTA_REF_INI: "C", VAL_CTA_REF_FIN: "80,00", IND_VAL_CTA_REF_FIN: "D" }))).toBe("falhou");
    // Zero sem indicador de sinal relevante.
    expect(estado(k, l100({ VAL_CTA_REF_INI: "0,00", VAL_CTA_REF_DEB: "30,00", VAL_CTA_REF_FIN: "0,00" }))).toBe("passou");
  });

  test("[CN-074] L100: ativo igual ao passivo só nos períodos da regra", () => {
    const conta = (codigo: string, fin: string, ind: string, i: number, periodo: string) =>
      linha("L100", { CODIGO: codigo, VAL_CTA_REF_INI: "0,00", IND_VAL_CTA_REF_INI: "D", VAL_CTA_REF_FIN: fin, IND_VAL_CTA_REF_FIN: ind }, { indice: i, periodo });
    const arq = (p: string, passivo: string) => [conta("1", "500,00", "D", 0, p), conta("2", passivo, "C", 1, p)];
    const k = "L100.*:REGRA_BALANCO_SALDO_FINAL";
    expect(estado(k, ctx(arq("T04", "500,00")[0]!, { arquivo: arq("T04", "500,00") }))).toBe("passou");
    expect(estado(k, ctx(arq("T04", "499,99")[0]!, { arquivo: arq("T04", "499,99") }))).toBe("falhou");
    expect(estado(k, ctx(arq("T02", "499,99")[0]!, { arquivo: arq("T02", "499,99") }))).toBe("nao-se-aplica");
  });

  test("[CN-074] arquivo: pai pelo nível e período pelo registro *030", () => {
    const leiaute = (reg: string) =>
      ({ L001: { codigo: "L001", nivel: "1", campos: [{ nome: "REG" }, { nome: "IND" }] }, L030: { codigo: "L030", nivel: "2", campos: [{ nome: "REG" }, { nome: "PER_APUR" }] }, L100: { codigo: "L100", nivel: "3", campos: [{ nome: "REG" }, { nome: "CODIGO" }] } })[reg];
    const arq = montarArquivo(
      [
        { reg: "L001", campos: ["0"] },
        { reg: "L030", campos: ["T01"] },
        { reg: "L100", campos: ["1"] },
        { reg: "L030", campos: ["T02"] },
        { reg: "L100", campos: ["1"] },
      ],
      leiaute,
    );
    expect(arq.map((l) => [l.pai, l.periodo])).toEqual([[null, null], [0, "T01"], [1, "T01"], [0, "T02"], [3, "T02"]]);
    expect(() => montarArquivo([{ reg: "L100", campos: [] }], leiaute)).toThrow(/campos/);
    expect(montarLinha("0035", ["1", ""])).toBe("|0035|1||");
    expect(separarLinha("|0035|1||")).toEqual(["0035", "1", ""]);
  });

  test("[CN-074] ajustes da revisão fiscal: cada regra segue o próprio texto", () => {
    // 0035 fala em 14 caracteres; 0000, em 14 números.
    expect(estado("0035.COD_SCP:REGRA_VALIDA_TAM_SCP", ctx(linha("0035", { COD_SCP: "AB111111000191" })))).toBe("passou");
    expect(estado("0000.COD_SCP:REGRA_VALIDA_TAM_SCP", ctx(linha("0000", { COD_SCP: "AB111111000191" })))).toBe("falhou");
    // Situação especial em 2026 usa o leiaute 12, o do AC 2025.
    const especial = (sitEsp: string) =>
      ctx(linha("0000", { COD_VER: "0012", DT_INI: "01012026", SIT_ESPECIAL: sitEsp }), { leiauteSituacaoEspecial: { 2026: "12" } });
    expect(estado("0000.COD_VER:REGRA_LEIAUTE_VIGENTE", especial("1"))).toBe("passou");
    expect(estado("0000.DT_INI:REGRA_SEM_LEIAUTE", especial("1"))).toBe("passou");
    expect(estado("0000.DT_INI:REGRA_SEM_LEIAUTE", especial("0"))).toBe("falhou");
    // “Vazio fora do tipo E” não está no texto do Manual: não há código para ele.
    for (const campo of ["TIPO_LANCAMENTO", "IND_RELACAO"]) expect(REGRAS[`M300.${campo}:REGRA_NAO_PREENCHER_TIPO_DIFERENTE_E`]).toBeUndefined();
    // 0020 da Móveis Aurora (TIP_ECF = 0): IND_QTE_SCP vazio, como manda REGRA_SCP_NAO_PREENCHER_QTD.
    const l0020 = realMontado.arquivo.linhas.find((l) => l.reg === "0020")!;
    expect(l0020.campos[1]).toBe("");
  });
});

describe("Etapa 5: os roteiros dos pilotos", () => {
  const pilotos = ["0035", "0000", "M300", "L100"];

  test("[CN-075] os 4 pilotos existem e montam sem erro", () => {
    expect(roteiros.map((r) => r.registro).sort()).toEqual([...pilotos].sort());
    for (const r of roteiros) {
      const s = montarSimulacao(r);
      expect(s.regras.every((x) => x.resultado?.estado !== "falhou"), r.registro).toBe(true);
      expect(s.erro.regra.resultado?.estado, r.registro).toBe("falhou");
      expect(s.erro.linha, r.registro).not.toBe(s.linha);
      expect(r.rastreio.status, r.registro).not.toBe("revisado");
    }
  });

  test("[CN-075] linha do 0035 igual ao exemplo do Manual; as outras vêm do gerador do site", () => {
    expect(simulacaoDe("0035", 2025)!.linha).toBe("|0035|11111111000291|SCP TESTE 1|");
    expect(simulacaoDe("0035", 2025)!.linha).toBe(registroDoAno("0035", 2025)!.exemplo[0]);
    const geradas = new Set(realMontado.arquivo.linhas.map((l) => montarLinha(l.reg, l.campos)));
    for (const c of ["0000", "M300", "L100"]) expect(geradas.has(simulacaoDe(c, 2025)!.linha), c).toBe(true);
  });

  test("[CN-075] todas as regras do Manual aparecem; as não simuladas dizem por quê", () => {
    for (const r of roteiros) {
      const reg = registroDoAno(r.registro, r.ano)!;
      const s = montarSimulacao(r);
      const manual = new Set([...reg.regrasRegistro.map((x) => `*:${x.codigo}`), ...reg.regrasCampo.flatMap((g) => g.regras.map((x) => `${g.campo}:${x.codigo}`))]);
      expect(new Set(s.regras.map((x) => `${x.campo}:${x.codigo}`)), r.registro).toEqual(manual);
      for (const x of s.regras.filter((y) => !y.simulada)) expect(x.motivo?.length ?? 0, `${r.registro} ${x.codigo}`).toBeGreaterThan(10);
    }
  });

  test("[CN-075] o schema recusa regra não simulada sem motivo e erro numa regra não simulada", () => {
    const base = JSON.parse(readFileSync("content/roteiros/l/l100.json", "utf8"));
    expect(S.Roteiro.safeParse(base).success).toBe(true);
    const semMotivo = structuredClone(base);
    const i = semMotivo.regras.findIndex((x: { simulada: boolean }) => !x.simulada);
    delete semMotivo.regras[i].motivo;
    expect(S.Roteiro.safeParse(semMotivo).success).toBe(false);
    const erroNaoSimulado = structuredClone(base);
    erroNaoSimulado.erro.regra = base.regras[i].codigo;
    expect(S.Roteiro.safeParse(erroNaoSimulado).success).toBe(false);
  });

  test("[CN-076] o hook recusa roteiro que não confere com o Manual", async () => {
    const rel = "content/roteiros/0/0035.json";
    const base = S.Roteiro.parse(JSON.parse(readFileSync(rel, "utf8")));
    const muda = (f: (r: S.Roteiro) => void) => {
      const r = structuredClone(base);
      f(r);
      return conferirRoteiro(rel, r);
    };
    expect((await conferirRoteiro(rel, base)).erros).toEqual([]);
    expect((await conferirRoteiro("content/roteiros/0/0036.json", base)).erros.join()).toMatch(/precisa ficar em/);
    expect((await muda((r) => (r.linha.campos.NOME_SCP = "OUTRA SCP"))).erros.join()).toMatch(/difere do exemplo do Manual/);
    expect((await muda((r) => r.regras.pop())).erros.join()).toMatch(/regra do Manual fora do roteiro/);
    expect((await muda((r) => (r.erro.valor = "11111111000291"))).erros.join()).toMatch(/não falha/);
    expect((await muda((r) => (r.erro.valor = "111111110001911"))).erros.join()).toMatch(/formato/);
    expect((await muda((r) => (r.extras = { "0000.CNPJ": "11111111000291" }))).erros.join()).toMatch(/cenário normal falha/);
    expect((await muda((r) => (r.fatos[0]!.campos = ["0000.NAO_EXISTE"]))).erros.join()).toMatch(/não existe/);
  });
});
