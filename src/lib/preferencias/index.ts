"use client";

import { useSyncExternalStore } from "react";
import { CHAVE, PADRAO, interpretar, type Preferencias } from "./modelo";

const EVENTO = "ecf:preferencias";
let cru: string | null = null;
let atual: Preferencias = PADRAO;
let soMemoria = false;

function lerCru(): string | null {
  if (soMemoria) return cru;
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return cru; // armazenamento bloqueado: vale a memória desta aba
  }
}

function instantaneo(): Preferencias {
  const novo = lerCru();
  if (novo !== cru) {
    cru = novo;
    atual = interpretar(novo);
  }
  return atual;
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

export function usePreferencias(): Preferencias {
  return useSyncExternalStore(assinar, instantaneo, () => PADRAO);
}

export function preferenciasAgora(): Preferencias {
  return instantaneo();
}

export function salvar(mudanca: Partial<Preferencias>) {
  const proxima = { ...instantaneo(), ...mudanca };
  const serial = JSON.stringify(proxima);
  try {
    localStorage.setItem(CHAVE, serial);
  } catch {
    soMemoria = true; // Sem armazenamento, a preferência vale só nesta visita.
  }
  cru = serial;
  atual = proxima;
  const html = document.documentElement;
  html.dataset.nivel = proxima.nivel;
  if (proxima.tema) html.dataset.theme = proxima.tema;
  window.dispatchEvent(new Event(EVENTO));
}

export type { Preferencias };
