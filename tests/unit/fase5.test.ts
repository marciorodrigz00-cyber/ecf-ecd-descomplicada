import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { lerDinheiro, aplicar } from "@/lib/calculo/dinheiro";
import { lucroPresumido, lucroReal, type EntradaPresumido, type EntradaReal } from "@/lib/calculo/tributos";
import { anos, regra } from "@/lib/conteudo";
import { registroDoAno } from "@/lib/conteudo/leiautes";
import { parametros } from "@/lib/conteudo/tributos";
import { entradaInicial, exemplos, isenta, presumido, presumidoMontado, real, realMontado, tabelas } from "@/lib/exemplos";
import type { Linha } from "@/lib/exemplos/montar";
import { validarArquivo } from "@/lib/exemplos/validar";

const par = parametros(2025);
const r = (n: number) => BigInt(Math.round(n * 100));
const er = (x: Partial<Record<keyof EntradaReal, number>>): EntradaReal => {
  const z = { lucro: 0, adicoesIrpj: 0, exclusoesIrpj: 0, adicoesCsll: 0, exclusoesCsll: 0, saldoPrejuizo: 0, saldoBaseNegativa: 0, irRetido: 0, csllRetida: 0, ...x };
  const { meses = 3, ...resto } = z as Record<string, number>;
  return { ...Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, r(v!)])), meses } as EntradaReal;
};
const ep = (x: Record<string, number>): EntradaPresumido => ({
  receitas: { geral: r(x.geral ?? 0), servicos: r(x.servicos ?? 0), transporte: r(x.transporte ?? 0), combustiveis: r(x.combustiveis ?? 0) },
  financeiras: r(x.financeiras ?? 0), demais: r(x.demais ?? 0), irRetido: r(x.irRetido ?? 0), csllRetida: r(x.csllRetida ?? 0), meses: x.meses ?? 3,
});

