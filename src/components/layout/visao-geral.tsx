"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useSyncExternalStore } from "react";
import { usePreferencias } from "@/lib/preferencias";
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

/** Card "Próxima entrega": qual ECF vem a seguir e o prazo, pela data de hoje de quem lê. */
export function CartaoEntrega({ prazos, ano, regraGeral, children }: { prazos: Prazo[]; ano: number; regraGeral: string; children: React.ReactNode }) {
  const hoje = useHoje();
  const s = hoje ? situacaoDoPrazo(prazos, ano, hoje) : null;
  return (
    <section aria-labelledby="t-entrega" data-testid="contagem-prazo" className="flex flex-col rounded-xl border border-linha bg-superficie p-6">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-suave uppercase">
        <CalendarDays aria-hidden size={16} strokeWidth={1.5} className="text-marca" /> Próxima entrega
      </p>
      <h2 id="t-entrega" className="mt-3 text-2xl font-semibold">
        {s ? `ECF ${s.ac + 1} · ano-calendário ${s.ac}` : "Prazo da ECF"}
      </h2>
      <p className="mt-2 text-suave">
        {s?.tipo === "contagem" ? (
          <>
            Prazo: {data(s.data)} · {s.dias === 0 ? "é hoje" : `faltam ${s.dias} ${s.dias === 1 ? "dia" : "dias"}`}.
          </>
        ) : s?.tipo === "a-confirmar" ? (
          <>
            Prazo pela regra geral: {regraGeral.charAt(0).toLowerCase() + regraGeral.slice(1)} ({s.ac + 1}), a confirmar em norma.
          </>
        ) : (
          <>&nbsp;</>
        )}
      </p>
      <div className="mt-auto border-t border-linha pt-4 text-sm text-suave">{children}</div>
    </section>
  );
}

export function NovidadesRecentes({ datas }: { datas: string[] }) {
  const hoje = useHoje();
  return <>{hoje ? recentes(datas, hoje) : "—"}</>;
}

/** Aviso que só aparece para quem marcou o regime no perfil (etapa 4: lucro presumido e a LC 224). */
export function AvisoDoRegime({ regime, titulo, texto, href, rotulo }: { regime: string; titulo: string; texto: string; href: string; rotulo: string }) {
  const { regime: doPerfil } = usePreferencias();
  if (doPerfil !== regime) return null;
  return (
    <aside aria-label={titulo} data-testid="aviso-regime" className="rounded-xl border border-alerta bg-alerta-fundo px-5 py-4 text-alerta">
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 max-w-prose">
        {texto}{" "}
        <Link href={href} prefetch={false} className="inline-flex min-h-6 items-center font-semibold underline underline-offset-4">
          {rotulo}
        </Link>
      </p>
    </aside>
  );
}
