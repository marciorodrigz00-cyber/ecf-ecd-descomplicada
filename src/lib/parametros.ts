"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Valores = Record<string, string>;
/** Avisa que a parte ?… do endereço mudou sem trocar de página. */
export const ENDERECO_MUDOU = "ecf:endereco";

/** Busca do endereço com os valores dados. Valor igual ao padrão não aparece. */
export function buscaCom(atual: string, valores: Valores, padroes: Valores): string {
  const p = new URLSearchParams(atual);
  for (const [nome, v] of Object.entries(valores)) {
    if (v === padroes[nome]) p.delete(nome);
    else p.set(nome, v);
  }
  const texto = p.toString();
  return texto === "" ? "" : `?${texto}`;
}

/** Valores lidos do endereço; o que faltar vira o padrão. */
export function lerBusca(atual: string, padroes: Valores): Valores {
  const p = new URLSearchParams(atual);
  return Object.fromEntries(Object.entries(padroes).map(([nome, padrao]) => [nome, p.get(nome) ?? padrao]));
}

function gravar(valores: Valores, padroes: Valores) {
  const { pathname, search, hash } = window.location;
  const nova = buscaCom(search, valores, padroes);
  if (nova === buscaCom(search, {}, {})) return;
  try {
    // Estado nulo: o Next integra a chamada ao roteador, sem recarregar (Context7, /vercel/next.js).
    window.history.replaceState(null, "", pathname + nova + hash);
  } catch {
    // O navegador limita trocas muito seguidas: a tela segue certa, só o endereço fica para trás.
  }
}

/**
 * Seleção de tela guardada no endereço: sobrevive ao F5 e pode ser compartilhada.
 * O HTML sai com os padrões; o endereço é lido depois de montar. `validar` recebe texto de fora e só devolve valores aceitos.
 */
export function useParametros<C extends string>(padroes: Record<C, string>, validar: (lidos: Record<C, string>) => Record<C, string>) {
  const [valores, setValores] = useState(padroes);
  const fixos = useRef({ padroes, validar });
  const atuais = useRef(valores);
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const reler = () => {
      // Digitação ainda não gravada vale mais que o endereço.
      if (espera.current !== undefined) return;
      const { padroes: p, validar: v } = fixos.current;
      const lidos = v(lerBusca(window.location.search, p) as Record<C, string>);
      if (buscaCom("", lidos, p) === buscaCom("", atuais.current, p)) return;
      atuais.current = lidos;
      setValores(lidos);
    };
    reler();
    window.addEventListener(ENDERECO_MUDOU, reler);
    return () => {
      window.removeEventListener(ENDERECO_MUDOU, reler);
      clearTimeout(espera.current);
    };
  }, []);

  const mudar = useCallback((parte: Partial<Record<C, string>>, atraso = 0) => {
    atuais.current = { ...atuais.current, ...parte };
    setValores(atuais.current);
    clearTimeout(espera.current);
    const agora = () => {
      espera.current = undefined;
      gravar(atuais.current, fixos.current.padroes);
    };
    if (atraso === 0) agora();
    else espera.current = setTimeout(agora, atraso);
  }, []);

  return [valores, mudar] as const;
}