describe("Simulador: casos calculados à mão", () => {
  // [descrição, entrada, IRPJ a pagar, CSLL a pagar, conta feita à mão]
  test.each<[string, Parameters<typeof er>[0], number, number, string]>([
    ["tudo zero", {}, 0, 0, "Base 0: nada a calcular."],
    ["exatamente no limite do adicional", { lucro: 60000 }, 9000, 5400, "IRPJ 60.000 × 15% = 9.000; limite 3 × 20.000 = 60.000, sem excedente. CSLL 60.000 × 9% = 5.400."],
    ["um centavo acima do limite", { lucro: 60000.01 }, 9000, 5400, "IRPJ 60.000,01 × 15% = 9.000,0015 → 9.000,00; adicional 0,01 × 10% = 0,001 → 0. CSLL 5.400,0009 → 5.400,00."],
    ["acima do limite", { lucro: 100000 }, 19000, 9000, "IRPJ 15.000 + (100.000 − 60.000) × 10% = 15.000 + 4.000 = 19.000. CSLL 9.000."],
    ["um mês: limite de um mês", { lucro: 30000, meses: 1 }, 5500, 2700, "IRPJ 4.500 + (30.000 − 20.000) × 10% = 5.500. CSLL 2.700."],
    ["doze meses: limite do ano", { lucro: 300000, meses: 12 }, 51000, 27000, "IRPJ 45.000 + (300.000 − 240.000) × 10% = 51.000. CSLL 27.000."],
    ["prejuízo contábil", { lucro: -50000 }, 0, 0, "Base −50.000: sem IRPJ e sem CSLL."],
    ["prejuízo contábil que vira lucro fiscal", { lucro: -5000, adicoesIrpj: 25000, adicoesCsll: 25000 }, 3000, 1800, "−5.000 + 25.000 = 20.000. IRPJ 3.000. CSLL 1.800."],
    ["compensação limitada", { lucro: 20000, saldoPrejuizo: 100000, saldoBaseNegativa: 100000 }, 2100, 1260, "20.000 × 30% = 6.000 compensáveis; base 14.000. IRPJ 2.100. CSLL 1.260."],
    ["saldo menor que o limite", { lucro: 100000, saldoPrejuizo: 10000, saldoBaseNegativa: 10000 }, 16500, 8100, "Limite 30.000, saldo 10.000: base 90.000. IRPJ 13.500 + 30.000 × 10% = 16.500. CSLL 8.100."],
    ["ajustes diferentes na CSLL", { lucro: 10000, adicoesIrpj: 2000, adicoesCsll: 5000, exclusoesCsll: 1000 }, 1800, 1260, "IRPJ: 10.000 + 2.000 = 12.000 × 15% = 1.800. CSLL: 10.000 + 5.000 − 1.000 = 14.000 × 9% = 1.260."],
    ["retenção maior que o devido", { lucro: 10000, irRetido: 2000, csllRetida: 1000 }, -500, -100, "IRPJ 1.500 − 2.000 = −500. CSLL 900 − 1.000 = −100."],
    ["arredondamento", { lucro: 33.33 }, 5, 3, "IRPJ 33,33 × 15% = 4,9995 → 5,00. CSLL 33,33 × 9% = 2,9997 → 3,00."],
    ["4º trimestre da Móveis Aurora", { lucro: 189000, exclusoesIrpj: 5000, exclusoesCsll: 5000, saldoPrejuizo: 66000, saldoBaseNegativa: 66000 }, 26200, 11592, "189.000 − 5.000 = 184.000; 30% = 55.200 (saldo 66.000); base 128.800. IRPJ 19.320 + 68.800 × 10% = 26.200. CSLL 128.800 × 9% = 11.592."],
  ])("[CT-050] lucro real: %s", (_, x, irpj, csll, conta) => {
    const c = lucroReal(er(x), par);
    expect([c.irpj.pagar, c.csll.pagar], conta).toEqual([r(irpj), r(csll)]);
    expect(c.total).toBe(r(irpj) + r(csll));
  });

  test("[CT-051] controle de prejuízo e base negativa", () => {
    const a = lucroReal(er({ lucro: -50000, adicoesIrpj: 10000, adicoesCsll: 12000, saldoPrejuizo: 7000, saldoBaseNegativa: 0 }), par);
    expect([a.irpjAjuste.ajustado, a.irpjAjuste.compensado, a.irpjAjuste.saldoFinal]).toEqual([r(-40000), 0n, r(47000)]);
    expect(a.csllAjuste.saldoFinal).toBe(r(38000));
    const b = lucroReal(er({ lucro: 184000, saldoPrejuizo: 66000, saldoBaseNegativa: 66000 }), par);
    expect([b.irpjAjuste.limite, b.irpjAjuste.compensado, b.irpjAjuste.base, b.irpjAjuste.saldoFinal]).toEqual([r(55200), r(55200), r(128800), r(10800)]);
  });

  test.each<[string, Record<string, number>, number, number, string]>([
    ["tudo zero", {}, 0, 0, "Receita 0: nada a calcular."],
    ["comércio no limite do adicional", { geral: 750000 }, 9000, 8100, "IRPJ: 750.000 × 8% = 60.000; × 15% = 9.000, sem excedente. CSLL: 750.000 × 12% = 90.000; × 9% = 8.100."],
    ["comércio e serviço, com aplicação e retenção", { geral: 400000, servicos: 70000, financeiras: 8000, irRetido: 1200 }, 8400, 7056, "IRPJ: 32.000 + 22.400 + 8.000 = 62.400; 9.360 + 240 − 1.200 = 8.400. CSLL: 48.000 + 22.400 + 8.000 = 78.400 × 9% = 7.056."],
    ["combustíveis", { combustiveis: 1000000 }, 2400, 10800, "IRPJ: 1.000.000 × 1,6% = 16.000 × 15% = 2.400. CSLL: 120.000 × 9% = 10.800."],
    ["transporte, exceto carga", { transporte: 100000 }, 2400, 1080, "IRPJ: 100.000 × 16% = 16.000 × 15% = 2.400. CSLL: 12.000 × 9% = 1.080."],
    ["serviço acima do limite", { servicos: 300000 }, 18000, 8640, "Base 300.000 × 32% = 96.000. IRPJ 14.400 + 36.000 × 10% = 18.000. CSLL 8.640."],
    ["ganho de capital entra inteiro", { geral: 100000, demais: 10000 }, 2700, 1980, "IRPJ: 8.000 + 10.000 = 18.000 × 15% = 2.700. CSLL: 12.000 + 10.000 = 22.000 × 9% = 1.980."],
    ["um mês", { servicos: 100000, meses: 1 }, 6000, 2880, "Base 100.000 × 32% = 32.000. IRPJ 4.800 + (32.000 − 20.000) × 10% = 6.000. CSLL 2.880."],
  ])("[CT-052] lucro presumido: %s", (_, x, irpj, csll, conta) => {
    const c = lucroPresumido(ep(x), par);
    expect([c.irpj.pagar, c.csll.pagar], conta).toEqual([r(irpj), r(csll)]);
  });

  test("[CT-053] entradas inválidas são recusadas", () => {
    for (const meses of [0, 13, 1.5, Number.NaN]) expect(() => lucroReal({ ...er({}), meses }, par)).toThrow(RangeError);
    expect(() => lucroReal(er({ saldoPrejuizo: -1 }), par)).toThrow(RangeError);
    expect(() => lucroPresumido(ep({ geral: -1 }), par)).toThrow(RangeError);
    expect(() => lucroReal(er({ lucro: -1 }), par)).not.toThrow();
  });

  test("[CT-054] leitura de valores em pt-BR", () => {
    const ok: [string, bigint][] = [["", 0n], ["0", 0n], ["1.234,56", 123456n], ["1234,5", 123450n], ["R$ 10", 1000n], ["-10,01", -1001n], ["−5", -500n], [" 7 ", 700n], ["1.000.000", 100000000n]];
    for (const [t, v] of ok) expect(lerDinheiro(t), t).toBe(v);
    for (const t of ["abc", "1,234.56", "1.23", "12.34,5", "1,234", "--1", "1e5", "<img src=x>", "{{7*7}}", "99999999999999999999", "1,2,3", "-"]) expect(lerDinheiro(t), t).toBeNull();
    expect(aplicar(-3333n, 1500)).toBe(-500n);
  });

  test("[CT-055] cada passo cita regra existente e a soma dos passos fecha", () => {
    for (const a of anos) {
      const c = [lucroReal(er({ lucro: 189000, saldoPrejuizo: 66000 }), parametros(a)), lucroPresumido(ep({ geral: 400000, servicos: 70000, transporte: 1, combustiveis: 1 }), parametros(a))];
      for (const p of c.flatMap((x) => x.blocos.flatMap((b) => b.passos))) {
        expect(p.regras.length).toBeGreaterThan(0);
        for (const id of p.regras) expect(() => regra(id, a), `${p.id} ${id}`).not.toThrow();
      }
    }
  });
});

