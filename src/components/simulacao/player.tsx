"use client";

import { Check, ChevronLeft, ChevronRight, Minus, Pause, Play, RotateCcw, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Etiqueta, Nivel } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { RegraSimulada, Simulacao } from "@/lib/simulacao/montar";

type Passo =
  | { tipo: "ficha"; titulo: string; ms: number }
  | { tipo: "decisao"; titulo: string; ms: number }
  | { tipo: "campo"; titulo: string; ms: number; i: number }
  | { tipo: "linha"; titulo: string; ms: number }
  | { tipo: "regras"; titulo: string; ms: number }
  | { tipo: "naoSimuladas"; titulo: string; ms: number }
  | { tipo: "erro"; titulo: string; ms: number }
  | { tipo: "resumo"; titulo: string; ms: number };

const VELOCIDADES = [0.5, 1, 1.5] as const;
const TIQUE = 50;
const MS_POR_LETRA = 55;

function passos(s: Simulacao): Passo[] {
  const lista: Passo[] = [{ tipo: "ficha", titulo: "A empresa", ms: 6000 }];
  if (s.decisao) lista.push({ tipo: "decisao", titulo: "O registro existe?", ms: 4000 });
  s.campos.forEach((c, i) => lista.push({ tipo: "campo", titulo: `Campo ${c.nome}`, ms: c.valor ? 1600 + c.valor.length * MS_POR_LETRA : 1000, i }));
  lista.push({ tipo: "linha", titulo: "A linha montada", ms: 3500 });
  const simuladas = s.regras.filter((r) => r.simulada).length;
  lista.push({ tipo: "regras", titulo: "Validação", ms: Math.max(3000, simuladas * 700) });
  if (s.regras.some((r) => !r.simulada)) lista.push({ tipo: "naoSimuladas", titulo: "O que não dá para simular aqui", ms: 4000 });
  lista.push({ tipo: "erro", titulo: "E se houver um erro?", ms: 8000 });
  lista.push({ tipo: "resumo", titulo: "Resumo", ms: 0 });
  return lista;
}

const assinar = (aviso: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
};
const useMenosMovimento = () => useSyncExternalStore(assinar, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);

const ESTADO: Record<NonNullable<RegraSimulada["resultado"]>["estado"], { texto: string; tom: "ok" | "alerta" | "neutro"; Icone: typeof Check }> = {
  passou: { texto: "Passou", tom: "ok", Icone: Check },
  falhou: { texto: "Falhou", tom: "alerta", Icone: X },
  "nao-se-aplica": { texto: "Não se aplica", tom: "neutro", Icone: Minus },
};

function Dois({ n }: { n: { iniciante: string; profissional: string } }) {
  return (
    <>
      <Nivel so="iniciante">{n.iniciante}</Nivel>
      <Nivel so="profissional">{n.profissional}</Nivel>
    </>
  );
}

/** Linha da ECF com um campo em destaque. Quebra em qualquer ponto: nada de rolagem lateral no celular. */
function Linha({ valores, ate, destaque, erro }: { valores: string[]; ate?: number; destaque?: number; erro?: number }) {
  const mostrados = ate === undefined ? valores : valores.slice(0, ate + 1);
  return (
    <p className="rounded-lg bg-fundo p-3 font-mono text-sm break-all">
      |
      {mostrados.map((v, i) => (
        <span key={i}>
          <span
            className={cn(
              "rounded px-0.5",
              i === destaque && "bg-marca text-sobre-marca",
              i === erro && "bg-alerta-fundo text-alerta underline decoration-wavy",
            )}
          >
            {v}
          </span>
          |
        </span>
      ))}
    </p>
  );
}

function Regra({ r }: { r: RegraSimulada }) {
  const e = r.resultado ? ESTADO[r.resultado.estado] : null;
  return (
    <li className="rounded-lg border border-linha p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold break-all">{r.codigo}</span>
        {r.campo !== "*" && <span className="font-mono text-sm text-suave">({r.campo})</span>}
        {e && (
          <Etiqueta tom={e.tom}>
            <e.Icone aria-hidden size={14} /> {e.texto}
          </Etiqueta>
        )}
      </div>
      <p className="mt-1 text-sm">{r.resultado?.detalhe ?? r.motivo}</p>
      <details className="mt-1 text-sm text-suave">
        <summary className="min-h-6 cursor-pointer">Texto do Manual</summary>
        <p className="mt-1 whitespace-pre-line">{r.texto}</p>
      </details>
    </li>
  );
}

