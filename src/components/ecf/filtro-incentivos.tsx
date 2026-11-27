"use client";

import { useId } from "react";
import { useParametros } from "@/lib/parametros";

export type ItemIncentivo = { id: string; tributos: string[]; regimes: string[]; situacao: string; corpo: React.ReactNode };
type Opcao = { valor: string; texto: string };

/** Filtros do hub de incentivos. Valores fora da lista voltam ao padrão (SG). */
export function FiltroIncentivos({ itens, regimes, situacoes }: { itens: ItemIncentivo[]; regimes: Opcao[]; situacoes: Opcao[] }) {
  const [v, mudar] = useParametros({ tributo: "", regime: "", situacao: "" }, (l) => ({
    tributo: l.tributo === "IRPJ" || l.tributo === "CSLL" ? l.tributo : "",
    regime: regimes.some((r) => r.valor === l.regime) ? l.regime : "",
    situacao: situacoes.some((s) => s.valor === l.situacao) ? l.situacao : "",
  }));
  const id = useId();
  const lista = itens.filter(
    (i) => (!v.tributo || i.tributos.includes(v.tributo)) && (!v.regime || i.regimes.includes(v.regime)) && (!v.situacao || i.situacao === v.situacao),
  );
  const campo = (nome: "tributo" | "regime" | "situacao", rotulo: string, opcoes: Opcao[], todos: string) => (
    <div>
      <label htmlFor={`${id}-${nome}`} className="block text-sm font-medium">
        {rotulo}
      </label>
      <select
        id={`${id}-${nome}`}
        value={v[nome]}
        onChange={(e) => mudar({ [nome]: e.target.value })}
        className="mt-1 min-h-11 rounded-lg border border-controle bg-superficie px-3"
      >
        <option value="">{todos}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        {campo("tributo", "Tributo", [{ valor: "IRPJ", texto: "IRPJ" }, { valor: "CSLL", texto: "CSLL" }], "Todos")}
        {campo("regime", "Regime", regimes, "Todos")}
        {campo("situacao", "Situação na LC 224", situacoes, "Todas")}
      </div>
      <p role="status" className="mt-4 mb-4 text-suave">
        Mostrando {lista.length} de {itens.length} incentivos
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((i) => (
          <li key={i.id} data-incentivo={i.id}>
            {i.corpo}
          </li>
        ))}
      </ul>
      {lista.length === 0 && <p className="text-suave">Nenhum incentivo com esses filtros.</p>}
    </div>
  );
}
