"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Opcao = { valor: string; texto: string };
export type ItemFiltravel = { id: string; tipo: string; leiautes: string[]; corpo: React.ReactNode };

/** Filtro do feed. Sem JavaScript, todos os itens ficam visíveis. */
export function FiltroNovidades({ itens, tipos, leiaute }: { itens: ItemFiltravel[]; tipos: Opcao[]; leiaute: string }) {
  const [tipo, setTipo] = useState("");
  const [soLeiaute, setSoLeiaute] = useState(false);
  const visiveis = itens.filter((i) => (tipo === "" || i.tipo === tipo) && (!soLeiaute || i.leiautes.includes(leiaute)));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por tipo">
        {[{ valor: "", texto: "Tudo" }, ...tipos].map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={tipo === o.valor}
            onClick={() => setTipo(o.valor)}
            className={cn(
              "min-h-11 rounded-lg border border-controle px-4",
              tipo === o.valor ? "bg-marca font-semibold text-sobre-marca" : "bg-superficie text-tinta hover:bg-fundo",
            )}
          >
            {o.texto}
          </button>
        ))}
        <label className="ml-1 flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={soLeiaute} onChange={(e) => setSoLeiaute(e.target.checked)} className="size-5 accent-marca" />
          Só as que valem para o leiaute {leiaute}
        </label>
      </div>
      <p role="status" className="mt-4 text-suave">
        {visiveis.length === 0 ? "Nenhuma novidade com esse filtro." : `Mostrando ${visiveis.length} de ${itens.length}.`}
      </p>
      <ol className="mt-4 grid gap-4">
        {visiveis.map((i) => (
          <li key={i.id}>{i.corpo}</li>
        ))}
      </ol>
    </div>
  );
}
