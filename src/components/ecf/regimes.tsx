"use client";

import { Check, CircleHelp, Minus } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Etiqueta } from "@/components/ui";
import { ordinal } from "@/lib/formatos";
import { useParametros } from "@/lib/parametros";
import { usePreferencias } from "@/lib/preferencias";
import type { Regime, Situacao } from "@/schemas";
import { ICONES } from "./icones";

export const ROTULO: Record<Situacao, { texto: string; tom: "ok" | "alerta" | "neutro"; Icone: typeof Check }> = {
  sim: { texto: "Previsto", tom: "ok", Icone: Check },
  depende: { texto: "Depende", tom: "alerta", Icone: CircleHelp },
  nao: { texto: "Não previsto", tom: "neutro", Icone: Minus },
};

/** Nos cartões de bloco, a situação dita para o regime escolhido (decisão da etapa 2). */
export const PARA_O_REGIME: Record<Situacao, string> = {
  sim: "Previsto para o seu regime",
  depende: "Depende de uma condição",
  nao: "Não se aplica ao seu regime",
};

export const SIGNIFICADO: Record<Situacao, string> = {
  sim: "o Manual prevê o bloco para esse regime",
  depende: "o bloco só existe se uma condição do Manual for atendida",
  nao: "o Manual não prevê o bloco para esse regime",
};

/** Legenda visível das etiquetas Previsto, Depende e Não previsto. */
export function LegendaSituacao({ doRegime = false }: { doRegime?: boolean }) {
  return (
    <dl data-testid="legenda-situacao" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {(Object.keys(ROTULO) as Situacao[]).map((s) => (
        <div key={s} className="flex flex-wrap items-center gap-2">
          <dt>
            <EtiquetaSituacao s={s} doRegime={doRegime} />
          </dt>
          <dd className="text-suave">{SIGNIFICADO[s]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EtiquetaSituacao({ s, doRegime = false }: { s: Situacao; doRegime?: boolean }) {
  const { texto, tom, Icone } = ROTULO[s];
  return (
    <Etiqueta tom={tom} title={SIGNIFICADO[s]}>
      <Icone aria-hidden size={16} />
      {doRegime ? PARA_O_REGIME[s] : texto}
    </Etiqueta>
  );
}

const CURTO: Record<string, string> = { real: "Real", presumido: "Presumido", arbitrado: "Arbitrado", imune: "Imune", isenta: "Isenta" };

/** Os cinco regimes em linha: ícone e nome curto, com a situação por extenso para leitor de tela. */
function RegimesDoBloco({ celulas, regimes }: { celulas: Record<Regime, Situacao>; regimes: { id: Regime; nome: string }[] }) {
  return (
    <ul aria-label="Situação em cada regime" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {regimes.map((r) => {
        const { Icone, texto } = ROTULO[celulas[r.id]];
        return (
          <li key={r.id} className="flex items-center gap-1" data-regime={r.id} data-situacao={celulas[r.id]}>
            <Icone aria-hidden size={14} className={celulas[r.id] === "nao" ? "text-suave" : undefined} />
            <span className={celulas[r.id] === "nao" ? "text-suave line-through" : undefined}>{CURTO[r.id] ?? r.nome}</span>
            <span className="sr-only">: {texto}</span>
          </li>
        );
      })}
    </ul>
  );
}

export type CartaoBloco = {
  letra: string;
  nome: string;
  familia: string;
  /** Grupo didático, criado por este site. */
  grupo: string;
  ecd: boolean;
  tom: number;
  /** posição no leiaute, calculada antes de filtrar */
  posicao: number;
  href: string;
  objetivo: string;
  nota: string;
  celulas: Record<Regime, Situacao>;
  /** registros do bloco no ano */
  registros: number;
};

export function BlocosPorRegime({ blocos, regimes }: { blocos: CartaoBloco[]; regimes: { id: Regime; nome: string }[] }) {
  const [valores, mudar] = useParametros({ regime: "", so: "" }, (lidos) => ({
    regime: lidos.regime === "todos" || regimes.some((r) => r.id === lidos.regime) ? lidos.regime : "",
    so: lidos.so === "previstos" ? "previstos" : "",
  }));
  // Sem regime no endereço, vale o do perfil; “todos” é a escolha explícita de ver todos.
  const { regime: doPerfil } = usePreferencias();
  const doEndereco = valores.regime !== "";
  const regime = valores.regime === "todos" ? null : (regimes.find((r) => r.id === (valores.regime || doPerfil))?.id ?? null);
  const soAplicaveis = valores.so === "previstos";
  const id = useId();
  const lista = regime && soAplicaveis ? blocos.filter((b) => b.celulas[regime] !== "nao") : blocos;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <label htmlFor={id} className="block font-medium">
            Regime da empresa
          </label>
          <select
            id={id}
            value={regime ?? "todos"}
            onChange={(e) => mudar({ regime: e.target.value })}
            className="mt-1 min-h-11 rounded-lg border border-controle bg-superficie px-3"
          >
            <option value="todos">Todos</option>
            {regimes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={soAplicaveis}
            disabled={!regime}
            onChange={(e) => mudar({ so: e.target.checked ? "previstos" : "" })}
            className="size-5 accent-marca"
          />
          Esconder os não previstos
        </label>
      </div>
      {regime && !doEndereco && (
        <p className="mb-2 text-sm text-suave" data-testid="regime-do-perfil">
          Regime do seu perfil. Para ver outro, troque acima.
        </p>
      )}
      {regime && <LegendaSituacao doRegime />}
      <p role="status" className="mb-4 text-suave">
        Mostrando {lista.length} de {blocos.length} blocos
      </p>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {lista.map((b) => {
          const Icone = ICONES[b.letra]!;
          return (
            <li key={b.letra} data-familia={b.familia} data-tom={b.tom} data-bloco={b.letra}>
              <Link
                href={b.href}
                prefetch={false}
                title={b.objetivo}
                className="bloco flex h-full flex-col rounded-xl border p-5 text-tinta no-underline transition-[border-color] hover:border-marca"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs tracking-widest text-suave uppercase">
                    {ordinal(b.posicao)} do arquivo · {b.grupo}
                  </span>
                  <Icone aria-hidden className="bloco-icone shrink-0" size={20} />
                </span>
                <span className="mt-3 font-mono text-4xl leading-none font-semibold">
                  <span className="sr-only">Bloco </span>
                  {b.letra}
                </span>
                <span className="mt-2 block font-semibold">{b.nome}</span>
                <span className="block text-sm text-suave" data-testid="registros-do-bloco">
                  {b.registros} {b.registros === 1 ? "registro" : "registros"}
                </span>
                <span className="mt-auto flex flex-col items-start gap-2 pt-3">
                  {b.ecd && <Etiqueta>dados da ECD</Etiqueta>}
                  {regime && <EtiquetaSituacao s={b.celulas[regime]} doRegime />}
                  <RegimesDoBloco celulas={b.celulas} regimes={regimes} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
