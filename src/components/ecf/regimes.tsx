"use client";

import { Check, CircleHelp, Minus } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Etiqueta } from "@/components/ui";
import { ordinal } from "@/lib/formatos";
import { useParametros } from "@/lib/parametros";
import type { Regime, Situacao } from "@/schemas";
import { ICONES } from "./icones";

export const ROTULO: Record<Situacao, { texto: string; tom: "ok" | "alerta" | "neutro"; Icone: typeof Check }> = {
  sim: { texto: "Previsto", tom: "ok", Icone: Check },
  depende: { texto: "Depende", tom: "alerta", Icone: CircleHelp },
  nao: { texto: "Não previsto", tom: "neutro", Icone: Minus },
};

export function EtiquetaSituacao({ s }: { s: Situacao }) {
  const { texto, tom, Icone } = ROTULO[s];
  return (
    <Etiqueta tom={tom}>
      <Icone aria-hidden size={16} />
      {texto}
    </Etiqueta>
  );
}

export type CartaoBloco = {
  letra: string;
  nome: string;
  familia: string;
  tom: number;
  /** posição no leiaute, calculada antes de filtrar */
  posicao: number;
  href: string;
  objetivo: string;
  nota: string;
  celulas: Record<Regime, Situacao>;
};

export function BlocosPorRegime({ blocos, regimes }: { blocos: CartaoBloco[]; regimes: { id: Regime; nome: string }[] }) {
  const [valores, mudar] = useParametros({ regime: "", so: "" }, (lidos) => ({
    regime: regimes.some((r) => r.id === lidos.regime) ? lidos.regime : "",
    so: lidos.so === "previstos" ? "previstos" : "",
  }));
  const regime = regimes.find((r) => r.id === valores.regime)?.id ?? null;
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
            value={regime ?? ""}
            onChange={(e) => mudar({ regime: e.target.value })}
            className="mt-1 min-h-11 rounded-lg border border-controle bg-superficie px-3"
          >
            <option value="">Todos</option>
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
      <p role="status" className="mb-4 text-suave">
        Mostrando {lista.length} de {blocos.length} blocos
      </p>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((b) => {
          const Icone = ICONES[b.letra]!;
          return (
            <li key={b.letra} data-familia={b.familia} data-tom={b.tom} data-bloco={b.letra}>
              <Link
                href={b.href}
                prefetch={false}
                className="bloco flex h-full items-start gap-4 rounded-xl border p-4 text-tinta no-underline transition-transform hover:-translate-y-0.5"
              >
                <Icone aria-hidden className="bloco-icone shrink-0" size={26} />
                <span className="min-w-0">
                  <span className="block font-mono font-semibold">
                    Bloco {b.letra} <span className="text-sm font-medium">· {ordinal(b.posicao)} do arquivo</span>
                  </span>
                  <span className="block font-semibold">{b.nome}</span>
                  <span data-so="iniciante" className="mt-1 block">
                    {b.objetivo}
                  </span>
                  {regime && (
                    <span className="mt-2 block">
                      <EtiquetaSituacao s={b.celulas[regime]} />
                      <span data-so="profissional" className="mt-1 block text-sm">
                        {b.nota}
                      </span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
