import { aplicar, type Centavos } from "./dinheiro";

/**
 * LC nº 224/2025 em números. Nenhum percentual mora aqui: tudo chega de content/regras/lc224.json.
 * Dinheiro em centavos (bigint) e percentuais em pontos-base inteiros.
 */

/** Percentual de presunção acrescido: 800 (8%) com acréscimo de 1000 (10%) vira 880 (8,8%). */
export function presuncaoAcrescida(pb: number, acrescimoPb: number): number {
  const bruto = pb * (10000 + acrescimoPb);
  if (bruto % 10000 !== 0) throw new RangeError(`Percentual acrescido não é inteiro em pontos-base: ${pb} + ${acrescimoPb}`);
  return bruto / 10000;
}

/**
 * Reparte o limite do período pela proporção da receita de cada atividade (IN RFB nº 2.305/2025, art. 15, § 6º).
 * Arredonda ao centavo e deixa a sobra do arredondamento na última atividade com receita, para a soma fechar.
 */
export function repartirLimite(receitas: Centavos[], limite: Centavos): Centavos[] {
  const total = receitas.reduce((a, b) => a + b, 0n);
  if (total <= limite) return [...receitas];
  const partes = receitas.map((r) => (r * limite * 2n + total) / (total * 2n));
  const ultima = receitas.findLastIndex((r) => r > 0n);
  partes[ultima] = partes[ultima]! + (limite - partes.reduce((a, b) => a + b, 0n));
  return partes;
}

export type LinhaPresumida = { receita: Centavos; ateLimite: Centavos; excedente: Centavos; pb: number; pbAcrescido: number };

/** Base presumida do período com o acréscimo sobre a parte acima do limite. O total é arredondado uma vez só. */
export function presumidoComAcrescimo(itens: { receita: Centavos; pb: number }[], limite: Centavos, acrescimoPb: number) {
  const ate = repartirLimite(
    itens.map((i) => i.receita),
    limite,
  );
  const linhas: LinhaPresumida[] = itens.map((i, k) => ({
    receita: i.receita,
    ateLimite: ate[k]!,
    excedente: i.receita - ate[k]!,
    pb: i.pb,
    pbAcrescido: presuncaoAcrescida(i.pb, acrescimoPb),
  }));
  const bruto = linhas.reduce((a, l) => a + l.ateLimite * BigInt(l.pb) + l.excedente * BigInt(l.pbAcrescido), 0n);
  return { linhas, total: (bruto + 5000n) / 10000n };
}

/**
 * Dedução do imposto devido limitada (Perguntas e Respostas da RFB, perguntas 21 e 21.1):
 * o limite legal é multiplicado pelo fator (90% em 2026) e o valor aplicado é deduzido até esse novo limite.
 */
export function deducaoLimitada(irDevido15: Centavos, limitePb: number, fatorPb: number, aplicado: Centavos) {
  const limite = aplicar(irDevido15, limitePb);
  const limiteReduzido = aplicar(limite, fatorPb);
  const deduzivel = aplicado < limiteReduzido ? aplicado : limiteReduzido;
  const antes = aplicado < limite ? aplicado : limite;
  return { limite, limiteReduzido, deduzivel, antes, diferenca: antes - deduzivel };
}
