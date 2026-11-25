"use client";

import { useState, type ReactNode } from "react";
import { normalizar } from "@/lib/busca";

type Item = { id: string; letra: string; chave: string; corpo: ReactNode };

/** Filtro do glossário. Sem JavaScript, todos os termos aparecem. Esconder não desmonta: os links #termo seguem valendo. */
export function FiltroGlossario({ itens }: { itens: Item[] }) {
  const [texto, setTexto] = useState("");
  const q = normalizar(texto);
  const visiveis = new Set(itens.filter((i) => i.chave.includes(q)).map((i) => i.id));
  const letras = [...new Set(itens.map((i) => i.letra))];
  return (
    <div>
      <label className="block font-medium" htmlFor="filtro-glossario">
        Filtrar termos
      </label>
      <input
        id="filtro-glossario"
        type="search"
        autoComplete="off"
        maxLength={60}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="mt-1 min-h-11 w-full max-w-md rounded-lg border border-controle bg-superficie px-3"
      />
      <p role="status" className="mt-3 text-suave">
        {visiveis.size === 0 ? `Nenhum resultado para '${texto.trim()}'` : `Mostrando ${visiveis.size} de ${itens.length} termos`}
      </p>
      <nav aria-label="Letras do glossário" className="mt-3 flex flex-wrap gap-2">
        {letras.map((l) => {
          const alvo = itens.find((i) => i.letra === l && visiveis.has(i.id));
          return alvo ? (
            <a key={l} href={`#${alvo.id}`} className="grid size-10 place-items-center rounded-lg border border-controle bg-superficie font-mono font-semibold text-tinta no-underline hover:border-marca">
              {l}
            </a>
          ) : (
            <span key={l} aria-hidden className="grid size-10 place-items-center rounded-lg border border-linha font-mono text-suave">
              {l}
            </span>
          );
        })}
      </nav>
      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {itens.map((i) => (
          <li key={i.id} id={i.id} hidden={!visiveis.has(i.id)} className="scroll-mt-6 rounded-2xl target:ring-2 target:ring-marca">
            {i.corpo}
          </li>
        ))}
      </ul>
    </div>
  );
}
