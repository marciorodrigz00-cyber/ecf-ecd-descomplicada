"use client";

import { ArrowLeft, ArrowRight, Pause, Play, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ExemploCampoACampo } from "@/components/ecf/exemplo-registro";
import { ICONES } from "@/components/ecf/icones";
import { registrarFeito, registrarVisita } from "@/components/layout/trilha";
import { Cartao, Nivel, estiloBotao } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useParametros } from "@/lib/parametros";
import { usePreferencias } from "@/lib/preferencias";
import type { ResumoRegistro } from "@/lib/exemplos/por-registro";

type Situacao = "sim" | "depende" | "nao";
export type NoConsole = {
  id: string;
  letra: string;
  curto: string;
  /** null: vem de fora da ECF. */
  bloco: null | {
    nome: string;
    href: string;
    objetivo: string;
    analogia: string;
    nota: string;
    celulas: Record<string, Situacao>;
    erros: { titulo: string; comoEvitar: string; registro: string; href: string }[];
    registros: { codigo: string; nome: string; campos: number; href: string }[];
  };
};
export type LigacaoConsole = { de: string; para: string; o: string; registro: string; href: string };
type Props = { nos: NoConsole[]; ligacoes: LigacaoConsole[]; regimes: { id: string; nome: string }[]; ano: number };

/** Posição em porcentagem. Só apresentação: quem existe e o que se liga vem do conteúdo. */
const POS: Record<string, readonly [number, number]> = {
  ECD: [6.5, 13], ECFA: [6.5, 45], C: [22.5, 13], E: [22.5, 45], J: [39, 13], K: [39, 45], L: [56, 13], M: [72.5, 45], N: [91.5, 45],
  P: [63, 13], U: [63, 13], T: [63, 13], Q: [82, 13],
  "0": [8, 87], V: [24.8, 87], W: [41.6, 87], X: [58.4, 87], Y: [75.2, 87], "9": [92, 87],
};
const INICIAL: Record<string, string> = { real: "M", presumido: "P", arbitrado: "T", imune: "U", isenta: "U" };
const TEXTO_SITUACAO: Record<Situacao, string> = { sim: "Existe", depende: "Depende da situação", nao: "Não existe" };
const ABAS = ["ligacoes", "registros", "erros", "regime"] as const;
const INTERVALO = 4000;
const chip =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border border-linha bg-fundo px-4 font-medium text-tinta hover:border-marca aria-pressed:border-marca aria-pressed:bg-marca aria-pressed:font-semibold aria-pressed:text-sobre-marca";

function traco([x1, y1]: readonly [number, number], [x2, y2]: readonly [number, number]): string {
  const [a, b, c, d] = [x1 * 10, y1 * 3.7, x2 * 10, y2 * 3.7];
  // Mesma linha e longe: passa por baixo do bloco do meio.
  if (b === d && c - a > 400) return `M${a} ${b}C${a + 120} ${b + 85} ${c - 120} ${b + 85} ${c} ${d}`;
  if (Math.abs(a - c) < 40) return `M${a} ${b}L${c} ${d}`;
  return `M${a} ${b}C${(a + c) / 2} ${b} ${(a + c) / 2} ${d} ${c} ${d}`;
}

