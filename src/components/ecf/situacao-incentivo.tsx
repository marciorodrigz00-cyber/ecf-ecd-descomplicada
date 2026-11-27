import Link from "next/link";
import { BadgePercent, CircleHelp, Minus, ShieldCheck, TrendingDown, type LucideIcon } from "lucide-react";
import { Etiqueta } from "@/components/ui";
import { ANO_PADRAO } from "@/lib/conteudo";
import { cn } from "@/lib/cn";
import { rota } from "@/lib/rotas";
import type { Incentivo } from "@/schemas";

/** Texto do selo sempre visível; a cor muda também a luminosidade (âmbar, verde, cinza), nunca só o matiz. */
export const SITUACAO: Record<Incentivo["situacao"], { texto: string; tom: "alerta" | "ok" | "neutro"; Icone: LucideIcon; tracejado?: boolean }> = {
  reduzido: { texto: "Reduzido pela LC 224", tom: "alerta", Icone: TrendingDown },
  excetuado: { texto: "Fora da redução", tom: "ok", Icone: ShieldCheck },
  "nao-beneficio": { texto: "Não é benefício", tom: "neutro", Icone: Minus },
  "a-verificar": { texto: "A verificar", tom: "neutro", Icone: CircleHelp, tracejado: true },
};
export function SeloSituacao({ s }: { s: Incentivo["situacao"] }) {
  const { texto, tom, Icone, tracejado } = SITUACAO[s];
  return (
    <Etiqueta tom={tom} data-situacao={s} className={cn(tracejado && "border-dashed border-controle")}>
      <Icone aria-hidden size={16} />
      {texto}
    </Etiqueta>
  );
}

/** Selo nos registros e blocos citados pelas fichas. */
export function IncentivosNoRegistro({ lista, ano }: { lista: Incentivo[]; ano: number }) {
  if (!lista.length) return null;
  return (
    <aside aria-label="Incentivos neste registro" data-testid="incentivos-no-registro" className="max-w-3xl rounded-xl border border-linha bg-superficie p-4">
      <p className="flex items-center gap-2 font-semibold">
        <BadgePercent aria-hidden size={18} className="text-marca" /> Incentivos neste registro
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {lista.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-2">
            <Link href={rota(`/incentivos/${i.id}`, ano, ANO_PADRAO)} prefetch={false} className="inline-flex min-h-6 items-center underline underline-offset-4">
              {i.curto}
            </Link>
            <SeloSituacao s={i.situacao} />
          </li>
        ))}
      </ul>
    </aside>
  );
}
