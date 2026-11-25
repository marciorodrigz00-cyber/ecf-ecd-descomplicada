"use client";

import { ArrowLeft, CircleCheck, FileWarning, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { registrarFeito } from "@/components/layout/trilha";
import { Botao, Cartao } from "@/components/ui";
import { avaliar } from "@/lib/quiz";
import type { Quiz as TQuiz } from "@/schemas";

/** bases: base legal já renderizada no servidor, por id de resultado ou complemento. */
export function Quiz({ quiz, bases }: { quiz: TQuiz; bases: Record<string, ReactNode> }) {
  const [respostas, setRespostas] = useState<string[]>([]);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const mudou = useRef(false);
  const nome = useId();
  const estado = avaliar(quiz, respostas);

  useEffect(() => {
    if (mudou.current) titulo.current?.focus();
  }, [respostas]);

  function ir(novas: string[]) {
    mudou.current = true;
    setRespostas(novas);
    setEscolha(null);
    setErro(false);
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (estado.tipo !== "pergunta") return;
    if (!escolha) return setErro(true);
    const novas = [...respostas, escolha];
    if (avaliar(quiz, novas).tipo === "resultado") registrarFeito("quiz");
    ir(novas);
  }

  if (estado.tipo === "resultado") {
    const { resultado, complementos } = estado;
    const obrigada = resultado.situacao === "obrigada";
    const Icone = obrigada ? FileWarning : CircleCheck;
    return (
      <Cartao data-testid="quiz-resultado" data-resultado={resultado.id}>
        <Icone aria-hidden size={36} className={obrigada ? "text-alerta" : "text-ok"} />
        <h2 ref={titulo} tabIndex={-1} className="mt-3 text-2xl font-bold outline-none">
          {resultado.titulo}
        </h2>
        <div className="mt-3 max-w-prose text-lg">
          <p data-so="iniciante">{resultado.iniciante}</p>
          <p data-so="profissional">{resultado.profissional}</p>
        </div>
        <h3 className="mt-6 text-lg font-semibold">Por quê</h3>
        {bases[resultado.id]}
        {complementos.length > 0 && (
          <>
            <h3 className="mt-6 text-lg font-semibold">No seu caso, atenção também a</h3>
            <ul className="mt-2 space-y-4">
              {complementos.map((c) => (
                <li key={c.id} data-complemento={c.id}>
                  <p>{c.texto}</p>
                  {bases[c.id]}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Botao variante="contorno" onClick={() => ir(respostas.slice(0, -1))}>
            <ArrowLeft aria-hidden size={18} /> Voltar uma pergunta
          </Botao>
          <Botao variante="contorno" onClick={() => ir([])}>
            <RotateCcw aria-hidden size={18} /> Refazer
          </Botao>
        </div>
      </Cartao>
    );
  }

  const { pergunta, passo } = estado;
  return (
    <Cartao>
      <form onSubmit={enviar} noValidate>
        <p className="font-mono text-sm text-suave">Pergunta {passo}</p>
        <h2 ref={titulo} tabIndex={-1} id={`${nome}-t`} className="mt-1 text-2xl font-bold outline-none">
          {pergunta.texto}
        </h2>
        <p id={`${nome}-a`} className="mt-2 max-w-prose text-suave">
          {pergunta.ajuda}
        </p>
        <div
          key={pergunta.id}
          role="radiogroup"
          aria-labelledby={`${nome}-t`}
          aria-describedby={erro ? `${nome}-a ${nome}-e` : `${nome}-a`}
          aria-invalid={erro}
          aria-required
          className="mt-5 grid gap-3"
        >
          {pergunta.opcoes.map((o) => (
            <label
              key={o.id}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-controle px-4 py-2 has-checked:border-marca has-checked:bg-fundo has-checked:font-semibold has-focus-visible:outline-3 has-focus-visible:outline-marca"
            >
              <input
                type="radio"
                name={`${nome}-${pergunta.id}`}
                value={o.id}
                checked={escolha === o.id}
                onChange={() => {
                  setEscolha(o.id);
                  setErro(false);
                }}
                className="size-5 shrink-0 accent-marca outline-none"
              />
              {o.texto}
            </label>
          ))}
        </div>
        <p id={`${nome}-e`} role="alert" className="mt-3 min-h-6 font-semibold text-alerta">
          {erro && "Escolha uma opção para continuar."}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Botao
            type="submit"
            onClick={(e) => {
              // Segundo clique de um duplo clique não pode agir sobre a pergunta seguinte.
              if (e.detail > 1) e.preventDefault();
            }}
          >
            Continuar
          </Botao>
          {respostas.length > 0 && (
            <Botao variante="contorno" onClick={() => ir(respostas.slice(0, -1))}>
              <ArrowLeft aria-hidden size={18} /> Voltar
            </Botao>
          )}
        </div>
      </form>
    </Cartao>
  );
}