export function Console({ nos, ligacoes, regimes, ano }: Props) {
  // Regime vazio no endereço = o do perfil, ou o primeiro (lucro real). Escolher um regime sempre o grava no endereço.
  const padrao = { regime: "", bloco: "M", aba: "ligacoes" };
  const [{ regime: escolhido, bloco: lido, aba }, mudar] = useParametros(padrao, (lidos) => ({
    regime: regimes.some((x) => x.id === lidos.regime) ? lidos.regime : "",
    bloco: nos.some((n) => n.id === lidos.bloco) ? lidos.bloco : padrao.bloco,
    aba: (ABAS as readonly string[]).includes(lidos.aba) ? lidos.aba : padrao.aba,
  }));
  const { regime: doPerfil } = usePreferencias();
  const regime = escolhido || (regimes.some((x) => x.id === doPerfil) ? doPerfil! : regimes[0]!.id);
  const noLido = nos.find((n) => n.id === lido);
  const sel = !noLido || noLido.bloco?.celulas[regime] === "nao" ? (INICIAL[regime] ?? padrao.bloco) : lido;
  const [aberto, setAberto] = useState<string | null>(null);
  const [passo, setPasso] = useState<number | null>(null);
  const [tocando, setTocando] = useState(false);
  const mapa = useRef<HTMLDivElement>(null);

  const existe = (n: NoConsole) => (n.bloco ? n.bloco.celulas[regime]! : "externo");
  const visiveis = nos.filter((n) => existe(n) !== "nao");
  const ids = new Set(visiveis.map((n) => n.id));
  const ativas = ligacoes.filter((l) => ids.has(l.de) && ids.has(l.para));
  const ordem = visiveis.filter((n) => n.bloco).map((n) => n.id);
  const atual = nos.find((n) => n.id === sel)!;
  const vizinhos = new Set(ativas.flatMap((l) => (l.de === sel ? [l.para] : l.para === sel ? [l.de] : [])));

  function abrir(id: string, novaAba = aba) {
    mudar({ bloco: id, aba: novaAba });
    setAberto(null);
    if (nos.find((n) => n.id === id)?.bloco) registrarVisita(id);
  }
  function escolher(id: string) {
    setTocando(false);
    setPasso((p) => (p === null ? null : Math.max(0, ordem.indexOf(id))));
    abrir(id);
  }
  function mudarRegime(id: string) {
    setTocando(false);
    setPasso(null);
    mudar({ regime: id });
    const no = nos.find((n) => n.id === sel)!;
    if (no.bloco && no.bloco.celulas[id] === "nao") abrir(INICIAL[id]!, "ligacoes");
  }
  function irPara(p: number) {
    if (p < 0 || p >= ordem.length) return;
    setPasso(p);
    abrir(ordem[p]!, "ligacoes");
    if (p === ordem.length - 1) {
      registrarFeito("percurso");
      setTocando(false);
    }
  }
  function percorrer() {
    irPara(0);
    // Quem pede menos movimento avança à mão.
    setTocando(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  useEffect(() => {
    if (!tocando || passo === null) return;
    const t = setTimeout(() => irPara(passo + 1), INTERVALO);
    return () => clearTimeout(t);
  });

  function setas(e: KeyboardEvent) {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const foco = (e.target as HTMLElement).closest<HTMLElement>("[data-no]")?.dataset.no;
    if (!d || !foco) return;
    e.preventDefault();
    const lista = visiveis.map((n) => n.id);
    const proximo = lista[lista.indexOf(foco) + d];
    if (!proximo) return;
    escolher(proximo);
    mapa.current?.querySelector<HTMLElement>(`[data-no="${proximo}"]`)?.focus();
  }

  return (
    <div className="space-y-5">
      <Cartao className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Regime de tributação" className="flex flex-wrap gap-2">
            {regimes.map((r) => (
              <button key={r.id} type="button" aria-pressed={r.id === regime} onClick={() => mudarRegime(r.id)} className={chip}>
                {r.nome}
              </button>
            ))}
          </div>
          {passo === null && (
            <button type="button" onClick={percorrer} className={chip}>
              <Play aria-hidden size={16} /> Percorrer passo a passo
            </button>
          )}
        </div>
        <p role="status" data-testid="mapa-contagem" className="mb-4 text-suave">
          Regime escolhido: {regimes.find((r) => r.id === regime)!.nome}. Mostrando {ordem.length} de {nos.filter((n) => n.bloco).length} blocos; os
          outros não existem neste regime.
        </p>
        {passo !== null && (
          <div role="group" aria-label="Percurso" className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-marca p-2">
            <span data-testid="percurso" className="px-2 font-mono">
              {passo + 1} de {ordem.length}
            </span>
            <button type="button" aria-label="Passo anterior" disabled={passo === 0} onClick={() => { setTocando(false); irPara(passo - 1); }} className={cn(chip, "disabled:opacity-50")}>
              <ArrowLeft aria-hidden size={18} />
            </button>
            <button type="button" disabled={passo === ordem.length - 1} onClick={() => setTocando(!tocando)} className={cn(chip, "disabled:opacity-50")}>
              {tocando ? <Pause aria-hidden size={16} /> : <Play aria-hidden size={16} />}
              {tocando ? "Pausar" : "Continuar"}
            </button>
            <button type="button" aria-label="Próximo passo" disabled={passo === ordem.length - 1} onClick={() => { setTocando(false); irPara(passo + 1); }} className={cn(chip, "disabled:opacity-50")}>
              <ArrowRight aria-hidden size={18} />
            </button>
            <button type="button" onClick={() => { setTocando(false); setPasso(null); }} className={cn(chip, "ml-auto")}>
              <X aria-hidden size={16} /> Sair
            </button>
          </div>
        )}

        {/* Setas do teclado andam entre os blocos; Tab também. */}
        <div
          ref={mapa}
          role="group"
          aria-label="Mapa de fluxo: escolha um bloco"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:relative lg:block lg:h-92"
        >
          <svg viewBox="0 0 1000 370" preserveAspectRatio="none" aria-hidden className="absolute inset-0 hidden size-full lg:block">
            {ativas.map((l) => {
              const viva = l.de === sel || l.para === sel;
              // As ligações que saem do bloco 0 são muitas: só aparecem quando interessam.
              if (!viva && (l.de === "0" || l.de === "Y")) return null;
              return (
                <path
                  key={`${l.de}-${l.para}-${l.registro}`}
                  d={traco(POS[l.de]!, POS[l.para]!)}
                  className={viva ? "fluxo fluxo-vivo" : "fluxo"}
                  // O pontilhado corre no sentido do dado.
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          {visiveis.map((n) => {
            const s = existe(n);
            const Icone = ICONES[n.id];
            const [x, y] = POS[n.id]!;
            return (
              <button
                key={n.id}
                type="button"
                data-no={n.id}
                aria-pressed={n.id === sel}
                onClick={() => escolher(n.id)}
                onKeyDown={setas}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={cn(
                  "min-h-17 rounded-xl border bg-superficie px-3 py-2 text-left transition-colors hover:border-marca lg:absolute lg:w-32 lg:-translate-x-1/2 lg:-translate-y-1/2",
                  n.id === sel
                    ? "border-marca bg-marca text-sobre-marca"
                    : cn(
                        s === "depende" ? "border-dashed border-controle" : s === "externo" ? "border-dotted border-controle lg:w-26" : "border-controle",
                        vizinhos.has(n.id) ? "border-marca text-tinta ring-2 ring-marca/30" : "text-suave",
                      ),
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-mono text-xl leading-tight font-semibold">
                    {n.bloco && <span className="sr-only">Bloco </span>}
                    {n.letra}
                  </span>
                  {Icone && <Icone aria-hidden size={16} />}
                </span>
                <span className="block text-sm leading-tight">{n.curto.replaceAll("-", "\u2011")}</span>
                {s === "depende" && <span className="sr-only">, depende da situação</span>}
              </button>
            );
          })}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-suave">
          {[["", "existe neste regime"], ["border-dashed", "depende da situação"], ["border-dotted", "vem de fora da ECF"]].map(([c, t]) => (
            <li key={t} className="flex items-center gap-2">
              <span aria-hidden className={cn("h-3 w-6 rounded border border-controle", c)} /> {t}
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao className="p-4 sm:p-6">
        <div aria-live={tocando ? "off" : "polite"} data-testid="console-painel">
          <h2 className="flex items-baseline gap-4 text-2xl font-bold">
            <span className="font-mono text-5xl leading-none text-marca">{atual.letra}</span>
            {atual.curto}
          </h2>
          {atual.bloco ? (
            <div className="mt-3 max-w-prose text-lg">
              <Nivel so="iniciante">
                {atual.bloco.analogia} {atual.bloco.objetivo}
              </Nivel>
              <Nivel so="profissional">
                {atual.bloco.nome}. {atual.bloco.objetivo}
              </Nivel>
            </div>
          ) : (
            <p className="mt-3 text-lg">Vem de fora do arquivo e alimenta os blocos abaixo.</p>
          )}
        </div>
        {atual.bloco && (
          <div role="group" aria-label="Conteúdo do bloco" className="mt-4 flex flex-wrap gap-2">
            {ABAS.map((a) => (
              <button key={a} type="button" aria-pressed={aba === a} onClick={() => { setTocando(false); mudar({ aba: a }); setAberto(null); }} className={chip}>
                {a === "ligacoes" ? "Ligações" : a === "registros" ? `Registros (${atual.bloco!.registros.length})` : a === "erros" ? `Erros comuns (${atual.bloco!.erros.length})` : "Em cada regime"}
              </button>
            ))}
            <Link href={atual.bloco.href} prefetch={false} className={estiloBotao({ variante: "contorno" })}>
              Abrir o bloco {atual.letra} <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
        )}
        <div className="mt-5">
          {(aba === "ligacoes" || !atual.bloco) && (
            <div className="grid gap-5 md:grid-cols-2">
              <Ligacoes titulo="Recebe de" vazio="Não recebe dados de outro bloco." itens={ativas.filter((l) => l.para === sel).map((l) => ({ ...l, outro: l.de }))} nos={nos} aoIr={escolher} />
              <Ligacoes titulo="Entrega para" vazio="Não entrega dados para outro bloco." itens={ativas.filter((l) => l.de === sel).map((l) => ({ ...l, outro: l.para }))} nos={nos} aoIr={escolher} />
            </div>
          )}
          {aba === "registros" && atual.bloco && (
            <Registros key={`${ano}-${sel}`} letra={atual.letra} ano={ano} registros={atual.bloco.registros} aberto={aberto} aoAbrir={(c) => { setTocando(false); setAberto(c); }} />
          )}
          {aba === "erros" && atual.bloco && (
            <ul className="divide-y divide-linha">
              {atual.bloco.erros.map((e) => (
                <li key={e.titulo} className="flex flex-wrap items-baseline justify-between gap-x-4 py-3">
                  <span className="max-w-prose">
                    <strong>{e.titulo}.</strong> {e.comoEvitar}
                  </span>
                  <Link href={e.href} prefetch={false} className="inline-block py-1 font-mono text-sm underline underline-offset-4">
                    {e.registro}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {aba === "regime" && atual.bloco && (
            <>
              <p className="mb-2 max-w-prose">{atual.bloco.nota}</p>
              <ul className="divide-y divide-linha">
                {regimes.map((r) => (
                  <li key={r.id} className="flex justify-between gap-4 py-2">
                    <span className={r.id === regime ? "font-semibold" : undefined}>{r.nome}</span>
                    <span className="text-suave">{TEXTO_SITUACAO[atual.bloco!.celulas[r.id]!]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Cartao>
    </div>
  );
}

function Ligacoes({ titulo, vazio, itens, nos, aoIr }: { titulo: string; vazio: string; itens: (LigacaoConsole & { outro: string })[]; nos: NoConsole[]; aoIr: (id: string) => void }) {
  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold">{titulo}</h3>
      {itens.length === 0 && <p className="text-suave">{vazio}</p>}
      <ul className="divide-y divide-linha">
        {itens.map((l) => {
          const no = nos.find((n) => n.id === l.outro)!;
          return (
            <li key={`${l.de}-${l.para}-${l.registro}`} className="flex items-center gap-3 py-2">
              <button
                type="button"
                aria-label={`Ir para ${no.bloco ? `bloco ${no.letra}` : no.curto}`}
                onClick={() => aoIr(l.outro)}
                className="min-h-9 min-w-9 shrink-0 rounded-lg border border-controle px-2 font-mono font-semibold hover:border-marca"
              >
                {no.letra}
              </button>
              <span className="min-w-0">{l.o}</span>
              <Link href={l.href} prefetch={false} className="ml-auto inline-block py-1 font-mono text-sm text-suave underline underline-offset-4">
                {l.registro}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type Carga = { estado: "carregando" } | { estado: "erro" } | { estado: "pronto"; dados: ResumoRegistro[] };
const guardados = new Map<string, ResumoRegistro[]>();

function Registros({ letra, ano, registros, aberto, aoAbrir }: {
  letra: string;
  ano: number;
  registros: { codigo: string; nome: string; campos: number; href: string }[];
  aberto: string | null;
  aoAbrir: (codigo: string | null) => void;
}) {
  const url = `/dados/${ano}/${letra.toLowerCase()}.json`;
  const [carga, setCarga] = useState<Carga>(() => (guardados.has(url) ? { estado: "pronto", dados: guardados.get(url)! } : { estado: "carregando" }));
  const [tentativa, setTentativa] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const precisa = aberto !== null && carga.estado !== "pronto";

  useEffect(() => {
    if (!precisa) return;
    const corte = new AbortController();
    fetch(url, { signal: corte.signal })
      .then((r) => (r.ok ? (r.json() as Promise<ResumoRegistro[]>) : Promise.reject(new Error(String(r.status)))))
      .then((dados) => {
        guardados.set(url, dados);
        setCarga({ estado: "pronto", dados });
      })
      .catch(() => {
        if (!corte.signal.aborted) setCarga({ estado: "erro" });
      });
    return () => corte.abort();
  }, [precisa, url, tentativa]);

  useEffect(() => {
    if (aberto) titulo.current?.focus();
  }, [aberto]);

  const atual = registros.find((r) => r.codigo === aberto);
  const resumo = carga.estado === "pronto" ? carga.dados.find((d) => d.codigo === aberto) : undefined;
  return (
    <>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {registros.map((r) => (
          <li key={r.codigo}>
            <button
              type="button"
              aria-expanded={r.codigo === aberto}
              aria-controls="registro-aberto"
              data-registro={r.codigo}
              onClick={() => {
                if (r.codigo !== aberto) registrarVisita(r.codigo);
                aoAbrir(r.codigo === aberto ? null : r.codigo);
              }}
              className={cn(
                "flex h-full min-h-16 w-full flex-col items-start rounded-lg border bg-fundo px-4 py-3 text-left hover:border-marca",
                r.codigo === aberto ? "border-marca ring-2 ring-marca/30" : "border-linha",
              )}
            >
              <span>
                <span className="font-mono font-semibold text-marca">{r.codigo}</span> {r.nome}
              </span>
              <span className="block text-sm text-suave">{r.campos === 1 ? "1 campo" : `${r.campos} campos`}</span>
            </button>
          </li>
        ))}
      </ul>
      <div id="registro-aberto" data-testid="registro-aberto">
        {atual && (
          <section aria-labelledby="t-registro" className="mt-5 rounded-xl border border-marca bg-superficie p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 id="t-registro" ref={titulo} tabIndex={-1} className="text-xl font-bold outline-none">
                <span className="font-mono text-marca">{atual.codigo}</span> {atual.nome}
              </h3>
              <button type="button" onClick={() => aoAbrir(null)} className={chip}>
                <X aria-hidden size={16} /> Fechar
              </button>
            </div>
            {carga.estado === "carregando" && <p role="status" className="mt-3 text-suave">Carregando o registro…</p>}
            {carga.estado === "erro" && (
              <div role="alert" className="mt-3">
                <p>Não foi possível carregar o exemplo agora.</p>
                <button type="button" onClick={() => { setCarga({ estado: "carregando" }); setTentativa((t) => t + 1); }} className={cn(chip, "mt-2")}>
                  Tentar de novo
                </button>
              </div>
            )}
            {resumo && <Detalhe key={resumo.codigo} r={resumo} />}
            <Link href={atual.href} prefetch={false} className="mt-4 inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
              Todos os campos e regras do {atual.codigo} <ArrowRight aria-hidden size={18} />
            </Link>
          </section>
        )}
      </div>
    </>
  );
}

function Detalhe({ r }: { r: ResumoRegistro }) {
  const [i, setI] = useState(0);
  const ex = r.exemplos[Math.min(i, r.exemplos.length - 1)];
  return (
    <>
      <h4 className="mt-4 text-lg font-semibold">O que é</h4>
      {r.descricao.length > 0 ? (
        r.descricao.map((p, n) => (
          <p key={n} className="mt-2 max-w-prose whitespace-pre-line">
            {p}
          </p>
        ))
      ) : (
        <p className="mt-2 text-suave">O Manual não traz descrição para este registro.</p>
      )}
      {r.descricaoCortada && <p className="mt-2 text-sm text-suave">Trecho da descrição oficial. O texto inteiro está na página do registro.</p>}
      <p className="mt-2 text-sm text-suave">Na transmissão: {r.obrigatoriedade.toLowerCase()}.</p>
      <h4 className="mt-5 text-lg font-semibold">Exemplo preenchido</h4>
      {r.exemplos.length > 1 && (
        <div role="group" aria-label="Escolha o exemplo" className="mt-2 flex flex-wrap gap-2">
          {r.exemplos.map((x, n) => (
            <button key={x.titulo} type="button" aria-pressed={x === ex} onClick={() => setI(n)} className={chip}>
              {x.titulo}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        {ex ? <ExemploCampoACampo ex={ex} rotulo={`${r.codigo}, ${ex.titulo}`} /> : <p className="text-suave">{r.semExemplo}</p>}
      </div>
    </>
  );
}
