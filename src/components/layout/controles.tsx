"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { salvar, usePreferencias } from "@/lib/preferencias";
import { anoDaUrl, caminhoBase, rotaEmOutroAno, type Ausentes } from "@/lib/rotas";

export function SeletorNivel() {
  const { nivel } = usePreferencias();
  const nome = useId();
  const opcoes = [
    ["iniciante", "Estou começando"],
    ["profissional", "Já conheço"],
  ] as const;
  return (
    <fieldset className="flex min-w-0 rounded-lg border border-controle bg-superficie p-0.5 text-sm">
      <legend className="sr-only">Nível do conteúdo</legend>
      {opcoes.map(([valor, rotulo]) => (
        <label
          key={valor}
          className="flex min-h-9 items-center rounded-md px-3 font-medium has-checked:bg-marca has-checked:text-sobre-marca has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-marca"
        >
          <input
            type="radio"
            className="sr-only"
            name={nome}
            value={valor}
            checked={nivel === valor}
            onChange={() => salvar({ nivel: valor })}
          />
          {rotulo}
        </label>
      ))}
    </fieldset>
  );
}

/** Cada ano é um endereço: por isso são links, e não um campo. */
export function SeletorAno({ anos, padrao, ausentes, rotulo = "Ano-calendário" }: { anos: number[]; padrao: number; ausentes: Ausentes; rotulo?: string }) {
  const pathname = usePathname();
  const atual = anoDaUrl(pathname, padrao);
  return (
    <div role="group" aria-label={rotulo} className="flex items-center gap-2 text-sm">
      <span aria-hidden className="text-suave">
        Ano-calendário
      </span>
      {[...anos].sort().map((a) => (
        <Link
          key={a}
          href={rotaEmOutroAno(caminhoBase(pathname), a, padrao, ausentes)}
          prefetch={false}
          aria-current={a === atual ? "true" : undefined}
          onClick={() => salvar({ ano: a })}
          className={cn(
            "flex min-h-10 items-center rounded-lg border px-3 font-mono font-semibold no-underline",
            a === atual ? "border-marca bg-marca text-sobre-marca" : "border-controle bg-superficie text-tinta hover:border-marca",
          )}
        >
          {a}
        </Link>
      ))}
    </div>
  );
}

export function BotaoTema() {
  return (
    <button
      type="button"
      aria-label="Alternar entre tema claro e escuro"
      className="grid size-10 place-items-center rounded-lg border border-controle bg-superficie"
      onClick={() =>
        salvar({ tema: document.documentElement.dataset.theme === "dark" ? "light" : "dark" })
      }
    >
      <Moon aria-hidden size={18} className="dark:hidden" />
      <Sun aria-hidden size={18} className="hidden dark:block" />
    </button>
  );
}
