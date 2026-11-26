"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { Botao, Cartao } from "@/components/ui";
import { cn } from "@/lib/cn";
import { salvar, usePreferencias } from "@/lib/preferencias";
import type { Regime } from "@/schemas";
import { EtiquetaSituacao, SIGNIFICADO, type CartaoBloco } from "./regimes";

export type PassoBloco = CartaoBloco & { origem: string; erros: { titulo: string; comoEvitar: string }[] };

/** Etapas na ordem do arquivo, só com os blocos previstos ou condicionais do regime. */
export function Roteiro({ blocos, regimes }: { blocos: PassoBloco[]; regimes: { id: Regime; nome: string }[] }) {
  const { roteiro } = usePreferencias();
  const id = useId();
  const titulo = useRef<HTMLHeadingElement>(null);
  const agiu = useRef(false);
  const regime = regimes.find((r) => r.id === roteiro?.regime) ?? null;
  const passos = regime ? blocos.filter((b) => b.celulas[regime.id] !== "nao") : [];
  const i = Math.min(roteiro?.passo ?? 0, Math.max(0, passos.length - 1));
  const atual = passos[i];

  useEffect(() => {
    if (agiu.current) titulo.current?.focus();
  }, [i]);

  const ir = (passo: number) => {
    if (!regime || passo < 0 || passo >= passos.length) return;
    agiu.current = true;
    salvar({ roteiro: { regime: regime.id, passo } });
  };

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        Qual é o regime da empresa?
      </label>
      <select
        id={id}
        value={regime?.id ?? ""}
        onChange={(e) => salvar({ roteiro: e.target.value ? { regime: e.target.value, passo: 0 } : null })}
        className="mt-1 mb-6 min-h-11 rounded-lg border border-controle bg-superficie px-3"
      >
        <option value="">Escolha</option>
        {regimes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nome}
          </option>
        ))}
      </select>
      {!atual || !regime ? (
        <p className="text-suave">Escolha o regime para montar o passo a passo.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <nav aria-label="Etapas do preenchimento">
            <ol className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {passos.map((p, n) => (
                <li key={p.letra}>
                  <button
                    type="button"
                    aria-current={n === i ? "step" : undefined}
                    onClick={() => ir(n)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-superficie",
                      n === i && "bg-marca text-sobre-marca hover:bg-marca",
                    )}
                  >
                    <span className="font-mono text-sm">{n + 1}</span>
                    <span className="font-medium">Bloco {p.letra}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <Cartao data-testid="roteiro">
            {/* No topo, para o botão não mudar de lugar entre uma etapa e outra. */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-sm text-suave">
                Etapa {i + 1} de {passos.length}
              </p>
              <div className="flex flex-wrap gap-3">
                <Botao variante="contorno" disabled={i === 0} className="disabled:opacity-50" onClick={() => ir(i - 1)}>
                  <ArrowLeft aria-hidden size={18} /> Anterior
                </Botao>
                <Botao disabled={i === passos.length - 1} className="disabled:opacity-50" onClick={() => ir(i + 1)}>
                  Próximo <ArrowRight aria-hidden size={18} />
                </Botao>
              </div>
            </div>
            <h2 ref={titulo} tabIndex={-1} className="mt-1 text-2xl font-bold outline-none">
              Bloco {atual.letra}: {atual.nome}
            </h2>
            <p className="mt-3">
              <EtiquetaSituacao s={atual.celulas[regime.id]} />{" "}
              <span className="text-suave">
                ({SIGNIFICADO[atual.celulas[regime.id]]}) {atual.nota}
              </span>
            </p>
            <p className="mt-4 text-lg">{atual.objetivo}</p>
            <h3 className="mt-5 font-semibold">De onde vêm os dados</h3>
            <p>{atual.origem}</p>
            <h3 className="mt-5 font-semibold">Antes de seguir, confira</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {atual.erros.map((e) => (
                <li key={e.titulo}>
                  <strong>{e.titulo}.</strong> {e.comoEvitar}
                </li>
              ))}
            </ul>
            <p className="mt-5">
              <Link href={atual.href} prefetch={false} className="inline-block py-1 underline underline-offset-4">
                Ver registros do bloco {atual.letra}
              </Link>
            </p>
          </Cartao>
        </div>
      )}
    </div>
  );
}
