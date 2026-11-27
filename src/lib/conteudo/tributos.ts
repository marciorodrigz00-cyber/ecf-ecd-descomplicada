import { regra } from "./index";
import type { Parametros } from "@/lib/calculo/tributos";

function pontos(id: string, ano: number): number {
  const { valor } = regra(id, ano);
  if (valor.tipo !== "percentual") throw new Error(`${id} não é percentual`);
  return valor.pontosBase;
}

/**
 * Simulador do AC 2026 (lucro presumido): base do AC 2025 mais a camada da LC nº 224/2025.
 * Os percentuais-base são os do AC 2025; a interface avisa que, para 2026, eles ainda não foram conferidos um a um.
 */
export function parametrosLc224() {
  const acrescimo = regra("lc224-acrescimo-presuncao", 2026).valor;
  const limite = regra("lc224-limite-trimestral", 2026).valor;
  const inicioCsll = regra("lc224-inicio-csll", 2026).valor;
  if (acrescimo.tipo !== "percentual" || limite.tipo !== "dinheiro" || inicioCsll.tipo !== "data") throw new Error("Regras da LC 224 com tipo inesperado");
  const mes = Number(inicioCsll.data.slice(5, 7));
  return {
    ac: regra("lc224-acrescimo-presuncao", 2026).vigencia.acNormal[0]!,
    base: parametros(2025),
    lc224: { limiteTrimestre: BigInt(limite.centavos), acrescimoPb: acrescimo.pontosBase, trimestreInicioCsll: Math.floor((mes - 1) / 3) + 1 },
  };
}

/** Parâmetros do ano, sempre a partir das regras rastreáveis. */
export function parametros(ano: number): Parametros {
  const limite = regra("irpj-adicional-limite", ano).valor;
  if (limite.tipo !== "dinheiro") throw new Error("irpj-adicional-limite não é dinheiro");
  const csllGeral = pontos("pres-csll-geral", ano);
  return {
    irpj: pontos("irpj-aliquota", ano),
    adicional: pontos("irpj-adicional", ano),
    limiteMes: limite.centavos,
    csll: pontos("csll-aliquota", ano),
    compPrejuizo: pontos("comp-prejuizo", ano),
    compBaseNegativa: pontos("comp-base-negativa", ano),
    presIrpj: {
      geral: pontos("pres-irpj-geral", ano),
      combustiveis: pontos("pres-irpj-combustiveis", ano),
      transporte: pontos("pres-irpj-transporte", ano),
      servicos: pontos("pres-irpj-servicos", ano),
    },
    presCsll: { geral: csllGeral, combustiveis: csllGeral, transporte: csllGeral, servicos: pontos("pres-csll-servicos", ano) },
  };
}
