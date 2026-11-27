import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lucroPresumido } from "@/lib/calculo/tributos";
import { deducaoLimitada, presumidoComAcrescimo, presuncaoAcrescida, repartirLimite } from "@/lib/calculo/lc224";
import { fontes, regra } from "@/lib/conteudo";
import { incentivos } from "@/lib/conteudo/incentivos";
import { parametros, parametrosLc224 } from "@/lib/conteudo/tributos";
import { HOSTS_OFICIAIS } from "@/schemas";

const reais = (v: number) => BigInt(Math.round(v * 100));

describe("Cálculo da LC 224 com os exemplos oficiais", () => {
  it("[CT-134] percentual acrescido: 8% vira 8,8%; 32% vira 35,2%; 20% de acréscimo: 8% vira 9,6%", () => {
    expect(presuncaoAcrescida(800, 1000)).toBe(880);
    expect(presuncaoAcrescida(3200, 1000)).toBe(3520);
    expect(presuncaoAcrescida(1200, 1000)).toBe(1320);
    expect(presuncaoAcrescida(160, 1000)).toBe(176);
    expect(presuncaoAcrescida(800, 2000)).toBe(960);
  });
  it("[CT-134] P&R 11: comércio, R$ 1.500.000 no trimestre = 8% × 1.250.000 + 8,8% × 250.000", () => {
    const r = presumidoComAcrescimo([{ receita: reais(1_500_000), pb: 800 }], reais(1_250_000), 1000);
    expect(r.linhas[0]).toMatchObject({ ateLimite: reais(1_250_000), excedente: reais(250_000), pbAcrescido: 880 });
    // Conta à mão: 100.000,00 + 22.000,00
    expect(r.total).toBe(reais(122_000));
  });
  it("[CT-134] P&R 14: comércio 1.440.000 e serviços 360.000 no trimestre", () => {
    expect(repartirLimite([reais(1_440_000), reais(360_000)], reais(1_250_000))).toEqual([reais(1_000_000), reais(250_000)]);
    const r = presumidoComAcrescimo(
      [
        { receita: reais(1_440_000), pb: 800 },
        { receita: reais(360_000), pb: 3200 },
      ],
      reais(1_250_000),
      1000,
    );
    // Conta à mão: 80.000 + 38.720 + 80.000 + 38.720 = 237.440
    expect(r.total).toBe(reais(237_440));
  });
  it("[CT-134] Manual, Bloco P, XII: 700.000 a 8% e 700.000 a 16%; excedente de 150.000 repartido meio a meio", () => {
    expect(repartirLimite([reais(700_000), reais(700_000)], reais(1_250_000))).toEqual([reais(625_000), reais(625_000)]);
  });
  it("[CT-134] abaixo do limite, nada muda; repartição sempre fecha no limite", () => {
    expect(repartirLimite([reais(400_000), reais(300_000)], reais(1_250_000))).toEqual([reais(400_000), reais(300_000)]);
    const partes = repartirLimite([100_000_001n, 33_333_333n, 77_777_777n], reais(1_250_000));
    expect(partes.reduce((a, b) => a + b, 0n)).toBe(reais(1_250_000));
  });
  it("[CT-134] P&R 21: limite de 4% sobre IRPJ de 10.000; doado 1.000 deduz 360; doado 200 deduz 200", () => {
    expect(deducaoLimitada(reais(10_000), 400, 9000, reais(1_000))).toMatchObject({ limite: reais(400), limiteReduzido: reais(360), deduzivel: reais(360), antes: reais(400) });
    expect(deducaoLimitada(reais(10_000), 400, 9000, reais(200))).toMatchObject({ deduzivel: reais(200), diferenca: 0n });
  });
});

