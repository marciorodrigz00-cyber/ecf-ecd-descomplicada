"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePreferencias } from "@/lib/preferencias";

type Props = { children: string; iniciante: string; profissional: string };
const LARGURA = 288;
type Posicao = { left: number; top?: number; bottom?: number };

function calcular(b: HTMLElement): Posicao {
  const r = b.getBoundingClientRect();
  const largura = Math.min(LARGURA, window.innerWidth - 16);
  const left = Math.max(8, Math.min(r.left, window.innerWidth - largura - 8));
  return r.bottom > window.innerHeight * 0.65 ? { left, bottom: window.innerHeight - r.top } : { left, top: r.bottom };
}

/** Termo técnico com dica. Aparece no foco, no mouse e no toque; Esc fecha; a dica pode receber o mouse. */
export function Termo({ children, iniciante, profissional }: Props) {
  const { nivel } = usePreferencias();
  const id = useId();
  const botao = useRef<HTMLButtonElement>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<Posicao | null>(null);

  function abrir() {
    if (espera.current) clearTimeout(espera.current);
    setPos(calcular(botao.current!));
  }
  // Uma folga para o mouse ir do termo à dica.
  function sair() {
    espera.current = setTimeout(() => setPos(null), 150);
  }

  useEffect(() => {
    if (!pos) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setPos(null);
    // Acompanha a rolagem: chegar ao termo por teclado também rola a página. Fora da tela, fecha.
    const rolar = () => {
      const r = botao.current!.getBoundingClientRect();
      setPos(r.bottom < 0 || r.top > window.innerHeight ? null : calcular(botao.current!));
    };
    const fora = (e: PointerEvent) => {
      if (!botao.current?.parentElement?.contains(e.target as Node)) setPos(null);
    };
    window.addEventListener("keydown", tecla);
    window.addEventListener("scroll", rolar, true);
    window.addEventListener("pointerdown", fora);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", rolar, true);
      window.removeEventListener("pointerdown", fora);
    };
  }, [pos]);
  useEffect(
    () => () => {
      if (espera.current) clearTimeout(espera.current);
    },
    [],
  );

  return (
    <span className="inline" onPointerEnter={(e) => e.pointerType === "mouse" && abrir()} onPointerLeave={(e) => e.pointerType === "mouse" && sair()}>
      <button
        ref={botao}
        type="button"
        data-termo=""
        aria-describedby={id}
        onFocus={abrir}
        onBlur={sair}
        onClick={abrir}
        className="inline cursor-help py-0.5 underline decoration-marca decoration-dotted decoration-2 underline-offset-4"
      >
        {children}
      </button>
      {/* Sempre no HTML: o leitor de tela lê a descrição ao focar o termo. */}
      <span
        id={id}
        role="tooltip"
        hidden={!pos}
        style={pos ? { ...pos, width: `min(${LARGURA}px, calc(100vw - 16px))` } : undefined}
        className="fixed z-40 rounded-xl border border-marca bg-superficie p-3 text-left text-sm font-normal text-tinta shadow-lg"
      >
        {nivel === "profissional" ? profissional : iniciante}
      </span>
    </span>
  );
}