function Corpo({ s, p, decorrido, completo, resposta, responder }: { s: Simulacao; p: Passo; decorrido: number; completo: boolean; resposta: "sim" | "nao" | null; responder: (r: "sim" | "nao") => void }) {
  const valores = s.campos.map((c) => c.valor);
  switch (p.tipo) {
    case "ficha":
      return (
        <div>
          <p className="font-semibold">{s.empresa.nome}</p>
          {s.empresa.aviso && <p className="mt-2 rounded-lg bg-alerta-fundo px-3 py-2 text-sm text-alerta">{s.empresa.aviso}</p>}
          <ul className="mt-3 space-y-2">
            {s.fatos.map((f, i) => (
              <li key={i} className="rounded-lg border border-linha p-3">
                <Dois n={f.texto} />
              </li>
            ))}
          </ul>
        </div>
      );
    case "decisao": {
      const d = s.decisao!;
      return (
        <div>
          <p className="text-lg font-semibold">
            <Dois n={d.pergunta} />
          </p>
          <p className="mt-1 text-sm text-suave">
            Condição do Manual: <span className="font-mono whitespace-pre-line">{d.condicao}</span>
          </p>
          <div role="group" aria-label="Sua resposta" className="mt-3 flex gap-2">
            {(["sim", "nao"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={resposta === r}
                onClick={() => responder(r)}
                className="min-h-11 rounded-lg border border-controle px-5 font-semibold aria-pressed:border-marca aria-pressed:bg-marca aria-pressed:text-sobre-marca"
              >
                {r === "sim" ? "Sim" : "Não"}
              </button>
            ))}
          </div>
          {resposta && (
            <div data-testid="sim-resposta" className="mt-3 rounded-lg border border-linha p-3">
              <Dois n={resposta === "sim" ? d.sim : d.nao} />
              {resposta === "nao" && (
                <button type="button" onClick={() => responder("sim")} className="mt-2 min-h-11 underline underline-offset-4">
                  Ver o caso em que o registro existe
                </button>
              )}
            </div>
          )}
          {!resposta && <p className="mt-3 text-sm text-suave">A simulação continua depois da sua resposta.</p>}
        </div>
      );
    }
    case "campo": {
      const c = s.campos[p.i]!;
      const letras = completo ? c.valor.length : Math.min(c.valor.length, Math.floor(Math.max(0, decorrido - 500) / MS_POR_LETRA));
      const fato = s.fatos.find((f) => f.campos.includes(c.nome));
      return (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-marca p-3">
            <p className="font-mono font-semibold break-all">
              {p.i + 1}. {c.nome}
            </p>
            <p className="mt-1 text-sm text-suave">
              {c.tipo === "N" || c.tipo === "NS" ? "Numérico" : "Texto"}
              {/^\d+$/.test(c.tamanho) ? `, até ${c.tamanho} ${c.tamanho === "1" ? "caractere" : "caracteres"}` : ""} · {c.obrigatorio === "Sim" ? "obrigatório" : "não obrigatório"}
            </p>
            <div className="mt-2 text-sm">{c.legenda ? <Dois n={c.legenda} /> : <p className="line-clamp-4 whitespace-pre-line">{c.descricao}</p>}</div>
            <p data-testid="sim-valor" className="mt-3 min-h-10 rounded bg-fundo px-3 py-2 font-mono break-all">
              {c.valor === "" ? <span className="text-suave">(fica vazio)</span> : c.valor.slice(0, letras)}
              {!completo && letras < c.valor.length && <span aria-hidden className="animate-pulse">▍</span>}
            </p>
          </div>
          <div className="min-w-0">
            {fato ? (
              <div className="rounded-lg bg-fundo p-3 text-sm">
                <p className="font-semibold">Vem da ficha:</p>
                <Dois n={fato.texto} />
              </div>
            ) : (
              <p className="text-sm text-suave">{p.i === 0 ? "Texto fixo: o código do registro." : "Fixo ou derivado dos outros campos."}</p>
            )}
            <div className="mt-3">
              <Linha valores={valores.map((v, n) => (n === p.i ? v.slice(0, letras) : v))} ate={p.i} destaque={p.i} />
            </div>
          </div>
        </div>
      );
    }
    case "linha":
      return (
        <div>
          <Linha valores={valores} />
          <p className="mt-2 text-sm text-suave">
            Cada campo fica entre barras verticais, na ordem do leiaute. É assim que o registro aparece no arquivo.
          </p>
        </div>
      );
    case "regras": {
      const simuladas = s.regras.filter((r) => r.simulada);
      const quantas = completo ? simuladas.length : Math.min(simuladas.length, Math.floor(decorrido / 700) + 1);
      return (
        <div>
          <p className="text-sm text-suave">
            Formato de cada campo conferido com o leiaute: tipo, tamanho, valores válidos e obrigatoriedade. Depois, as regras do Manual:
          </p>
          <ul className="mt-3 space-y-2">
            {simuladas.slice(0, quantas).map((r) => (
              <Regra key={`${r.campo}-${r.codigo}`} r={r} />
            ))}
          </ul>
        </div>
      );
    }
    case "naoSimuladas":
      return (
        <ul className="space-y-2">
          {s.regras.filter((r) => !r.simulada).map((r) => (
            <Regra key={`${r.campo}-${r.codigo}`} r={r} />
          ))}
        </ul>
      );
    case "erro": {
      const i = s.campos.findIndex((c) => c.nome === s.erro.campo);
      const errados = valores.map((v, n) => (n === i ? s.erro.errado : v));
      return (
        <div>
          <p>
            <Dois n={s.erro.explicacao} />
          </p>
          <div className="mt-3">
            <Linha valores={errados} erro={i} />
          </div>
          <div className="mt-3 rounded-lg border border-alerta p-3">
            <p className="font-semibold text-alerta">
              <TriangleAlert aria-hidden size={18} className="mr-1 inline align-[-3px]" />
              O programa acusaria: <span className="block font-mono break-all">{s.erro.regra.codigo}</span>
            </p>
            <p className="mt-1">{s.erro.regra.resultado?.detalhe}</p>
          </div>
          <div className="mt-3 rounded-lg bg-ok-fundo p-3 text-ok">
            <p className="font-semibold">Como corrigir</p>
            <Dois n={s.erro.comoCorrigir} />
          </div>
        </div>
      );
    }
    case "resumo":
      return (
        <div>
          <Linha valores={valores} />
          <dl className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {s.campos.filter((c) => c.valor !== "").map((c) => (
              <div key={c.nome} className="flex min-w-0 gap-2">
                <dt className="font-mono font-semibold">{c.nome}</dt>
                <dd className="min-w-0 font-mono break-all">{c.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-suave">
            Regras conferidas: {s.regras.filter((r) => r.simulada).length} de {s.regras.length}; as outras dependem do programa ou de dados que o
            exemplo não tem. Fonte:{" "}
            <a href={s.fonte.url} rel="noopener noreferrer" className="underline underline-offset-4">
              Manual de Orientação do Leiaute {s.leiaute}
            </a>
            , {s.fonte.trecho}. Verificado em {s.fonte.verificadoEm.split("-").reverse().join("/")}. Conteúdo educacional; não substitui
            orientação de profissional contábil nem a legislação oficial.
          </p>
        </div>
      );
  }
}

export default function Player({ sim }: { sim: Simulacao }) {
  const lista = useMemo(() => passos(sim), [sim]);
  const reduzido = useMenosMovimento();
  // Passo atual e tempo dentro dele andam juntos: o relógio avança os dois de uma vez.
  const [{ i, decorrido }, setRelogio] = useState({ i: 0, decorrido: 0 });
  const [tocando, setTocando] = useState(true);
  const [vel, setVel] = useState<(typeof VELOCIDADES)[number]>(1);
  const [resposta, setResposta] = useState<"sim" | "nao" | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const p = lista[i]!;
  const esperando = p.tipo === "decisao" && resposta !== "sim";
  const fim = i === lista.length - 1;

  useEffect(() => {
    if (!tocando || reduzido || esperando || fim) return;
    const t = setInterval(
      () =>
        setRelogio((r) => {
          const d = r.decorrido + TIQUE * vel;
          const ms = lista[r.i]!.ms;
          return ms > 0 && d >= ms && r.i < lista.length - 1 ? { i: r.i + 1, decorrido: 0 } : { i: r.i, decorrido: d };
        }),
      TIQUE,
    );
    return () => clearInterval(t);
  }, [tocando, reduzido, esperando, fim, vel, lista]);

  const ir = (n: number) => {
    if (n < 0 || n >= lista.length) return;
    // Andar à mão mostra o passo inteiro; tocando, ele anima de novo.
    setRelogio({ i: n, decorrido: tocando ? 0 : lista[n]!.ms });
  };
  const reiniciar = () => {
    setRelogio({ i: 0, decorrido: 0 });
    setResposta(null);
    setTocando(true);
  };
  // Teclas valem só com o foco dentro do player: a rolagem da página continua livre.
  // As setas andam à mão: pausam e mostram o passo inteiro.
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const ouvir = (e: globalThis.KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (e.key === " " && alvo === el) {
        e.preventDefault();
        setTocando((t) => !t);
      } else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !alvo.matches("input, select, textarea")) {
        e.preventDefault();
        setTocando(false);
        setRelogio((r) => {
          const n = Math.min(lista.length - 1, Math.max(0, r.i + (e.key === "ArrowRight" ? 1 : -1)));
          return { i: n, decorrido: lista[n]!.ms };
        });
      }
    };
    el.addEventListener("keydown", ouvir);
    return () => el.removeEventListener("keydown", ouvir);
  }, [reduzido, lista]);
  const responder = (r: "sim" | "nao") => {
    setResposta(r);
    if (r === "sim" && !reduzido) setTocando(true);
  };

  const rotulo = `Simulação do preenchimento do ${sim.codigo}`;
  if (reduzido) {
    return (
      <section aria-label={rotulo} data-testid="sim-lista" className="rounded-xl border border-linha bg-superficie p-4">
        <p className="mb-3 text-sm text-suave">Com movimento reduzido, a simulação aparece como uma lista de passos.</p>
        <ol className="space-y-6">
          {lista.map((x, n) => (
            <li key={n}>
              <h3 className="mb-2 font-semibold">
                Passo {n + 1}: {x.titulo}
              </h3>
              <Corpo s={sim} p={x} decorrido={x.ms} completo resposta={resposta} responder={responder} />
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const botao = "grid min-h-11 min-w-11 place-items-center rounded-lg border border-controle px-3 hover:border-marca disabled:opacity-50";
  return (
    <div
      ref={caixa}
      role="region"
      aria-label={`${rotulo}. Espaço pausa ou continua; setas andam entre os passos.`}
      tabIndex={0}
      data-testid="sim-player"
      className="rounded-xl border border-linha bg-superficie p-4 focus-visible:outline-3 focus-visible:outline-marca"
    >
      <p aria-live="polite" className="font-semibold" data-testid="sim-passo">
        Passo {i + 1} de {lista.length}: {p.titulo}
      </p>
      <div className="mt-3 min-h-48">
        <Corpo s={sim} p={p} decorrido={decorrido} completo={!tocando} resposta={resposta} responder={responder} />
      </div>

      <ol aria-label="Passos" className="mt-4 flex gap-1">
        {lista.map((x, n) => (
          <li key={n} className="flex-1">
            <button
              type="button"
              aria-label={`Ir para o passo ${n + 1}: ${x.titulo}`}
              aria-current={n === i ? "step" : undefined}
              onClick={() => ir(n)}
              className="grid h-6 w-full place-items-center"
            >
              <span aria-hidden className={cn("block h-1.5 w-full rounded-full", n < i ? "bg-marca" : n === i ? "bg-tinta" : "bg-linha")} />
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Passo anterior" disabled={i === 0} onClick={() => ir(i - 1)} className={botao}>
          <ChevronLeft aria-hidden size={20} />
        </button>
        <button type="button" onClick={() => setTocando((t) => !t)} disabled={fim} className={cn(botao, "gap-2 font-semibold")}>
          <span className="flex items-center gap-2">
            {tocando && !fim ? <Pause aria-hidden size={18} /> : <Play aria-hidden size={18} />}
            {tocando && !fim ? "Pausar" : "Continuar"}
          </span>
        </button>
        <button type="button" aria-label="Próximo passo" disabled={fim || esperando} onClick={() => ir(i + 1)} className={botao}>
          <ChevronRight aria-hidden size={20} />
        </button>
        <button type="button" onClick={reiniciar} className={botao}>
          <span className="flex items-center gap-2">
            <RotateCcw aria-hidden size={18} /> Reiniciar
          </span>
        </button>
        <div role="group" aria-label="Velocidade" className="ml-auto flex gap-1">
          {VELOCIDADES.map((v) => (
            <button key={v} type="button" aria-pressed={vel === v} onClick={() => setVel(v)} className={cn(botao, "aria-pressed:border-marca aria-pressed:bg-marca aria-pressed:text-sobre-marca")}>
              {String(v).replace(".", ",")}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

