"use client";

import { useSyncExternalStore } from "react";
import { data } from "@/lib/formatos";
import { recentes, situacaoDoPrazo, type Prazo } from "@/lib/prazo";

/** Data de hoje no fuso de quem lê. No HTML gerado não há data: o número só aparece no navegador. */
function useHoje(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },
    () => null,
  );
}

export function ContagemPrazo({ prazos, ano }: { prazos: Prazo[]; ano: number }) {
  const hoje = useHoje();
  const s = hoje ? situacaoDoPrazo(prazos, ano, hoje) : null;
  return (
    <div data-testid="contagem-prazo" className="flex min-h-20 items-end gap-4">
      {s?.tipo === "contagem" ? (
        <>
          <span className="font-mono text-6xl leading-none font-semibold text-marca sm:text-7xl">{s.dias}</span>
          <span className="pb-1 leading-tight">
            {s.dias === 1 ? "dia" : "dias"} para o prazo
            <br />
            da ECF do AC {s.ac} ({data(s.data)})
          </span>
        </>
      ) : s?.tipo === "a-confirmar" ? (
        <span className="leading-tight">
          <span className="block font-mono text-3xl font-semibold text-marca sm:text-4xl">AC {s.ac}</span>
          Próximo prazo a confirmar quando sair a norma
        </span>
      ) : (
        <span className="pb-1 text-suave">Prazo da ECF</span>
      )}
    </div>
  );
}

export function NovidadesRecentes({ datas }: { datas: string[] }) {
  const hoje = useHoje();
  return <>{hoje ? recentes(datas, hoje) : "—"}</>;
}
