"use client";

import { Fragment, useRef, useState, type KeyboardEvent } from "react";
import type { ParteExemplo } from "@/lib/exemplos/por-registro";

/**
 * A linha do exemplo com cada campo clicável. Ao lado, o que o campo é: valor, formato, leitura do Manual e regras.
 * Sem tempo nem animação: serve a quem explora campo a campo e a quem procura um campo só.
 */
export function LinhaExplicada({ partes, rotulo }: { partes: ParteExemplo[]; rotulo: string }) {
  // Começa no primeiro campo preenchido depois do REG: é o que mais ensina.
  const inicial = Math.max(0, partes.findIndex((p, i) => i > 0 && p.valor !== ""));
  const [sel, setSel] = useState(inicial);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const p = partes[sel]!;

  const teclar = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const destino = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? partes.length - 1 : null;
    if (destino === null || destino < 0 || destino >= partes.length) return;
    e.preventDefault();
    setSel(destino);
    botoes.current[destino]?.focus();
  };

  return (
    <div data-testid="linha-explicada">
      <p className="mb-2 text-sm text-suave">Toque num campo da linha para ver o que ele é. No teclado, as setas andam entre os campos.</p>
      <div role="group" aria-label={`Campos da linha: ${rotulo}`} className="rounded-lg bg-fundo p-3 font-mono text-sm leading-8 break-all">
        |
        {partes.map((x, i) => (
          <Fragment key={`${x.nome}-${i}`}>
            <button
              ref={(el) => {
                botoes.current[i] = el;
              }}
              type="button"
              aria-pressed={i === sel}
              aria-label={`Campo ${i + 1}, ${x.nome}: ${x.valor === "" ? "vazio" : x.valor}`}
              tabIndex={i === sel ? 0 : -1}
              onClick={() => setSel(i)}
              onKeyDown={(e) => teclar(e, i)}
              className="inline-block min-h-6 min-w-6 max-w-full rounded px-0.5 text-marca underline decoration-dotted underline-offset-4 hover:bg-superficie aria-pressed:bg-marca aria-pressed:text-sobre-marca aria-pressed:no-underline"
            >
              {x.valor === "" ? <span aria-hidden>·</span> : x.valor}
            </button>
            |
          </Fragment>
        ))}
      </div>
      {partes.some((x) => x.valor === "") && <p className="mt-1 text-xs text-suave">· campo vazio neste exemplo</p>}

      <div aria-live="polite" data-testid="linha-campo" className="mt-3 rounded-lg border border-marca p-3">
        <p className="font-mono font-semibold break-all">
          Campo {sel + 1} de {partes.length}: {p.nome}
        </p>
        <p className="mt-2 rounded bg-fundo px-3 py-2 font-mono break-all">{p.valor === "" ? <span className="text-suave">(vazio neste exemplo)</span> : p.valor}</p>
        <p className="mt-2 text-sm text-suave">
          {p.tipo === "N" || p.tipo === "NS" ? "Numérico" : "Texto"}
          {/^\d+$/.test(p.tamanho) ? `, até ${p.tamanho} ${p.tamanho === "1" ? "caractere" : "caracteres"}` : ""} · {p.obrigatorio === "Sim" ? "obrigatório" : "não obrigatório"}
        </p>
        {p.valores && <p className="mt-1 text-sm break-words text-suave">Valores válidos: {p.valores}</p>}
        <p className="mt-2 text-sm break-words whitespace-pre-line">{p.leitura ?? p.descricao}</p>
        {sel === 0 && <p className="mt-2 text-sm text-suave">Texto fixo: o código do registro abre toda linha.</p>}
        {p.regras.length > 0 && (
          <p className="mt-2 text-sm">
            Regras do Manual para este campo: <span className="font-mono break-all">{p.regras.join(", ")}</span>
          </p>
        )}
      </div>
    </div>
  );
}
