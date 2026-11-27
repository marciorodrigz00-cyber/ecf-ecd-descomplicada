import { aplicar, menor, positivo, soma, type Centavos } from "./dinheiro";
import { presumidoComAcrescimo } from "./lc224";

/** Parâmetros vindos de content/regras/tributos.json. Nenhum número fiscal mora aqui. */
export type Parametros = {
  irpj: number;
  adicional: number;
  limiteMes: number;
  csll: number;
  compPrejuizo: number;
  compBaseNegativa: number;
  presIrpj: Record<Atividade, number>;
  presCsll: Record<Atividade, number>;
};
export const ATIVIDADES = ["geral", "combustiveis", "transporte", "servicos"] as const;
export type Atividade = (typeof ATIVIDADES)[number];

export type Passo = {
  id: string;
  titulo: string;
  /** Como se chega ao valor, com os números do caso. */
  conta: (string | { valor: Centavos } | { percentual: number })[];
  valor: Centavos;
  regras: string[];
  /** Onde o número aparece na ECF. */
  linha: string | null;
  destaque?: boolean;
};

export type Bloco = { titulo: string; passos: Passo[] };

const v = (valor: Centavos) => ({ valor });
const p = (percentual: number) => ({ percentual });

function irpjSobre(base: Centavos, meses: number, retido: Centavos, par: Parametros, reg: "N630" | "P300") {
  const tributavel = positivo(base);
  const limite = BigInt(par.limiteMes) * BigInt(meses);
  const excedente = positivo(base - limite);
  const normal = aplicar(tributavel, par.irpj);
  const adicional = aplicar(excedente, par.adicional);
  const devido = normal + adicional;
  const pagar = devido - retido;
  const final = reg === "N630" ? "26" : "15";
  const ret = reg === "N630" ? "20" : "10";
  const passos: Passo[] = [
    { id: "irpj-normal", titulo: "IRPJ à alíquota normal", conta: [v(tributavel), " × ", p(par.irpj)], valor: normal, regras: ["irpj-aliquota"], linha: `${reg}, linha 3` },
    { id: "limite", titulo: `Limite do adicional em ${meses} ${meses === 1 ? "mês" : "meses"}`, conta: [v(BigInt(par.limiteMes)), ` × ${meses}`], valor: limite, regras: ["irpj-adicional-limite"], linha: null },
    { id: "irpj-adicional", titulo: "Adicional do IRPJ", conta: excedente > 0n ? ["(", v(base), " − ", v(limite), ") × ", p(par.adicional)] : ["A base não passa do limite"], valor: adicional, regras: ["irpj-adicional", "irpj-adicional-integral"], linha: `${reg}, linha 4` },
    { id: "irpj-devido", titulo: "IRPJ do período", conta: [v(normal), " + ", v(adicional)], valor: devido, regras: ["irpj-aliquota", "irpj-adicional"], linha: null },
    { id: "irpj-retido", titulo: "Imposto retido na fonte", conta: ["Valor informado"], valor: retido, regras: ["formulas-ecf"], linha: `${reg}, linha ${ret}` },
    { id: "irpj-pagar", titulo: pagar < 0n ? "IRPJ: saldo negativo" : "IRPJ a pagar", conta: [v(devido), " − ", v(retido)], valor: pagar, regras: ["formulas-ecf", "arredondamento"], linha: `${reg}, linha ${final}`, destaque: true },
  ];
  return { normal, adicional, limite, devido, pagar, passos };
}

function csllSobre(base: Centavos, retida: Centavos, par: Parametros, reg: "N670" | "P500") {
  const tributavel = positivo(base);
  const devida = aplicar(tributavel, par.csll);
  const pagar = devida - retida;
  const passos: Passo[] = [
    { id: "csll-devida", titulo: "CSLL do período", conta: [v(tributavel), " × ", p(par.csll)], valor: devida, regras: ["csll-aliquota"], linha: `${reg}, linha 2` },
    { id: "csll-retida", titulo: "CSLL retida na fonte", conta: ["Valor informado"], valor: retida, regras: ["formulas-ecf"], linha: `${reg}, linha ${reg === "N670" ? "17" : "11"}` },
    { id: "csll-pagar", titulo: pagar < 0n ? "CSLL: saldo negativo" : "CSLL a pagar", conta: [v(devida), " − ", v(retida)], valor: pagar, regras: ["formulas-ecf", "arredondamento"], linha: `${reg}, linha ${reg === "N670" ? "21" : "13"}`, destaque: true },
  ];
  return { devida, pagar, passos };
}

