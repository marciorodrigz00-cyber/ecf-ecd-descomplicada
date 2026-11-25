"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Botao, Cartao } from "@/components/ui";

export type ItemTempo = { id: string; quando: string; titulo: string; corpo: ReactNode };

/** Lista de botões + painel. Sem animação automática: só anda quando a pessoa pede. */
export function LinhaDoTempo({ itens }: { itens: ItemTempo[] }) {
  const [i, setI] = useState(0);
  const atual = itens[i]!;
  const mover = (d: number) => setI((x) => Math.min(itens.length - 1, Math.max(0, x + d)));
  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
      <ol aria-label="Linha do tempo" className="grid content-start gap-1 border-l-3 border-linha pl-3 sm:grid-cols-2 lg:grid-cols-1">
        {itens.map((x, n) => (
          <li key={x.id}>
            <button
              type="button"
              aria-current={n === i ? "step" : undefined}
              onClick={() => setI(n)}
              className={cn(
                "flex min-h-11 w-full items-baseline gap-3 rounded-lg px-3 py-2 text-left hover:bg-superficie",
                n === i && "bg-marca text-sobre-marca hover:bg-marca",
              )}
            >
              <span className="shrink-0 font-mono text-sm">{x.quando}</span>
              <span className="font-medium">{x.titulo}</span>
            </button>
          </li>
        ))}
      </ol>
      <Cartao className="flex flex-col">
        <div aria-live="polite" data-testid="tempo-painel">
          <p className="font-mono text-suave">{atual.quando}</p>
          <h3 className="mt-1 text-2xl font-bold">{atual.titulo}</h3>
          {atual.corpo}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <Botao variante="contorno" disabled={i === 0} className="disabled:opacity-50" onClick={() => mover(-1)}>
            <ArrowLeft aria-hidden size={18} /> Anterior
          </Botao>
          <Botao
            variante="contorno"
            disabled={i === itens.length - 1}
            className="disabled:opacity-50"
            onClick={() => mover(1)}
          >
            Próximo <ArrowRight aria-hidden size={18} />
          </Botao>
        </div>
      </Cartao>
    </div>
  );
}
