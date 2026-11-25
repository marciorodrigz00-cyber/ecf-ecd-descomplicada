import Link from "next/link";
import { cn } from "@/lib/cn";
import { rota } from "@/lib/rotas";
import type { Bloco, Familia } from "@/schemas";
import { ICONES } from "./icones";

export const NOME_FAMILIA: Record<Familia, string> = {
  identificacao: "Identificação",
  recuperacao: "Recuperação de dados",
  contabil: "Contábil",
  apuracao: "Apuração",
  internacional: "Operações internacionais",
  informacoes: "Informações",
};

/** Tom dentro da família, pela posição original no leiaute. */
export function tomDoBloco(bloco: Bloco, todos: readonly Bloco[]): number {
  return todos.filter((b) => b.familia === bloco.familia).findIndex((b) => b.letra === bloco.letra);
}

export function GradeBlocos({
  blocos,
  ano,
  padrao,
  compacta = false,
}: {
  blocos: readonly Bloco[];
  ano: number;
  padrao: number;
  compacta?: boolean;
}) {
  return (
    <ol
      className={cn(
        "grid gap-3",
        compacta ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-9" : "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {blocos.map((b) => {
        const Icone = ICONES[b.letra]!;
        return (
          <li key={b.letra} data-familia={b.familia} data-tom={tomDoBloco(b, blocos)}>
            <Link
              href={rota(`/blocos/${b.letra.toLowerCase()}`, ano, padrao)}
              prefetch={false}
              title={compacta ? b.nome : undefined}
              className={cn(
                "bloco flex h-full rounded-xl border text-tinta no-underline transition-transform hover:-translate-y-0.5",
                compacta ? "flex-col items-center justify-center gap-1 p-3" : "items-start gap-4 p-4",
              )}
            >
              <Icone aria-hidden className="bloco-icone shrink-0" size={compacta ? 20 : 26} />
              {compacta ? (
                <span className="font-mono text-xl font-semibold">
                  <span className="sr-only">Bloco </span>
                  {b.letra}
                  <span className="sr-only">: {b.nome}</span>
                </span>
              ) : (
                <span className="min-w-0">
                  <span className="block font-mono font-semibold">Bloco {b.letra}</span>
                  <span className="block">{b.nome}</span>
                  <span className="mt-1 block text-sm">{NOME_FAMILIA[b.familia]}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