export type EntradaReal = {
  /** Lucro antes do IRPJ e da CSLL. Negativo = prejuízo contábil. */
  lucro: Centavos;
  adicoesIrpj: Centavos;
  exclusoesIrpj: Centavos;
  adicoesCsll: Centavos;
  exclusoesCsll: Centavos;
  saldoPrejuizo: Centavos;
  saldoBaseNegativa: Centavos;
  irRetido: Centavos;
  csllRetida: Centavos;
  meses: number;
};

function ajustar(lucro: Centavos, adicoes: Centavos, exclusoes: Centavos, saldo: Centavos, limitePb: number) {
  const ajustado = lucro + adicoes - exclusoes;
  const limite = aplicar(positivo(ajustado), limitePb);
  const compensado = menor(positivo(saldo), limite);
  return { ajustado, limite, compensado, base: ajustado - compensado, saldoFinal: saldo - compensado + positivo(-ajustado) };
}

export function lucroReal(e: EntradaReal, par: Parametros) {
  exigirMeses(e.meses);
  exigirNaoNegativos({ ...e, lucro: 0n, meses: 0n });
  const i = ajustar(e.lucro, e.adicoesIrpj, e.exclusoesIrpj, e.saldoPrejuizo, par.compPrejuizo);
  const c = ajustar(e.lucro, e.adicoesCsll, e.exclusoesCsll, e.saldoBaseNegativa, par.compBaseNegativa);
  const irpj = irpjSobre(i.base, e.meses, e.irRetido, par, "N630");
  const csll = csllSobre(c.base, e.csllRetida, par, "N670");
  const ajustes = (x: typeof i, ad: Centavos, ex: Centavos, saldo: Centavos, pb: number, reg: "M300" | "M350", regra: string): Passo[] => [
    { id: `${reg}-ajustado`, titulo: reg === "M300" ? "Lucro real antes da compensação" : "Base da CSLL antes da compensação", conta: [v(e.lucro), " + ", v(ad), " − ", v(ex)], valor: x.ajustado, regras: ["lucro-real-conceito", "formulas-ecf"], linha: `${reg}, linha 169` },
    { id: `${reg}-limite`, titulo: "Limite de compensação", conta: x.ajustado > 0n ? [v(x.ajustado), " × ", p(pb)] : ["Sem resultado positivo, não há o que compensar"], valor: x.limite, regras: [regra], linha: null },
    { id: `${reg}-compensado`, titulo: reg === "M300" ? "Prejuízo fiscal compensado" : "Base negativa compensada", conta: ["O menor entre o saldo de ", v(positivo(saldo)), " e o limite de ", v(x.limite)], valor: x.compensado, regras: [regra], linha: `${reg}, linha 173` },
    { id: `${reg}-base`, titulo: reg === "M300" ? (x.base < 0n ? "Prejuízo fiscal do período" : "Lucro real") : x.base < 0n ? "Base negativa do período" : "Base de cálculo da CSLL", conta: [v(x.ajustado), " − ", v(x.compensado)], valor: x.base, regras: ["formulas-ecf"], linha: `${reg}, linha 175`, destaque: true },
    { id: `${reg}-saldo`, titulo: "Saldo para os próximos períodos", conta: [v(saldo), " − ", v(x.compensado), ...(x.ajustado < 0n ? [" + ", v(-x.ajustado)] : [])], valor: x.saldoFinal, regras: [regra, "controle-saldos"], linha: "M500" },
  ];
  const blocos: Bloco[] = [
    { titulo: "Lucro real", passos: ajustes(i, e.adicoesIrpj, e.exclusoesIrpj, e.saldoPrejuizo, par.compPrejuizo, "M300", "comp-prejuizo") },
    { titulo: "IRPJ", passos: irpj.passos },
    { titulo: "Base da CSLL", passos: ajustes(c, e.adicoesCsll, e.exclusoesCsll, e.saldoBaseNegativa, par.compBaseNegativa, "M350", "comp-base-negativa") },
    { titulo: "CSLL", passos: csll.passos },
  ];
  return { irpjAjuste: i, csllAjuste: c, irpj, csll, blocos, total: irpj.pagar + csll.pagar };
}

