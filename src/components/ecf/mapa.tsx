"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type NoMapa = { id: string; nome: string; href: string | null; familia: string | null };
export type ArestaMapa = { de: string; para: string; o: string; base: string; href: string };

/** Posições do desenho (viewBox). Só apresentação: as ligações vêm de content/grafo.json. */
const POS: Record<string, [number, number]> = {
  ECD: [60, 70], ECFA: [60, 170], "0": [60, 390],
  C: [230, 70], E: [230, 170],
  J: [400, 70], K: [400, 170],
  L: [570, 70], P: [570, 270], U: [570, 330], Q: [570, 390], T: [570, 450],
  M: [740, 170], X: [740, 330], V: [740, 390], W: [740, 450],
  Y: [910, 70], N: [910, 170], "9": [910, 450],
};
const [W, H] = [110, 46];

function traco([x1, y1]: [number, number], [x2, y2]: [number, number]): string {
  if (x1 === x2) return `M${x1} ${y1 + (y2 > y1 ? H / 2 : -H / 2)}L${x2} ${y2 + (y2 > y1 ? -H / 2 : H / 2)}`;
  // Mesma linha e longe: passa por baixo dos blocos do meio.
  if (y1 === y2 && x2 - x1 > 400) {
    const y = y1 + H / 2;
    return `M${x1} ${y}C${x1 + 60} ${y + 42} ${x2 - 60} ${y + 42} ${x2} ${y}`;
  }
  const [a, b] = [x1 + W / 2, x2 - W / 2];
  const meio = (a + b) / 2;
  return `M${a} ${y1}C${meio} ${y1} ${meio} ${y2} ${b} ${y2}`;
}
export function MapaBlocos({ nos, arestas, inicial = "M" }: { nos: NoMapa[]; arestas: ArestaMapa[]; inicial?: string }) {
  const [sel, setSel] = useState(inicial);
  const nome = (id: string) => nos.find((n) => n.id === id)!.nome;
  const atual = nos.find((n) => n.id === sel)!;
  const entra = arestas.filter((a) => a.para === sel);
  const sai = arestas.filter((a) => a.de === sel);
  const ligado = (id: string) => id === sel || entra.some((a) => a.de === id) || sai.some((a) => a.para === id);
  return (
    <div className="rounded-2xl border border-linha bg-superficie p-4 sm:p-6">
      <div role="group" aria-label="Escolha um bloco para ver as ligações" className="flex flex-wrap gap-2">
        {nos.map((n) => (
          <button
            key={n.id}
            type="button"
            aria-pressed={n.id === sel}
            aria-label={n.nome}
            onClick={() => setSel(n.id)}
            className={cn(
              "min-h-10 min-w-10 rounded-lg border border-controle px-3 font-mono font-semibold",
              n.id === sel ? "border-marca bg-marca text-sobre-marca" : "bg-superficie",
            )}
          >
            {n.id === "ECFA" ? n.nome : n.id}
          </button>
        ))}
      </div>

      <svg viewBox="0 30 980 450" aria-hidden className="mt-5 hidden w-full md:block">
        <defs>
          <marker id="seta" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L8 4L0 8z" className="fill-controle" />
          </marker>
          <marker id="seta-forte" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0L8 4L0 8z" className="fill-marca" />
          </marker>
        </defs>
        {arestas.map((a) => {
          const forte = a.de === sel || a.para === sel;
          if (a.de === "0" && !forte) return null;
          return (
            <path
              key={`${a.de}-${a.para}-${a.o}`}
              d={traco(POS[a.de]!, POS[a.para]!)}
              fill="none"
              strokeWidth={forte ? 3 : 1.5}
              markerEnd={forte ? "url(#seta-forte)" : "url(#seta)"}
              className={forte ? "stroke-marca" : "stroke-controle"}
            />
          );
        })}
        {nos.map((n) => {
          const [x, y] = POS[n.id]!;
          return (
            <g key={n.id} data-familia={n.familia ?? undefined} onClick={() => setSel(n.id)} className="cursor-pointer">
              <rect
                x={x - W / 2}
                y={y - H / 2}
                width={W}
                height={H}
                rx={12}
                strokeWidth={n.id === sel ? 4 : ligado(n.id) ? 3 : 1.5}
                className={cn("fill-superficie", ligado(n.id) ? "stroke-marca" : "stroke-controle")}
              />
              <text x={x} y={y + 7} textAnchor="middle" fontSize={19} fontWeight={600} className="fill-tinta font-mono">
                {n.id === "ECFA" ? "ECF ant." : n.id}
              </text>
            </g>
          );
        })}
      </svg>

      <div aria-live="polite" data-testid="mapa-painel" className="mt-5">
        <h3 className="text-xl font-bold">
          {atual.href ? (
            <Link href={atual.href} prefetch={false} className="inline-block py-1 underline underline-offset-4">
              {atual.nome}
            </Link>
          ) : (
            atual.nome
          )}
        </h3>
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          <Lista titulo="Recebe" vazio="Não recebe dados de outro bloco." itens={entra.map((a) => ({ ...a, outro: nome(a.de) }))} />
          <Lista titulo="Envia" vazio="Não envia dados para outro bloco." itens={sai.map((a) => ({ ...a, outro: nome(a.para) }))} />
        </div>
      </div>
    </div>
  );
}

function Lista({ titulo, vazio, itens }: { titulo: string; vazio: string; itens: (ArestaMapa & { outro: string })[] }) {
  return (
    <div>
      <h4 className="font-semibold">{titulo}</h4>
      {itens.length === 0 ? (
        <p className="text-suave">{vazio}</p>
      ) : (
        <ul className="mt-1 space-y-2">
          {itens.map((a) => (
            <li key={`${a.de}-${a.para}-${a.o}`}>
              <span className="font-medium">{a.outro}:</span> {a.o}.{" "}
              <Link href={a.href} prefetch={false} className="inline-block py-0.5 text-sm text-suave underline underline-offset-4">
                {a.base}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