describe("Regras de tributos", () => {
  test("[CN-034] simulador abre com os dados das empresas fictícias, sem valor no componente", () => {
    // Digitado à mão a partir do 4º trimestre das duas empresas.
    expect(entradaInicial).toEqual({
      lucro: "189.000,00", exclusoes: "5.000,00", prejuizo: "66.000,00", baseNegativa: "66.000,00",
      geral: "400.000,00", servicos: "70.000,00", financeiras: "8.000,00", irRetidoP: "1.200,00",
    });
    const tela = readFileSync("src/components/simulador/index.tsx", "utf8").replaceAll("Digite um valor como 1.234,56.", "");
    expect(tela).not.toMatch(/\d{1,3}(?:\.\d{3})+|\d{4,}(?!px)|\d+,[1-9]\d?\b/);
    const conta = readFileSync("src/lib/calculo/tributos.ts", "utf8");
    expect(conta).not.toMatch(/\b0[.,]\d|\d\s*%|\b(?:1500|3000|2000000|20000|60000)n?\b/);
  });

  test("[CN-035] linhas da ECF citadas pelo simulador existem na tabela oficial", () => {
    const c = [
      lucroReal(er({ lucro: 100000, adicoesIrpj: 1, saldoPrejuizo: 1, saldoBaseNegativa: 1 }), par),
      lucroPresumido(ep({ geral: 1, servicos: 1, transporte: 1, combustiveis: 1 }), par),
    ];
    const citadas = [...new Set(c.flatMap((x) => x.blocos.flatMap((b) => b.passos.map((p) => p.linha))))].filter((l) => l?.includes("linha"));
    expect(citadas.length).toBeGreaterThan(15);
    for (const l of citadas) {
      const [, reg, cod] = /^(\w+), linha (.+)$/.exec(l!)!;
      const tab = { ...tabelas.linhas, ...tabelas.lalur } as Record<string, { codigo: string }[]>;
      expect(tab[reg!]?.some((x) => x.codigo === cod), l!).toBe(true);
    }
  });

  test("[CN-020] valores digitados à mão a partir das leis", () => {
    const esperado: Record<string, [string, RegExp]> = {
      "irpj-aliquota": ["15%", /9\.249\/1995, art\. 3º, caput/],
      "irpj-adicional": ["10%", /9\.249\/1995, art\. 3º, § 1º/],
      "csll-aliquota": ["9%", /7\.689\/1988, art\. 3º, III/],
      "comp-prejuizo": ["30%", /9\.065\/1995, art\. 15/],
      "comp-base-negativa": ["30%", /9\.065\/1995, art\. 16/],
      "pres-irpj-geral": ["8%", /art\. 15, caput/],
      "pres-irpj-combustiveis": ["1,6%", /art\. 15, § 1º, I$/],
      "pres-irpj-transporte": ["16%", /art\. 15, § 1º, II/],
      "pres-irpj-servicos": ["32%", /art\. 15, § 1º, III/],
      "pres-csll-geral": ["12%", /art\. 20, III/],
      "pres-csll-servicos": ["32%", /art\. 20, I,/],
    };
    for (const a of anos) {
      for (const [id, [valor, norma]] of Object.entries(esperado)) {
        const x = regra(id, a);
        expect(x.valor.tipo === "percentual" && new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 2 }).format(x.valor.pontosBase / 1e4), id).toBe(valor);
        expect(x.norma, id).toMatch(norma);
      }
      expect(parametros(a).limiteMes).toBe(2000000);
    }
    expect(regra("arredondamento", 2025).status).toBe("a-verificar");
  });

  test("[CN-021] parâmetros batem com as fórmulas oficiais da ECF", () => {
    const f = (reg: string, cod: string) => tabelas.linhas[reg]!.find((l) => l.codigo === cod)!.formula!;
    expect(f("N630", "3")).toContain("*0,15");
    expect(f("N630", "4")).toMatch(/20000 \* MESES_PERIODO\(\)\) \* 0,1/);
    expect(f("N670", "2")).toContain("0,09");
    expect(f("P200", "10")).toMatch(/P200\(2\)\*0,016\).*P200\(4\)\*0,08\).*P200\(6\)\*0,16\).*P200\(8\)\*0,32/);
    expect(f("P400", "6")).toMatch(/P400\(2\) \* 0,12\).*P400\(4\) \* 0,32/);
    expect(tabelas.lalur.M300.find((l) => l.codigo === "169")!.formula).toBe("M300(2) + M300(93) - M300(168)");
    expect(tabelas.lalur.M300.find((l) => l.codigo === "2")!.formula).toContain('L300("3.02.01.01.01.01")');
  });
});