describe("Simulador do lucro presumido no AC 2026", () => {
  const par = parametrosLc224();
  const zero = { geral: 0n, combustiveis: 0n, transporte: 0n, servicos: 0n };
  it("[CT-135] IRPJ com acréscimo no 1º trimestre; CSLL só a partir do 2º", () => {
    const entrada = { receitas: { ...zero, geral: reais(1_440_000), servicos: reais(360_000) }, financeiras: 0n, demais: 0n, irRetido: 0n, csllRetida: 0n, meses: 3 };
    const t1 = lucroPresumido(entrada, par.base, { trimestre: 1, ...par.lc224 });
    expect(t1.presumidoIrpj).toBe(reais(237_440));
    // CSLL do 1º trimestre sem acréscimo: 12% × 1.440.000 + 32% × 360.000
    expect(t1.presumidoCsll).toBe(reais(172_800 + 115_200));
    const t2 = lucroPresumido(entrada, par.base, { trimestre: 2, ...par.lc224 });
    // CSLL do 2º trimestre com acréscimo: 12% × 1.000.000 + 13,2% × 440.000 + 32% × 250.000 + 35,2% × 110.000
    expect(t2.presumidoCsll).toBe(reais(120_000 + 58_080 + 80_000 + 38_720));
  });
  it("[CT-135] receitas financeiras não entram no limite e não recebem acréscimo", () => {
    const entrada = { receitas: { ...zero, geral: reais(1_000_000) }, financeiras: reais(500_000), demais: 0n, irRetido: 0n, csllRetida: 0n, meses: 3 };
    const r = lucroPresumido(entrada, par.base, { trimestre: 1, ...par.lc224 });
    expect(r.presumidoIrpj).toBe(reais(80_000));
    expect(r.baseIrpj).toBe(reais(580_000));
  });
  it("[CT-135] sem a LC 224, o AC 2025 continua igual", () => {
    const entrada = { receitas: { ...zero, geral: reais(1_500_000) }, financeiras: 0n, demais: 0n, irRetido: 0n, csllRetida: 0n, meses: 3 };
    expect(lucroPresumido(entrada, parametros(2025)).presumidoIrpj).toBe(reais(120_000));
  });
});

describe("Fichas de incentivo", () => {
  it("[CN-079] toda ficha tem fonte do catálogo, base legal oficial e camada de 2026", () => {
    expect(incentivos.length).toBeGreaterThanOrEqual(13);
    for (const i of incentivos) {
      expect(fontes.some((f) => f.id === i.fonte.id), i.id).toBe(true);
      for (const b of i.baseLegal) expect(HOSTS_OFICIAIS as readonly string[], i.id).toContain(new URL(b.url).hostname);
      expect(i.porAno.some((p) => p.ac === 2026), i.id).toBe(true);
    }
  });
  it("[CN-079] a camada da LC 239 (AC 2027) fica sempre 'a verificar' até haver orientação da Receita", () => {
    for (const i of incentivos) {
      const p = i.porAno.find((x) => x.ac === 2027);
      expect(p?.status, i.id).toBe("a-verificar");
      expect(p?.fonte.id, i.id).toBe("lc-239");
    }
    expect(regra("lc239-acrescimo-presuncao", 2027).status).toBe("a-verificar");
  });
  it("[CN-079] classificação conferida com as fontes lidas", () => {
    const sit = Object.fromEntries(incentivos.map((i) => [i.id, i.situacao]));
    expect(sit).toMatchObject({
      "lucro-presumido": "reduzido",
      pat: "reduzido",
      esporte: "reduzido",
      "lei-rouanet": "reduzido",
      "doacoes-entidades-civis": "a-verificar",
      "lei-do-bem": "excetuado",
      informatica: "excetuado",
      padis: "excetuado",
      "ti-tic-capacitacao": "excetuado",
      "entidades-sem-fins-lucrativos": "excetuado",
      "assistencia-medica-previdencia": "nao-beneficio",
      "sudam-sudene": "a-verificar",
      audiovisual: "a-verificar",
      "fundos-crianca-idoso": "a-verificar",
      "pronon-pronas": "a-verificar",
    });
  });
  it("[CN-079] regras do AC 2026 têm o leiaute 12 (situações especiais de 2026)", () => {
    for (const id of ["lc224-acrescimo-presuncao", "lc224-limite-anual", "lc224-limite-trimestral", "lc224-inicio-irpj", "lc224-inicio-csll", "lc224-deducao-imposto"]) {
      const r = regra(id, 2026);
      expect(r.leiautes, id).toEqual(["12"]);
      expect(r.vigencia.situacaoEspecial, id).toContain(2026);
    }
  });
  it("[CN-080] nenhum percentual da LC 224 escrito à mão no código", () => {
    for (const f of ["src/lib/calculo/lc224.ts", "src/lib/calculo/tributos.ts"]) {
      const codigo = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      expect(codigo, f).not.toMatch(/\b(?:1000|2000|9000|8000|125000000|500000000)\b/);
    }
  });
});
