"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Estado = "parado" | "copiado" | "manual";

/**
 * Copia um texto. Avisa “copiado” na tela e para o leitor de tela; se o navegador não deixar,
 * mostra o texto selecionado para copiar à mão.
 * `link`: o texto é um caminho do site, e vira endereço completo na hora de copiar.
 */
export function BotaoCopiar({ texto, rotulo, link = false, curto = false, className }: { texto: string; rotulo: string; link?: boolean; curto?: boolean; className?: string }) {
  const [estado, setEstado] = useState<Estado>("parado");
  const campo = useRef<HTMLInputElement>(null);
  const valor = () => (link ? new URL(texto, window.location.href).href : texto);

  useEffect(() => {
    if (estado !== "copiado") return;
    const t = setTimeout(() => setEstado("parado"), 2500);
    return () => clearTimeout(t);
  }, [estado]);
  useEffect(() => {
    if (estado === "manual") campo.current?.select();
  }, [estado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor());
      setEstado("copiado");
    } catch {
      setEstado("manual");
    }
  }

  const Icone = estado === "copiado" ? Check : link ? Link2 : Copy;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={copiar}
        aria-label={curto ? rotulo : undefined}
        title={curto ? rotulo : undefined}
        className={cn(
          "inline-flex min-h-6 min-w-6 items-center justify-center gap-1.5 rounded-md border border-controle bg-superficie text-sm font-medium hover:border-marca",
          curto ? "size-8" : "min-h-9 px-3",
        )}
      >
        <Icone aria-hidden size={16} />
        {!curto && rotulo}
      </button>
      <span role="status" className="text-sm text-ok">
        {estado === "copiado" ? (link ? "Link copiado" : "Copiado") : ""}
      </span>
      {estado === "manual" && (
        <input
          ref={campo}
          readOnly
          value={valor()}
          aria-label="Copie este texto"
          className="min-w-0 rounded border border-controle bg-fundo px-2 py-1 font-mono text-sm"
          onBlur={() => setEstado("parado")}
        />
      )}
    </span>
  );
}