const val = (s: string) => {
  const v = lerDinheiro(s.replace(/\.(?=\d{3})/g, ""));
  if (v === null) throw new Error(s);
  return v;
};
const de = (linhas: readonly Linha[], reg: string) => linhas.filter((l) => l.reg === reg);

describe("Exemplos", () => {
  test("[CN-022] toda linha respeita o leiaute, e o validador enxerga erro", () => {
    for (const e of exemplos) expect(validarArquivo(e.arquivo.linhas, (x) => registroDoAno(x, 2025)), e.dados.slug).toEqual([]);
    const l0 = exemplos[0]!.arquivo.linhas;
    const muda = (reg: string, i: number, v: string) => validarArquivo(l0.map((l) => (l.reg === reg ? { ...l, campos: l.campos.map((c, k) => (k === i ? v : c)) } : l)), (x) => registroDoAno(x, 2025));
    expect(muda("0010", 2, "77").length).toBeGreaterThan(0);
    expect(muda("0000", 2, "").length).toBeGreaterThan(0);
    expect(muda("K155", 2, "dez").length).toBeGreaterThan(0);
    expect(muda("0000", 2, "999999999999999").length).toBeGreaterThan(0);
    expect(validarArquivo([{ reg: "S100", campos: [], explicacao: "x" }], (x) => registroDoAno(x, 2025)).length).toBe(1);
    expect(validarArquivo([{ reg: "0001", campos: ["0", "0"], explicacao: "x" }], (x) => registroDoAno(x, 2025)).length).toBe(1);
  });

  test("[CN-023] lucro real: partidas, balanço e saldos fecham", () => {
    const L = realMontado.arquivo.linhas;
    for (const p of real.periodos) for (const l of p.lancamentos) for (const c of [l.d, l.c]) expect(real.contas.find((x) => x.codigo === c)?.ref, c).toBeTruthy();
    const [, bal] = realMontado.arquivo.resumo;
    const t = (r0: string) => bal!.linhas.find((l) => l.rotulo === r0)!.valores;
    expect(t("TOTAL DO ATIVO")).toEqual(t("TOTAL DO PASSIVO E DO PATRIMÔNIO LÍQUIDO"));
    expect(t("TOTAL DO ATIVO")).toEqual([r(412000), r(616000)]);
    // K155: soma zero, débitos = créditos e saldo inicial = final anterior.
    const porPeriodo: Linha[][] = [];
    for (const l of L.filter((x) => x.reg.startsWith("K"))) if (l.reg === "K030") porPeriodo.push([]); else porPeriodo.at(-1)?.push(l);
    let anterior = new Map<string, bigint>();
    for (const per of porPeriodo) {
      const k = de(per, "K155").map((l) => ({ cta: l.campos[0]!, ini: val(l.campos[2]!) * (l.campos[3] === "D" ? 1n : -1n), d: val(l.campos[4]!), c: val(l.campos[5]!), fim: val(l.campos[6]!) * (l.campos[7] === "D" ? 1n : -1n) }));
      expect(k.reduce((a, x) => a + x.ini, 0n)).toBe(0n);
      expect(k.reduce((a, x) => a + x.fim, 0n)).toBe(0n);
      expect(k.reduce((a, x) => a + x.d - x.c, 0n)).toBe(0n);
      for (const x of k) {
        expect(x.ini + x.d - x.c, x.cta).toBe(x.fim);
        expect(x.ini, x.cta).toBe(anterior.get(x.cta) ?? 0n);
      }
      anterior = new Map(k.map((x) => [x.cta, x.fim]));
    }
  });

  test("[CN-024] lucro real: L, M e N se conversam", () => {
    const L = realMontado.arquivo.linhas;
    const dividir = (letra: string) => {
      const out: Linha[][] = [];
      for (const l of L.filter((x) => x.reg[0] === letra)) if (l.reg === `${letra}030`) out.push([]); else out.at(-1)?.push(l);
      return out;
    };
    const [l, m, n] = [dividir("L"), dividir("M"), dividir("N")];
    l.forEach((per, i) => {
      const bal = new Map(de(per, "L100").map((x) => [x.campos[0]!, x]));
      expect(bal.get("1")!.campos[10]).toBe(bal.get("2")!.campos[10]);
      for (const x of per.filter((y) => y.reg === "L100" && y.campos[2] === "S")) {
        const filhos = de(per, "L100").filter((y) => y.campos[5] === x.campos[0]);
        const s = (y: Linha) => val(y.campos[10]!) * (y.campos[11] === "D" ? 1n : -1n);
        expect(filhos.reduce((a, y) => a + s(y), 0n), x.campos[0]).toBe(s(x));
      }
      const dre = (c: string) => { const x = de(per, "L300").find((y) => y.campos[0] === c); return x ? val(x.campos[6]!) * (x.campos[7] === "C" ? 1n : -1n) : 0n; };
      const M300 = (c: string, reg = "M300") => { const x = m[i]!.filter((y) => y.reg === reg && y.campos[0] === c); return x.reduce((a, y) => a + val(y.campos[4]!), 0n); };
      // Fórmula oficial da linha 2: resultado antes dos tributos mais a CSLL (que é negativa no resultado).
      expect(M300("2")).toBe(dre("3.01") + dre("3.02.01.01.01.01"));
      expect(M300("2", "M350")).toBe(dre("3.01"));
      for (const reg of ["M300", "M350"]) {
        expect(M300("93", reg)).toBe(M300("6", reg) + M300("8.60", reg) + M300("9", reg));
        expect(M300("168", reg)).toBe(M300("95", reg));
        expect(M300("169", reg)).toBe(M300("2", reg) + M300("93", reg) - M300("168", reg));
        expect(M300("175", reg)).toBe(M300("171", reg) - M300("173", reg));
      }
      const N = (reg: string, c: string) => val(de(n[i]!, reg).find((y) => y.campos[0] === c)!.campos[2]!);
      expect(N("N500", "1")).toBe(M300("175"));
      expect(N("N630", "1")).toBe(N("N500", "1"));
      expect(N("N650", "1")).toBe(M300("175", "M350"));
      expect(N("N630", "26")).toBe(N("N630", "3") + N("N630", "4"));
      expect(N("N630", "26")).toBe(-dre("3.02.01.01.01.02"));
      expect(N("N670", "21")).toBe(-dre("3.02.01.01.01.01"));
      // Detalhe da parte B e das contas igual ao valor da linha.
      let atual: Linha | null = null;
      const det = new Map<Linha, { b: bigint; c: bigint }>();
      for (const y of m[i]!) {
        if (y.reg === "M300" || y.reg === "M350") { atual = y; det.set(y, { b: 0n, c: 0n }); }
        else if (/^M(305|355)$/.test(y.reg)) det.get(atual!)!.b += val(y.campos[1]!);
        else if (/^M(310|360)$/.test(y.reg)) det.get(atual!)!.c += val(y.campos[2]!);
      }
      for (const [y, d] of det) {
        const v = val(y.campos[4]!);
        if (y.campos[3] === "1") expect([d.b, d.c]).toEqual([v, 0n]);
        if (y.campos[3] === "2") expect([d.b, d.c]).toEqual([0n, v]);
        if (y.campos[3] === "3") expect([d.b, d.c]).toEqual([v, v]);
      }
    });
    // M500: saldo inicial + movimentos = final; final de um período = inicial do outro.
    const m500 = m.map((per) => new Map(de(per, "M500").map((y) => [y.campos.slice(0, 2).join(), y.campos])));
    const sinal = (c: string[], i: number) => val(c[i]!) * (c[i + 1] === "D" ? 1n : -1n);
    for (const [k, c] of m500[1]!) {
      expect(sinal(c, 2) + sinal(c, 4) + sinal(c, 6), k).toBe(sinal(c, 8));
      expect(sinal(m500[0]!.get(k)!, 8), k).toBe(sinal(c, 2));
    }
    expect(m500[1]!.get("PF,I")![8]).toBe("10800,00");
  });

  test("[CN-025] presumido: P, Q e Y se conversam", () => {
    const L = presumidoMontado.arquivo.linhas;
    expect(presumidoMontado.periodos.map((p) => [p.calc.irpj.pagar, p.calc.csll.pagar])).toEqual([
      [r(5520), r(4392)], [r(6240), r(4896)], [r(7080), r(5508)], [r(8400), r(7056)],
    ]);
    const receita = presumido.periodos.reduce((a, p) => a + p.receitas.geral + p.receitas.servicos, 0);
    expect(receita).toBe(159000000); // acima do limite que exige o livro caixa
    const q = de(L, "Q100");
    let s = 0n;
    q.forEach((l, i) => {
      const [ent, sai] = [l.campos[3] ? val(l.campos[3]) : 0n, l.campos[4] ? val(l.campos[4]) : 0n];
      expect(ent === 0n || sai === 0n).toBe(true);
      s = i === 0 ? ent : s + ent - sai;
      expect(val(l.campos[5]!)).toBe(s);
    });
    expect(s).toBe(r(314800));
    expect(de(L, "Y570")[0]!.campos[5]).toBe("1200,00");
    expect(de(L, "Y672")[0]!.campos[5]).toBe("314800,00");
    const p300 = de(L, "P300").filter((l) => l.campos[0] === "1").map((l) => l.campos[2]);
    const p200 = de(L, "P200").filter((l) => l.campos[0] === "26").map((l) => l.campos[2]);
    expect(p300).toEqual(p200);
  });

  test("[CN-026] isenta: totais do X390 e registros exigidos pelo Manual", () => {
    const L = exemplos[2]!.arquivo.linhas;
    const x = (c: string) => val(de(L, "X390").find((l) => l.campos[0] === c)!.campos[2]!);
    expect([x("8"), x("16"), x("17")]).toEqual([r(342000), r(322000), r(20000)]);
    for (const reg of ["0000", "0010", "0020", "0030", "0930", "X390", "Y612"]) expect(de(L, reg).length, reg).toBeGreaterThan(0);
    expect(de(L, "0930")).toHaveLength(1);
    expect(isenta.tipoEntidade).toBe("05");
  });

  test("[CN-027] encerramento de cada bloco conta as próprias linhas e toda linha tem explicação", () => {
    for (const e of exemplos) {
      for (const letra of new Set(e.arquivo.linhas.map((l) => l.reg[0]!))) {
        const doBloco = e.arquivo.linhas.filter((l) => l.reg[0] === letra);
        expect(doBloco.at(-1)!.reg).toBe(`${letra}990`);
        expect(doBloco.at(-1)!.campos[0]).toBe(String(doBloco.length));
      }
      for (const l of e.arquivo.linhas) expect(l.explicacao.length, l.reg).toBeGreaterThan(10);
      expect(e.arquivo.linhas.some((l) => l.reg.startsWith("S"))).toBe(false);
    }
  });

  test("[CN-028] CNPJ e CPF dos exemplos são inválidos de propósito", () => {
    const dv = (base: string, pesos: number[]) => { const s = [...base].reduce((a, d, i) => a + Number(d) * pesos[i]!, 0) % 11; return s < 2 ? 0 : 11 - s; };
    const valido = (c: string) => { const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; const a = dv(c.slice(0, 12), p1); return c.endsWith(`${a}${dv(c.slice(0, 12) + a, [6, ...p1])}`); };
    expect(valido("11111111000191")).toBe(true);
    const bruto = ["lucro-real", "lucro-presumido", "isenta"].map((f) => readFileSync(`content/exemplos/${f}.json`, "utf8")).join("");
    const cnpjs = [...bruto.matchAll(/"(\d{14})"/g)].map((m) => m[1]!);
    expect(cnpjs.length).toBe(4);
    for (const c of cnpjs) expect(valido(c), c).toBe(false);
    for (const m of bruto.matchAll(/"cpf": "(\d+)"/g)) expect(m[1]).toBe("00000000000");
    for (const m of bruto.matchAll(/"email": "([^"]+)"/g)) expect(m[1]).toMatch(/\.invalid$/);
  });
});
