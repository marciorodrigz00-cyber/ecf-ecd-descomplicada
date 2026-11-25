import { regra } from "./index";
import type { Parametros } from "@/lib/calculo/tributos";

function pontos(id: string, ano: number): number {
  const { valor } = regra(id, ano);
  if (valor.tipo !== "percentual") throw new Error(`${id} não é percentual`);
  return valor.pontosBase;
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
