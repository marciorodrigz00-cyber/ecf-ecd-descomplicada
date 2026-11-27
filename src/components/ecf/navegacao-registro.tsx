"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";

/** Telas menores: seletor com os registros do bloco. Escolher leva à página. */
export function SeletorRegistro({ atual, opcoes }: { atual: string; opcoes: { codigo: string; nome: string; href: string }[] }) {
  const router = useRouter();
  const id = useId();
  return (
    <div className="xl:hidden">
      <label htmlFor={id} className="block text-sm font-medium">
        Ir para o registro
      </label>
      <select
        id={id}
        value={atual}
        onChange={(e) => {
          const destino = opcoes.find((o) => o.codigo === e.target.value);
          if (destino) router.push(destino.href);
        }}
        className="mt-1 min-h-11 w-full max-w-md rounded-lg border border-controle bg-superficie px-3"
      >
        {opcoes.map((o) => (
          <option key={o.codigo} value={o.codigo}>
            {o.codigo}: {o.nome}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Links antigos (#campo-2) passam para a âncora pelo nome (#cod-scp), sem recarregar. */
export function RedirecionarAncora({ mapa }: { mapa: Record<string, string> }) {
  useEffect(() => {
    const trocar = () => {
      const antiga = /^#(campo-\d+)$/.exec(window.location.hash)?.[1];
      const nova = antiga ? mapa[antiga] : undefined;
      if (!nova) return;
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${nova}`);
      document.getElementById(nova)?.scrollIntoView();
      // :target só se atualiza com navegação de verdade; a marcação de realce vai por atributo.
      document.getElementById(nova)?.setAttribute("data-alvo", "");
    };
    trocar();
    // Link antigo clicado na própria página: só a âncora muda.
    window.addEventListener("hashchange", trocar);
    return () => window.removeEventListener("hashchange", trocar);
  }, [mapa]);
  return null;
}
