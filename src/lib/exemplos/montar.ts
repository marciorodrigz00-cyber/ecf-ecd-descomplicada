import { lucroPresumido, lucroReal, type Parametros } from "@/lib/calculo/tributos";
import type { ExemploIsenta, ExemploPresumido, ExemploReal, Tabelas } from "@/schemas";

/** Uma linha do arquivo: registro, campos depois do REG e a explicação em português. */
export type Linha = { reg: string; campos: string[]; explicacao: string };
export type Arquivo = { linhas: Linha[]; resumo: Resumo[] };
export type Resumo = { titulo: string; linhas: { rotulo: string; valores: (bigint | null)[] }[]; colunas: string[] };

type Sinal = { d: bigint; c: bigint };
const data = (iso: string) => iso.split("-").reverse().join("");
/** Formato do arquivo da ECF: vírgula decimal, sem separador de milhar. */
export const num = (v: bigint) => {
  const s = v < 0n ? "-" : "";
  const a = v < 0n ? -v : v;
  return `${s}${a / 100n}.${String(a % 100n).padStart(2, "0")}`.replace(".", ",");
};
const abs = (v: bigint) => (v < 0n ? -v : v);
/** Saldo positivo = devedor. */
const dc = (v: bigint, zero: "D" | "C" = "D") => (v === 0n ? zero : v > 0n ? "D" : "C");
export const legivel = (v: bigint) => {
  const [i, d] = num(v).split(",") as [string, string];
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${d}`;
};
const rs = (v: bigint) => `R$ ${legivel(v)}`;
const b = (n: number) => BigInt(n);

type Base = ExemploReal | ExemploPresumido | ExemploIsenta;

function bloco0(e: Base, tributacao: string[], abertura: boolean): Linha[] {
  const c = e.cadastro;
  const l = (reg: string, campos: string[], explicacao: string): Linha => ({ reg, campos, explicacao });
  return [
    l("0000", ["LECF", "0012", c.cnpj, c.nome, abertura ? "1" : "0", "0", "", "", data(e.inicio), data(e.fim), "N", "", "0", "", ""],
      abertura ? "Abre o arquivo. O indicador 1 diz que a empresa começou a operar neste ano, então não há ECF anterior." : "Abre o arquivo, com a empresa, o leiaute e o período."),
    l("0001", ["0"], "Abre o bloco 0, com dados."),
    l("0010", tributacao, "Diz como a empresa é tributada. É daqui que o programa decide quais blocos existem."),
    l("0020", ["1", "0", ...Array.from({ length: 28 }, () => "N"), ""].slice(0, 31), "Responde “não” a todas as situações especiais e informa a alíquota da CSLL das demais pessoas jurídicas."),
    l("0030", [c.natJur, c.cnae, c.endereco, c.numero, "", c.bairro, c.uf, c.municipio, c.cep, c.telefone, c.email], "Dados cadastrais."),
    ...e.assinantes.map((a) => l("0930", [a.nome, a.cpf, a.qualif, a.crc, a.email, a.fone], a.qualif === "900" ? "Quem assina como responsável pela contabilidade." : "Quem assina pela entidade.")),
  ];
}

/** Encerra os blocos presentes com o total de linhas de cada um. */
function encerrar(linhas: Linha[]): Linha[] {
  const letras = [...new Set(linhas.map((x) => x.reg[0]!))];
  return letras.flatMap((letra) => {
    const doBloco = linhas.filter((x) => x.reg[0] === letra);
    return [...doBloco, { reg: `${letra}990`, campos: [String(doBloco.length + 1)], explicacao: `Fecha o bloco ${letra} e conta as linhas dele.` }];
  });
}

export function montarReal(e: ExemploReal, tab: Tabelas, par: Parametros) {
  const contas = new Map(e.contas.map((c) => [c.codigo, c]));
  const analiticas = e.contas.filter((c) => c.ref !== null);
  const ePatrimonial = (cod: string) => contas.get(cod)!.natureza !== "04";
  const saldo = new Map<string, bigint>(analiticas.map((c) => [c.codigo, 0n]));
  let prejuizo = 0n;
  let baseNegativa = 0n;
  const saldoB = new Map<string, bigint>(e.parteB.map((x) => [`${x.codigo}|${x.tributo}`, 0n]));

  const periodos = e.periodos.map((per) => {
    const mov = new Map<string, Sinal>(analiticas.map((c) => [c.codigo, { d: 0n, c: 0n }]));
    const lancar = (d: string, c: string, v: bigint) => {
      mov.get(d)!.d += v;
      mov.get(c)!.c += v;
    };
    for (const x of per.lancamentos) lancar(x.d, x.c, b(x.valor));
    const resultado = () => analiticas.filter((c) => !ePatrimonial(c.codigo)).reduce((a, c) => a + mov.get(c.codigo)!.c - mov.get(c.codigo)!.d, 0n);
    const lucroAntes = resultado();
    const som = (tipo: "A" | "E") =>
      per.ajustes.filter((a) => tab.lalur.M300.find((l) => l.codigo === a.linha)!.lancamento === tipo).reduce((s, a) => s + b(a.valor), 0n);
    const calc = lucroReal(
      {
        lucro: lucroAntes, adicoesIrpj: som("A"), exclusoesIrpj: som("E"), adicoesCsll: som("A"), exclusoesCsll: som("E"),
        saldoPrejuizo: prejuizo, saldoBaseNegativa: baseNegativa, irRetido: 0n, csllRetida: 0n, meses: per.meses,
      },
      par,
    );
    if (calc.csll.devida > 0n) lancar(e.papeis.despesaCsll, e.papeis.csllARecolher, calc.csll.devida);
    if (calc.irpj.devido > 0n) lancar(e.papeis.despesaIrpj, e.papeis.irpjARecolher, calc.irpj.devido);
    const lucroLiquido = resultado();
    const resultadoConta = new Map(analiticas.filter((c) => !ePatrimonial(c.codigo)).map((c) => [c.codigo, mov.get(c.codigo)!.d - mov.get(c.codigo)!.c]));
    // Encerramento: o resultado vai para o patrimônio líquido.
    if (lucroLiquido >= 0n) mov.get(e.papeis.lucros)!.c += lucroLiquido;
    else mov.get(e.papeis.prejuizos)!.d += -lucroLiquido;
    const patrimonial = analiticas
      .filter((c) => ePatrimonial(c.codigo))
      .map((c) => {
        const ini = saldo.get(c.codigo)!;
        const m = mov.get(c.codigo)!;
        const fim = ini + m.d - m.c;
        saldo.set(c.codigo, fim);
        return { conta: c, ini, ...m, fim };
      })
      .filter((x) => x.ini !== 0n || x.d !== 0n || x.c !== 0n);
    const antes = { prejuizo, baseNegativa };
    prejuizo = calc.irpjAjuste.saldoFinal;
    baseNegativa = calc.csllAjuste.saldoFinal;
    return { per, calc, lucroAntes, lucroLiquido, resultadoConta, patrimonial, antes };
  });

  const L: Linha[] = [];
  const add = (reg: string, campos: string[], explicacao: string) => L.push({ reg, campos, explicacao });
  const tributados = ["T01", "T02", "T03", "T04"].map((t) => (e.periodos.some((x) => x.id === t) ? "R" : "0")).join("");
  L.push(...bloco0(e, ["", "N", "1", "T", "01", tributados, "", "", "", "", "", ""], true));

  // Bloco J
  add("J001", ["0"], "Abre o bloco J, com dados.");
  for (const c of e.contas) {
    const partes = c.codigo.split(".");
    const sup = partes.length > 1 ? partes.slice(0, -1).join(".") : "";
    add("J050", [data(e.inicio), c.natureza, c.ref ? "A" : "S", String(partes.length), c.codigo, sup, c.nome], c.ref ? `Conta ${c.nome}, que recebe lançamentos.` : `Grupo ${c.nome}, que só soma as contas abaixo dele.`);
    if (c.ref) {
      const ref = [...tab.planos.L100, ...tab.planos.L300].find((x) => x.codigo === c.ref)!;
      add("J051", ["", c.ref], `Traduz ${c.nome} para o plano da Receita: ${ref.descricao}.`);
    }
  }

  // Bloco K
  add("K001", ["0"], "Abre o bloco K, com dados.");
  for (const p of periodos) {
    add("K030", [data(p.per.inicio), data(p.per.fim), p.per.id], `Período ${p.per.id}.`);
    for (const x of p.patrimonial) {
      const v = [num(abs(x.ini)), dc(x.ini), num(x.d), num(x.c), num(abs(x.fim)), dc(x.fim)];
      add("K155", [x.conta.codigo, "", ...v], `${x.conta.nome}: começou com ${rs(abs(x.ini))}, teve ${rs(x.d)} a débito e ${rs(x.c)} a crédito e terminou com ${rs(abs(x.fim))}.`);
      add("K156", [x.conta.ref!, ...v], `Os mesmos valores, na conta referencial ${x.conta.ref}.`);
    }
    for (const [cod, v] of p.resultadoConta) {
      if (v === 0n) continue;
      const c = contas.get(cod)!;
      add("K355", [cod, "", num(abs(v)), dc(v)], `${c.nome}: ${v > 0n ? "despesa ou custo" : "receita"} de ${rs(abs(v))} no período.`);
      add("K356", [c.ref!, num(abs(v)), dc(v)], `O mesmo valor, na conta referencial ${c.ref}.`);
    }
  }

  // Bloco L
  const somaRef = (plano: Tabelas["planos"]["L100"], valor: (ref: string) => bigint) => {
    const m = new Map<string, bigint>();
    for (const r of plano) if (r.tipo === "A") for (let x: string | null = r.codigo; x; x = plano.find((y) => y.codigo === x)!.superior) m.set(x, (m.get(x) ?? 0n) + valor(r.codigo));
    return m;
  };
  add("L001", ["0"], "Abre o bloco L, com dados.");
  for (const p of periodos) {
    add("L030", [data(p.per.inicio), data(p.per.fim), p.per.id], `Período ${p.per.id}.`);
    const de = (f: (x: (typeof p.patrimonial)[number]) => bigint) => somaRef(tab.planos.L100, (ref) => p.patrimonial.filter((x) => x.conta.ref === ref).reduce((a, x) => a + f(x), 0n));
    const [ini, deb, cre, fim] = [de((x) => x.ini), de((x) => x.d), de((x) => x.c), de((x) => x.fim)];
    for (const r of tab.planos.L100) {
      if (ini.get(r.codigo) === 0n && deb.get(r.codigo) === 0n && cre.get(r.codigo) === 0n) continue;
      const zero = r.natureza === "01" ? "D" : "C";
      const f = fim.get(r.codigo)!;
      add("L100", [r.codigo, r.descricao, r.tipo, String(r.nivel), r.natureza, r.superior ?? "", num(abs(ini.get(r.codigo)!)), dc(ini.get(r.codigo)!, zero), num(deb.get(r.codigo)!), num(cre.get(r.codigo)!), num(abs(f)), dc(f, zero)],
        `${r.tipo === "S" ? "Total do grupo" : "Conta"} ${r.descricao}: ${rs(abs(f))} no fim do período.`);
    }
    const res = somaRef(tab.planos.L300, (ref) => analiticas.filter((c) => c.ref === ref).reduce((a, c) => a + (p.resultadoConta.get(c.codigo) ?? 0n), 0n));
    for (const r of tab.planos.L300) {
      const v = res.get(r.codigo) ?? 0n;
      if (v === 0n) continue;
      add("L300", [r.codigo, r.descricao, r.tipo, String(r.nivel), r.natureza, r.superior ?? "", num(abs(v)), dc(v)],
        `${r.tipo === "S" ? "Total do grupo" : "Conta"} ${r.descricao}: ${rs(abs(v))} ${v > 0n ? "que reduzem" : "que aumentam"} o resultado.`);
    }
  }

  // Bloco M
  const mover = (cod: string, tributo: "I" | "C", v: bigint) => saldoB.set(`${cod}|${tributo}`, saldoB.get(`${cod}|${tributo}`)! + v);
  const desc = (reg: "M300" | "M350", cod: string) => tab.lalur[reg].find((l) => l.codigo === cod)!;
  add("M001", ["0"], "Abre o bloco M, com dados.");
  for (const x of e.parteB) {
    add("M010", [x.codigo, x.nome, data(e.periodos[0]!.fim), x.padrao, "", x.tributo, "0,00", "D", ""],
      `Cria na parte B a conta ${x.nome}, para ${x.tributo === "I" ? "o IRPJ" : "a CSLL"}. Nasce zerada porque foi criada neste ano.`);
  }
  for (const p of periodos) {
    add("M030", [data(p.per.inicio), data(p.per.fim), p.per.id], `Período ${p.per.id}.`);
    for (const [reg, tributo] of [["M300", "I"], ["M350", "C"]] as const) {
      const irpj = reg === "M300";
      const aj = irpj ? p.calc.irpjAjuste : p.calc.csllAjuste;
      const csll = p.calc.csll.devida;
      const adicoes = p.per.ajustes.filter((a) => desc(reg, a.linha).lancamento === "A");
      const exclusoes = p.per.ajustes.filter((a) => desc(reg, a.linha).lancamento === "E");
      const tot = (xs: typeof adicoes) => xs.reduce((s, a) => s + b(a.valor), 0n);
      const linha = (cod: string, valor: bigint, rel: string, hist: string, explicacao: string) => {
        const d = desc(reg, cod);
        add(reg, [cod, d.descricao, d.lancamento, rel, num(valor), hist], explicacao);
      };
      const [r305, r310] = irpj ? ["M305", "M310"] : ["M355", "M360"];
      const detalhar = (a: (typeof adicoes)[number], tipo: "A" | "E") => {
        const v = b(a.valor);
        if (a.parteB) {
          add(r305, [a.parteB, num(v), tipo === "A" ? "D" : "C"], tipo === "A" ? "Guarda o valor na parte B, para excluir quando a provisão for usada ou revertida." : "Baixa da parte B o que está sendo excluído agora.");
          mover(a.parteB, tributo, tipo === "A" ? v : -v);
        }
        const valorConta = p.resultadoConta.get(a.conta)!;
        add(r310, [a.conta, "", num(v), dc(valorConta)], `Liga o ajuste à conta ${contas.get(a.conta)!.nome}.`);
      };
      linha("2", irpj ? p.lucroAntes - csll : p.lucroAntes, "", "", irpj ? (csll > 0n ? "Ponto de partida do lucro real: o resultado já com a CSLL descontada, que volta na linha 9." : "Ponto de partida do lucro real. Como não há CSLL neste período, é o próprio resultado.") : "Ponto de partida da CSLL: o resultado antes dos tributos.");
      for (const a of adicoes) {
        linha(a.linha, b(a.valor), a.parteB ? "3" : "2", a.historico, a.parteB ? "Soma a provisão, que ainda não é dedutível." : "Soma a multa fiscal, que não é dedutível.");
        detalhar(a, "A");
      }
      if (irpj && csll > 0n) {
        // Na ordem oficial, a linha 9 vem depois das linhas 6 e 8.60.
        linha("9", csll, "4", "CSLL INDEDUTÍVEL", "Soma de volta a CSLL, que não reduz o lucro real.");
      }
      linha("93", tot(adicoes) + (irpj ? csll : 0n), "", "", "Total das adições.");
      for (const a of exclusoes) {
        linha(a.linha, b(a.valor), "3", a.historico, "Tira a reversão da provisão, que já tinha sido tributada quando entrou.");
        detalhar(a, "E");
      }
      linha("168", tot(exclusoes), "", "", "Total das exclusões.");
      linha("169", aj.ajustado, "", "", aj.ajustado < 0n ? "Resultado ajustado negativo: é o prejuízo a controlar na parte B." : "Resultado ajustado, antes de usar prejuízos anteriores.");
      linha("171", aj.ajustado, "", "", "Igual à anterior, porque não há atividade rural.");
      if (aj.compensado > 0n) {
        linha("173", aj.compensado, "1", irpj ? "COMPENSAÇÃO DE PREJUÍZO FISCAL" : "COMPENSAÇÃO DE BASE NEGATIVA", `Usa o saldo anterior até o limite de ${rs(aj.limite)}. O saldo era de ${rs(irpj ? p.antes.prejuizo : p.antes.baseNegativa)}.`);
        add(r305, [irpj ? "PF" : "BCN", num(aj.compensado), "C"], "Baixa da parte B o que foi compensado.");
        mover(irpj ? "PF" : "BCN", tributo, -aj.compensado);
      }
      linha("175", aj.base, "", "", aj.base < 0n ? "Negativo: não há imposto neste período." : irpj ? "Lucro real, base do IRPJ." : "Base da CSLL.");
    }
    const semA = new Map<string, bigint>();
    for (const [cod, tributo, aj, ind, nome] of [["PF", "I", p.calc.irpjAjuste, "PF", "PREJUÍZO FISCAL DO PERÍODO"], ["BCN", "C", p.calc.csllAjuste, "BC", "BASE NEGATIVA DO PERÍODO"]] as const) {
      if (aj.ajustado >= 0n) continue;
      add("M410", [cod, tributo, num(-aj.ajustado), ind, "", nome, "N"], "Guarda na parte B o resultado negativo do período, para compensar depois.");
      mover(cod, tributo, -aj.ajustado);
      semA.set(`${cod}|${tributo}`, -aj.ajustado);
    }
    for (const x of e.parteB) {
      const k = `${x.codigo}|${x.tributo}`;
      const fim = saldoB.get(k)!;
      const sem = semA.get(k) ?? 0n;
      const comA = x.codigo === "PF" ? -p.calc.irpjAjuste.compensado : x.codigo === "BCN" ? -p.calc.csllAjuste.compensado
        : p.per.ajustes.filter((a) => a.parteB === x.codigo).reduce((s, a) => s + (desc("M300", a.linha).lancamento === "A" ? b(a.valor) : -b(a.valor)), 0n);
      const ini = fim - sem - comA;
      add("M500", [x.codigo, x.tributo, num(abs(ini)), dc(ini), num(abs(comA)), dc(comA), num(abs(sem)), dc(sem), num(abs(fim)), dc(fim)],
        `${x.nome}: saldo de ${rs(fim)} para ${x.tributo === "I" ? "o IRPJ" : "a CSLL"} no fim do período.`);
    }
  }

  // Bloco N
  add("N001", ["0"], "Abre o bloco N, com dados.");
  for (const p of periodos) {
    add("N030", [data(p.per.inicio), data(p.per.fim), p.per.id], `Período ${p.per.id}.`);
    const ln = (reg: keyof Tabelas["linhas"], cod: string, v: bigint, explicacao: string) => add(reg, [cod, tab.linhas[reg]!.find((x) => x.codigo === cod)!.descricao, num(v)], explicacao);
    const { irpj, csll, irpjAjuste, csllAjuste } = p.calc;
    ln("N500", "1", irpjAjuste.base, "Traz o lucro real do bloco M.");
    ln("N630", "1", irpjAjuste.base, "Base do IRPJ.");
    ln("N630", "3", irpj.normal, irpjAjuste.base > 0n ? "Alíquota normal sobre a base." : "Base negativa: não há imposto.");
    ln("N630", "4", irpj.adicional, irpj.adicional > 0n ? `Adicional sobre o que passa de ${rs(irpj.limite)} no trimestre.` : "A base não passa do limite do trimestre.");
    ln("N630", "26", irpj.pagar, "IRPJ a pagar no período.");
    ln("N650", "1", csllAjuste.base, "Traz a base da CSLL do bloco M.");
    ln("N670", "1", csllAjuste.base, "Base da CSLL.");
    ln("N670", "2", csll.devida, csllAjuste.base > 0n ? "Alíquota sobre a base." : "Base negativa: não há contribuição.");
    ln("N670", "4", csll.devida, "Total da CSLL.");
    ln("N670", "21", csll.pagar, "CSLL a pagar no período.");
  }

  add("Y001", ["0"], "Abre o bloco Y, com dados.");
  for (const s of e.socios) L.push(y600(s));

  const cols = periodos.map((p) => p.per.id);
  const de = (f: (p: (typeof periodos)[number]) => bigint) => periodos.map(f);
  const resumo: Resumo[] = [
    { titulo: "Resultado do período", colunas: cols, linhas: [
      ...analiticas.filter((c) => c.natureza === "04").map((c) => ({ rotulo: c.nome, valores: de((p) => -(p.resultadoConta.get(c.codigo) ?? 0n)) })),
      { rotulo: "LUCRO OU PREJUÍZO LÍQUIDO", valores: de((p) => p.lucroLiquido) },
    ] },
    { titulo: "Balanço no fim do período", colunas: cols, linhas: [
      ...analiticas.filter((c) => c.natureza !== "04").map((c) => ({ rotulo: c.nome, valores: de((p) => { const x = p.patrimonial.find((y) => y.conta.codigo === c.codigo); const f = x?.fim ?? 0n; return c.natureza === "01" ? f : -f; }) })),
      { rotulo: "TOTAL DO ATIVO", valores: de((p) => p.patrimonial.filter((x) => x.conta.natureza === "01").reduce((a, x) => a + x.fim, 0n)) },
      { rotulo: "TOTAL DO PASSIVO E DO PATRIMÔNIO LÍQUIDO", valores: de((p) => -p.patrimonial.filter((x) => x.conta.natureza !== "01").reduce((a, x) => a + x.fim, 0n)) },
    ] },
  ];
  return { arquivo: { linhas: encerrar(L), resumo } satisfies Arquivo, periodos };
}

function y600(s: ExemploReal["socios"][number]): Linha {
  return { reg: "Y600", campos: [data(s.desde), "", "105", "PF", s.cpf, s.nome, s.qualif, s.percentual, s.percentual, "", "", "", "", "", "", ""], explicacao: `Participação de ${s.nome}.` };
}

export function montarPresumido(e: ExemploPresumido, tab: Tabelas, par: Parametros) {
  const L: Linha[] = [];
  const add = (reg: string, campos: string[], explicacao: string) => L.push({ reg, campos, explicacao });
  L.push(...bloco0(e, ["", "N", "5", "T", "01", "PPPP", "", "L", "", "", "", "1"], false));
  const periodos = e.periodos.map((per) => ({
    per,
    calc: lucroPresumido({ receitas: { geral: b(per.receitas.geral), combustiveis: 0n, transporte: 0n, servicos: b(per.receitas.servicos) }, financeiras: b(per.financeiras), demais: 0n, irRetido: b(per.irrf), csllRetida: 0n, meses: per.meses }, par),
  }));
  add("P001", ["0"], "Abre o bloco P, com dados.");
  for (const p of periodos) {
    const { per, calc } = p;
    const ln = (reg: keyof Tabelas["linhas"], cod: string, v: bigint, explicacao: string) => {
      if (v !== 0n) add(reg, [cod, tab.linhas[reg]!.find((x) => x.codigo === cod)!.descricao, num(v)], explicacao);
    };
    add("P030", [data(per.inicio), data(per.fim), per.id], `Período ${per.id}.`);
    ln("P200", "4", b(per.receitas.geral), "Receita da venda de produtos.");
    ln("P200", "8", b(per.receitas.servicos), "Receita do serviço de buffet.");
    ln("P200", "10", calc.presumidoIrpj, "Soma das receitas, cada uma com o seu percentual.");
    ln("P200", "11", b(per.financeiras), "Rendimento de aplicação entra por inteiro na base.");
    ln("P200", "26", calc.baseIrpj, "Base do IRPJ no trimestre.");
    ln("P300", "1", calc.baseIrpj, "Traz a base do P200.");
    ln("P300", "3", calc.irpj.normal, "Alíquota normal sobre a base.");
    ln("P300", "4", calc.irpj.adicional, `Adicional sobre o que passa de ${rs(calc.irpj.limite)} no trimestre.`);
    ln("P300", "10", b(per.irrf), "Imposto já retido pelo banco.");
    ln("P300", "15", calc.irpj.pagar, "IRPJ a pagar no trimestre.");
    ln("P400", "2", b(per.receitas.geral), "Receita da venda de produtos.");
    ln("P400", "4", b(per.receitas.servicos), "Receita do serviço de buffet.");
    ln("P400", "6", calc.presumidoCsll, "Soma das receitas, cada uma com o seu percentual.");
    ln("P400", "7", b(per.financeiras), "Rendimento de aplicação entra por inteiro na base.");
    ln("P400", "21", calc.baseCsll, "Base da CSLL no trimestre.");
    ln("P500", "1", calc.baseCsll, "Traz a base do P400.");
    ln("P500", "2", calc.csll.devida, "Alíquota da CSLL sobre a base.");
    ln("P500", "4", calc.csll.devida, "Total da CSLL.");
    ln("P500", "13", calc.csll.pagar, "CSLL a pagar no trimestre.");
  }
  add("Q001", ["0"], "Abre o bloco Q, com dados.");
  let saldo = b(e.caixaInicial);
  add("Q100", [data(e.inicio), "", "SALDO INICIAL DO ANO", num(saldo), "", num(saldo)], "Dinheiro que já havia no começo do ano.");
  for (const x of e.caixa) {
    saldo += b(x.entrada) - b(x.saida);
    add("Q100", [data(x.data), "", x.historico, x.entrada ? num(b(x.entrada)) : "", x.saida ? num(b(x.saida)) : "", num(saldo)], x.entrada ? `Entrada de ${rs(b(x.entrada))}. O saldo vai a ${rs(saldo)}.` : `Saída de ${rs(b(x.saida))}. O saldo cai para ${rs(saldo)}.`);
  }
  const irrf = e.periodos.reduce((a, x) => a + b(x.irrf), 0n);
  const fin = e.periodos.reduce((a, x) => a + b(x.financeiras), 0n);
  const o = e.outras;
  add("Y001", ["0"], "Abre o bloco Y, com dados.");
  add("Y570", [e.retencao.cnpj, e.retencao.nome, "N", e.retencao.codigo, num(fin), num(irrf), ""], "Comprova a retenção usada no cálculo do IRPJ.");
  for (const s of e.socios) L.push(y600(s));
  const zero = "0,00";
  add("Y672", [num(b(o.capitalAnterior)), num(b(o.capital)), num(b(o.estoqueAnterior)), num(b(o.estoque)), num(b(e.caixaInicial)), num(saldo), zero, zero, zero, zero, num(b(o.pagarAnterior)), num(b(o.pagar)), num(b(o.compras)), zero, zero, num(saldo + b(o.estoque)), o.avaliacaoEstoque], "Retrato do fim do ano de quem não recuperou a ECD: capital, estoque, caixa e contas a pagar.");
  const cols = periodos.map((p) => p.per.id);
  const de = (f: (p: (typeof periodos)[number]) => bigint) => periodos.map(f);
  const resumo: Resumo[] = [
    { titulo: "Receitas e tributos por trimestre", colunas: cols, linhas: [
      { rotulo: "Venda de produtos", valores: de((p) => b(p.per.receitas.geral)) },
      { rotulo: "Serviço de buffet", valores: de((p) => b(p.per.receitas.servicos)) },
      { rotulo: "Rendimento de aplicação", valores: de((p) => b(p.per.financeiras)) },
      { rotulo: "Base do IRPJ", valores: de((p) => p.calc.baseIrpj) },
      { rotulo: "IRPJ a pagar", valores: de((p) => p.calc.irpj.pagar) },
      { rotulo: "Base da CSLL", valores: de((p) => p.calc.baseCsll) },
      { rotulo: "CSLL a pagar", valores: de((p) => p.calc.csll.pagar) },
    ] },
  ];
  return { arquivo: { linhas: encerrar(L), resumo } satisfies Arquivo, periodos, saldoCaixa: saldo };
}

export function montarIsenta(e: ExemploIsenta, tab: Tabelas) {
  const L: Linha[] = [];
  const add = (reg: string, campos: string[], explicacao: string) => L.push({ reg, campos, explicacao });
  L.push(...bloco0(e, ["", "N", "9", "", "", "", "", "L", e.tipoEntidade, "D", "D", ""], false));
  const v = (c: string) => b(e.x390[c] ?? 0);
  const som = (de: number, ate: number) => Array.from({ length: ate - de + 1 }, (_, i) => v(String(de + i))).reduce((a, x) => a + x, 0n);
  const origem = som(2, 7);
  const aplicacao = som(10, 15);
  const calculado: Record<string, bigint> = { "8": origem, "16": aplicacao, "17": origem - aplicacao };
  add("X001", ["0"], "Abre o bloco X, com dados.");
  for (const l of tab.linhas.X390!) {
    const rotulo = l.tipo === "R";
    const valor = calculado[l.codigo] ?? v(l.codigo);
    add("X390", [l.codigo, l.descricao, rotulo ? "" : num(valor)], rotulo ? "Título: não leva valor." : calculado[l.codigo] !== undefined ? (l.codigo === "17" ? "Origem menos aplicação: o que sobrou no ano." : "Soma das linhas do grupo.") : valor === 0n ? "Não houve neste ano." : `${l.descricao}: ${rs(valor)}.`);
  }
  add("Y001", ["0"], "Abre o bloco Y, com dados.");
  for (const d of e.dirigentes) add("Y612", [d.cpf, d.nome, d.qualif, num(b(d.remuneracao)), num(b(d.demais)), num(b(d.ir))], `Quanto ${d.nome} recebeu no ano.`);
  const resumo: Resumo[] = [
    { titulo: "Origem e aplicação de recursos", colunas: ["2025"], linhas: tab.linhas.X390!.filter((l) => l.tipo !== "R").map((l) => ({ rotulo: l.descricao, valores: [calculado[l.codigo] ?? v(l.codigo)] })) },
  ];
  return { arquivo: { linhas: encerrar(L), resumo } satisfies Arquivo, origem, aplicacao };
}
