"use client";

import { Eraser, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { registrarFeito } from "@/components/layout/trilha";
import { Botao, Cartao } from "@/components/ui";
import { lerDinheiro } from "@/lib/calculo/dinheiro";
import { ATIVIDADES, lucroPresumido, lucroReal, type Bloco, type Parametros } from "@/lib/calculo/tributos";
import { moeda, percentual } from "@/lib/formatos";
import { cn } from "@/lib/cn";

export type RegraCitada = { titulo: string; texto: string; norma: string; url: string; verificar: boolean };
type Campo = { id: string; rotulo: string; ajuda?: string; negativo?: boolean };

const REAL: Campo[] = [
  { id: "lucro", rotulo: "Lucro antes do IRPJ e da CSLL", ajuda: "Use o sinal de menos se for prejuízo.", negativo: true },
  { id: "adicoes", rotulo: "Adições" },
  { id: "exclusoes", rotulo: "Exclusões" },
  { id: "prejuizo", rotulo: "Saldo de prejuízo fiscal de períodos anteriores" },
  { id: "baseNegativa", rotulo: "Saldo de base negativa da CSLL de períodos anteriores" },
  { id: "irRetido", rotulo: "Imposto de renda retido na fonte" },
  { id: "csllRetida", rotulo: "CSLL retida na fonte" },
];
const CSLL: Campo[] = [
  { id: "adicoesCsll", rotulo: "Adições da CSLL" },
  { id: "exclusoesCsll", rotulo: "Exclusões da CSLL" },
];
const PRESUMIDO: Campo[] = [
  { id: "geral", rotulo: "Receita de comércio, indústria ou transporte de carga" },
  { id: "servicos", rotulo: "Receita de serviços em geral" },
  { id: "transporte", rotulo: "Receita de transporte, exceto de carga" },
  { id: "combustiveis", rotulo: "Receita de revenda de combustíveis" },
  { id: "financeiras", rotulo: "Rendimentos de aplicações financeiras" },
  { id: "demais", rotulo: "Demais receitas e ganhos de capital" },
  { id: "irRetidoP", rotulo: "Imposto de renda retido na fonte" },
  { id: "csllRetidaP", rotulo: "CSLL retida na fonte" },
];

/** Modo do lucro presumido com a LC 224: base do ano anterior mais a camada da lei (valores de content/regras/lc224.json). */
export type ModoLc224 = { ac: number; base: Parametros; limiteTrimestre: number; acrescimoPb: number; trimestreInicioCsll: number; href: string };

type Props = {
  lc224: ModoLc224;
  parametros: Parametros;
  regras: Record<string, RegraCitada>;
  /** Valores iniciais, vindos das empresas fictícias de content/exemplos. */
  inicial: Record<string, string>;
  ano: number;
};

export function Simulador({ parametros, regras, inicial, ano, lc224 }: Props) {
  const [regime, setRegime] = useState<"real" | "presumido">("real");
  const [regrasAno, setRegrasAno] = useState<"ano" | "lc224">("ano");
  const [trimestre, setTrimestre] = useState(1);
  const [meses, setMeses] = useState(3);
  const [mesmos, setMesmos] = useState(true);
  const [textos, setTextos] = useState<Record<string, string>>(inicial);
  const id = useId();
  const real = regime === "real";
  const modoLc224 = !real && regrasAno === "lc224";
  const campos = real ? [...REAL.slice(0, 3), ...(mesmos ? [] : CSLL), ...REAL.slice(3)] : PRESUMIDO;
  const erros: Record<string, string> = {};
  const ler = (k: string): bigint => {
    const v = lerDinheiro(textos[k] ?? "");
    const campo = [...REAL, ...CSLL, ...PRESUMIDO].find((c) => c.id === k)!;
    if (v === null) {
      erros[k] = "Digite um valor como 1.234,56.";
      return 0n;
    }
    if (v < 0n && !campo.negativo) {
      erros[k] = "Este campo não aceita valor negativo.";
      return 0n;
    }
    return v;
  };

  let blocos: Bloco[] = [];
  let totais: { irpj: bigint; csll: bigint; total: bigint } | null = null;
  if (real) {
    const ad = ler("adicoes");
    const ex = ler("exclusoes");
    const entrada = {
      lucro: ler("lucro"), adicoesIrpj: ad, exclusoesIrpj: ex,
      adicoesCsll: mesmos ? ad : ler("adicoesCsll"), exclusoesCsll: mesmos ? ex : ler("exclusoesCsll"),
      saldoPrejuizo: ler("prejuizo"), saldoBaseNegativa: ler("baseNegativa"), irRetido: ler("irRetido"), csllRetida: ler("csllRetida"), meses,
    };
    if (Object.keys(erros).length === 0) {
      const r = lucroReal(entrada, parametros);
      blocos = r.blocos;
      totais = { irpj: r.irpj.pagar, csll: r.csll.pagar, total: r.total };
    }
  } else {
    const entrada = {
      receitas: Object.fromEntries(ATIVIDADES.map((a) => [a, ler(a)])) as Record<(typeof ATIVIDADES)[number], bigint>,
      financeiras: ler("financeiras"), demais: ler("demais"), irRetido: ler("irRetidoP"), csllRetida: ler("csllRetidaP"), meses,
    };
    if (Object.keys(erros).length === 0) {
      const r = modoLc224
        ? lucroPresumido(entrada, lc224.base, { trimestre, limiteTrimestre: BigInt(lc224.limiteTrimestre), acrescimoPb: lc224.acrescimoPb, trimestreInicioCsll: lc224.trimestreInicioCsll })
        : lucroPresumido(entrada, parametros);
      blocos = r.blocos;
      totais = { irpj: r.irpj.pagar, csll: r.csll.pagar, total: r.total };
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[24rem_1fr]">
      <Cartao>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <fieldset>
            <legend className="font-semibold">Regime</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["real", "Lucro real"], ["presumido", "Lucro presumido"]] as const).map(([v, r]) => (
                <label
                  key={v}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-controle px-4 has-checked:border-marca has-checked:bg-fundo has-checked:font-semibold has-focus-visible:outline-3 has-focus-visible:outline-marca"
                >
                  <input type="radio" name={`${id}-regime`} checked={regime === v} onChange={() => setRegime(v)} className="size-5 accent-marca outline-none" />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
          {!real && (
            <fieldset className="mt-5">
              <legend className="font-semibold">Regras</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {([["ano", `AC ${ano}`], ["lc224", `AC ${lc224.ac}, com a LC 224`]] as const).map(([v, r]) => (
                  <label
                    key={v}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-controle px-4 has-checked:border-marca has-checked:bg-fundo has-checked:font-semibold has-focus-visible:outline-3 has-focus-visible:outline-marca"
                  >
                    <input type="radio" name={`${id}-regras`} checked={regrasAno === v} onChange={() => setRegrasAno(v)} className="size-5 accent-marca outline-none" />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {modoLc224 && (
            <div data-testid="sim-lc224">
              <label htmlFor={`${id}-tri`} className="mt-4 block font-medium">
                Trimestre de {lc224.ac}
              </label>
              <select
                id={`${id}-tri`}
                value={trimestre}
                onChange={(e) => setTrimestre(Number(e.target.value))}
                className="mt-1 min-h-11 rounded-lg border border-controle bg-superficie px-3"
              >
                {[1, 2, 3, 4].map((t) => (
                  <option key={t} value={t}>
                    {t}º trimestre
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-suave">
                O acréscimo vale só para a receita acima do limite do trimestre{trimestre < lc224.trimestreInicioCsll ? "; neste trimestre, ainda não na CSLL" : ""}. A
                simulação não usa a sobra de limite de trimestres anteriores nem o ajuste do último trimestre. Os demais percentuais são os do AC {lc224.ac - 1}, ainda não
                conferidos um a um para {lc224.ac}.{" "}
                <Link href={lc224.href} prefetch={false} className="inline-flex min-h-6 items-center underline underline-offset-4">
                  Como funciona
                </Link>
              </p>
            </div>
          )}
          <label htmlFor={`${id}-meses`} className="mt-5 block font-medium">
            Meses de atividade no trimestre
          </label>
          <select
            id={`${id}-meses`}
            value={meses}
            onChange={(e) => setMeses(Number(e.target.value))}
            className="mt-1 min-h-11 rounded-lg border border-controle bg-superficie px-3"
          >
            {[1, 2, 3].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {real && (
            <label className="mt-4 flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={mesmos} onChange={(e) => setMesmos(e.target.checked)} className="size-5 accent-marca" />
              Usar os mesmos ajustes na CSLL
            </label>
          )}
          <div className="mt-4 space-y-4">
            {campos.map((c) => {
              const cid = `${id}-${c.id}`;
              const desc = [c.ajuda && `${cid}-a`, erros[c.id] && `${cid}-e`].filter(Boolean).join(" ") || undefined;
              return (
                <div key={c.id}>
                  <label htmlFor={cid} className="block font-medium">
                    {c.rotulo} (R$)
                  </label>
                  <input
                    id={cid}
                    inputMode="decimal"
                    autoComplete="off"
                    maxLength={22}
                    value={textos[c.id] ?? ""}
                    placeholder="0,00"
                    aria-invalid={erros[c.id] ? true : undefined}
                    aria-describedby={desc}
                    onChange={(e) => {
                      const valor = e.target.value;
                      registrarFeito("simulador");
                      setTextos((t) => ({ ...t, [c.id]: valor }));
                    }}
                    className={cn("mt-1 min-h-11 w-full rounded-lg border bg-superficie px-3 text-right font-mono placeholder:text-suave", erros[c.id] ? "border-alerta" : "border-controle")}
                  />
                  {c.ajuda && (
                    <p id={`${cid}-a`} className="mt-1 text-sm text-suave">
                      {c.ajuda}
                    </p>
                  )}
                  {erros[c.id] && (
                    <p id={`${cid}-e`} className="mt-1 text-sm font-semibold text-alerta">
                      {erros[c.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Botao variante="contorno" onClick={() => setTextos(inicial)}>
              <Lightbulb aria-hidden size={18} /> Usar o exemplo
            </Botao>
            <Botao variante="contorno" onClick={() => setTextos({})}>
              <Eraser aria-hidden size={18} /> Limpar
            </Botao>
          </div>
        </form>
      </Cartao>

      <div>
        <section aria-labelledby={`${id}-res`}>
          <h2 id={`${id}-res`} className="text-2xl font-bold">
            Resultado do trimestre
          </h2>
          <div role="status" data-testid="sim-resultado" className="mt-3">
            {totais ? (
              <dl className="grid gap-3 sm:grid-cols-3">
                {([["IRPJ", totais.irpj], ["CSLL", totais.csll], ["Total", totais.total]] as const).map(([r, v]) => (
                  <div key={r} className="rounded-2xl border border-linha bg-superficie p-5">
                    <dt className="text-suave">{r}</dt>
                    <dd className="mt-1 text-2xl font-bold break-words">{moeda(v)}</dd>
                    {v < 0n && <dd className="text-sm text-suave">Saldo negativo: retido a mais</dd>}
                  </div>
                ))}
              </dl>
            ) : (
              <p className="rounded-2xl border border-alerta bg-alerta-fundo p-5 font-semibold text-alerta">
                Corrija os campos marcados para ver o resultado.
              </p>
            )}
          </div>
        </section>
        {blocos.map((b) => (
          <section key={b.titulo} className="mt-8">
            <h2 className="text-xl font-bold">{b.titulo}</h2>
            <ol className="mt-3 space-y-2">
              {b.passos.map((s) => (
                <li
                  key={s.id}
                  data-passo={s.id}
                  className={cn("rounded-xl border bg-superficie p-4", s.destaque ? "border-marca" : "border-linha")}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className={s.destaque ? "font-bold" : "font-medium"}>{s.titulo}</span>
                    <span data-valor className={cn("font-mono", s.destaque && "font-semibold")}>
                      {moeda(s.valor)}
                    </span>
                  </div>
                  <p className="text-sm text-suave">
                    {s.conta.map((x, i) => (
                      <span key={i}>{typeof x === "string" ? x : "valor" in x ? moeda(x.valor) : percentual(x.percentual)}</span>
                    ))}
                    {s.linha && <span data-so="profissional"> · ECF: {s.linha}</span>}
                  </p>
                  <details className="mt-1 text-sm">
                    <summary className="inline-flex min-h-6 items-center font-semibold text-marca underline underline-offset-4">
                      Base legal
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {s.regras.map((r) => {
                        const g = regras[r]!;
                        return (
                          <li key={r}>
                            <strong>{g.titulo}:</strong> {g.texto}. {g.norma}.{" "}
                            <a href={g.url} rel="noopener noreferrer" className="inline-block py-0.5 underline underline-offset-4">
                              Fonte oficial<span className="sr-only">: {g.titulo}</span>
                            </a>
                            {g.verificar && <strong className="text-alerta"> A verificar.</strong>}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <p className="mt-6 text-sm text-suave">
          Simulação para estudo, com as regras do ano-calendário {modoLc224 ? lc224.ac : ano}. Não cobre estimativas mensais, incentivos,
          atividade rural nem instituições financeiras.
        </p>
      </div>
    </div>
  );
}
