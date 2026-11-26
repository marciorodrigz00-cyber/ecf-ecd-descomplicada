"use client";

import { Play } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { Botao } from "@/components/ui";
import type { Simulacao } from "@/lib/simulacao/montar";

// Só baixado no clique: quem não abre a simulação não paga por ela.
const Player = lazy(() => import("./player"));

type Estado = { tipo: "parado" } | { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; dados: Simulacao };

/** Botão “Ver animado” da seção “Veja o preenchimento”: busca o roteiro e o player só quando a pessoa pede. */
export function SecaoSimulacao({ codigo, url }: { codigo: string; url: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });
  async function iniciar() {
    if (estado.tipo === "carregando") return;
    setEstado({ tipo: "carregando" });
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      setEstado({ tipo: "pronto", dados: (await r.json()) as Simulacao });
    } catch {
      setEstado({ tipo: "erro" });
    }
  }
  if (estado.tipo === "pronto") {
    return (
      <Suspense fallback={<p role="status">Carregando a simulação…</p>}>
        <Player sim={estado.dados} />
      </Suspense>
    );
  }
  return (
    <div className="rounded-xl border border-linha bg-superficie p-4">
      <p className="max-w-prose text-suave">
        Versão animada, com uma empresa de exemplo: a decisão de gerar o {codigo}, cada campo, a linha montada, as regras que o
        programa confere e um erro proposital. Você pode pausar e andar passo a passo.
      </p>
      <Botao type="button" onClick={iniciar} disabled={estado.tipo === "carregando"} className="mt-3">
        <Play aria-hidden size={18} /> {estado.tipo === "carregando" ? "Carregando…" : "Ver animado"}
      </Botao>
      {estado.tipo === "erro" && (
        <p role="alert" className="mt-3 text-alerta">
          Não foi possível carregar a simulação. Confira a conexão e tente de novo.
        </p>
      )}
    </div>
  );
}