export type EntradaPresumido = {
  receitas: Record<Atividade, Centavos>;
  /** Rendimentos de aplicações financeiras. */
  financeiras: Centavos;
  /** Demais receitas e ganhos de capital. */
  demais: Centavos;
  irRetido: Centavos;
  csllRetida: Centavos;
  meses: number;
};

const LINHA_P200: Record<Atividade, string> = { combustiveis: "2", geral: "4", transporte: "6", servicos: "8" };
const NOME: Record<Atividade, string> = {
  geral: "comércio, indústria e transporte de carga",
  combustiveis: "revenda de combustíveis",
  transporte: "transporte, exceto de carga",
  servicos: "serviços em geral",
};

/** Camada da LC nº 224/2025 para um trimestre de 2026. Os valores vêm de content/regras/lc224.json. */
export type CamadaLc224 = { trimestre: number; limiteTrimestre: Centavos; acrescimoPb: number; trimestreInicioCsll: number };

export function lucroPresumido(e: EntradaPresumido, par: Parametros, lc224?: CamadaLc224) {
  exigirMeses(e.meses);
  exigirNaoNegativos({ ...e.receitas, financeiras: e.financeiras, demais: e.demais, irRetido: e.irRetido, csllRetida: e.csllRetida });
  if (lc224 && (!Number.isInteger(lc224.trimestre) || lc224.trimestre < 1 || lc224.trimestre > 4)) throw new RangeError("Trimestre entre 1 e 4");
  const comAcrescimo = (tributo: "irpj" | "csll") => Boolean(lc224) && (tributo === "irpj" || lc224!.trimestre >= lc224!.trimestreInicioCsll);
  const com = ATIVIDADES.filter((k) => e.receitas[k] > 0n);
  // O total é arredondado uma vez só, como na fórmula da linha que soma as parcelas.
  const presumir = (pres: Record<Atividade, number>, tributo: "irpj" | "csll") => {
    if (comAcrescimo(tributo)) return presumidoComAcrescimo(com.map((k) => ({ receita: e.receitas[k], pb: pres[k] })), lc224!.limiteTrimestre, lc224!.acrescimoPb).total;
    const bruto = ATIVIDADES.reduce((a, k) => a + e.receitas[k] * BigInt(pres[k]), 0n);
    return (bruto + 5000n) / 10000n;
  };
  const presumidoIrpj = presumir(par.presIrpj, "irpj");
  const presumidoCsll = presumir(par.presCsll, "csll");
  const baseIrpj = presumidoIrpj + e.financeiras + e.demais;
  const baseCsll = presumidoCsll + e.financeiras + e.demais;
  const irpj = irpjSobre(baseIrpj, e.meses, e.irRetido, par, "P300");
  const csll = csllSobre(baseCsll, e.csllRetida, par, "P500");
  const regraPres = (k: Atividade, tributo: "irpj" | "csll") => (tributo === "irpj" ? `pres-irpj-${k}` : k === "servicos" ? "pres-csll-servicos" : "pres-csll-geral");
  const linhaPres = (k: Atividade, tributo: "irpj" | "csll") => (tributo === "irpj" ? `P200, linha ${LINHA_P200[k]}` : `P400, linha ${k === "servicos" ? "4" : "2"}`);
  /** Com a LC 224: até o limite, o percentual normal; acima, o acrescido. */
  const parcelasLc224 = (pres: Record<Atividade, number>, tributo: "irpj" | "csll"): Passo[] => {
    const r = presumidoComAcrescimo(com.map((k) => ({ receita: e.receitas[k], pb: pres[k] })), lc224!.limiteTrimestre, lc224!.acrescimoPb);
    const regrasLc = ["lc224-acrescimo-presuncao", "lc224-limite-trimestral", tributo === "irpj" ? "lc224-inicio-irpj" : "lc224-inicio-csll"];
    return [
      {
        id: `${tributo}-limite-lc224`,
        titulo: "Limite do trimestre sem acréscimo",
        conta: !r.linhas.some((l) => l.excedente > 0n)
          ? ["A receita do trimestre não passa do limite: não há acréscimo"]
          : r.linhas.length > 1
            ? ["Repartido pela receita de cada atividade: ", ...r.linhas.flatMap((l, i) => [...(i ? [" + "] : []), v(l.ateLimite)])]
            : ["Valor da regra"],
        valor: lc224!.limiteTrimestre,
        regras: ["lc224-limite-trimestral", "lc224-limite-anual"],
        linha: null,
      },
      ...com.flatMap((k, i): Passo[] => {
        const l = r.linhas[i]!;
        return [
          { id: `${tributo}-${k}`, titulo: `Receita de ${NOME[k]} até o limite`, conta: [v(l.ateLimite), " × ", p(l.pb)], valor: aplicar(l.ateLimite, l.pb), regras: [regraPres(k, tributo)], linha: linhaPres(k, tributo) },
          ...(l.excedente > 0n
            ? [{ id: `${tributo}-${k}-acrescimo`, titulo: `Receita de ${NOME[k]} acima do limite, com acréscimo`, conta: [v(l.excedente), " × ", p(l.pbAcrescido)], valor: aplicar(l.excedente, l.pbAcrescido), regras: [regraPres(k, tributo), ...regrasLc], linha: linhaPres(k, tributo) }]
            : []),
        ];
      }),
    ];
  };
  const parcelas = (pres: Record<Atividade, number>, tributo: "irpj" | "csll"): Passo[] =>
    comAcrescimo(tributo) ? parcelasLc224(pres, tributo) : ATIVIDADES.filter((k) => e.receitas[k] > 0n).map((k) => ({
      id: `${tributo}-${k}`,
      titulo: `Receita de ${NOME[k]}`,
      conta: [v(e.receitas[k]), " × ", p(pres[k])],
      valor: aplicar(e.receitas[k], pres[k]),
      regras: [tributo === "irpj" ? `pres-irpj-${k}` : k === "servicos" ? "pres-csll-servicos" : "pres-csll-geral"],
      linha: tributo === "irpj" ? `P200, linha ${LINHA_P200[k]}` : `P400, linha ${k === "servicos" ? "4" : "2"}`,
    }));
  const base = (tributo: "irpj" | "csll", presumido: Centavos, total: Centavos): Passo[] => [
    { id: `${tributo}-presumido`, titulo: "Lucro presumido da receita", conta: ["Soma das parcelas"], valor: presumido, regras: ["presumido-base"], linha: tributo === "irpj" ? "P200, linha 10" : "P400, linha 6" },
    { id: `${tributo}-base`, titulo: tributo === "irpj" ? "Base do IRPJ" : "Base da CSLL", conta: [v(presumido), " + ", v(e.financeiras), " + ", v(e.demais)], valor: total, regras: ["formulas-ecf"], linha: tributo === "irpj" ? "P200, linha 26" : "P400, linha 21", destaque: true },
  ];
  const blocos: Bloco[] = [
    { titulo: "Base do IRPJ", passos: [...parcelas(par.presIrpj, "irpj"), ...base("irpj", presumidoIrpj, baseIrpj)] },
    { titulo: "IRPJ", passos: irpj.passos },
    { titulo: "Base da CSLL", passos: [...parcelas(par.presCsll, "csll"), ...base("csll", presumidoCsll, baseCsll)] },
    { titulo: "CSLL", passos: csll.passos },
  ];
  return { presumidoIrpj, presumidoCsll, baseIrpj, baseCsll, irpj, csll, blocos, total: irpj.pagar + csll.pagar };
}

function exigirMeses(m: number) {
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new RangeError("Meses do período entre 1 e 12");
}
function exigirNaoNegativos(o: Record<string, bigint | number>) {
  for (const [k, x] of Object.entries(o)) if (x < 0) throw new RangeError(`${k} não pode ser negativo`);
}
export { soma };
