"use client";

import { Trophy, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Botao } from "@/components/ui";
import { salvar, usePreferencias } from "@/lib/preferencias";
import { REGIMES_PERFIL, type RegimePerfil } from "@/lib/preferencias/modelo";
import { cn } from "@/lib/cn";
import { anoDaUrl, rota, type Ausentes } from "@/lib/rotas";
import { SeletorAno, SeletorNivel } from "./controles";

export type RegimeNome = { id: string; nome: string };
type Props = { anos: number[]; padrao: number; ausentes: Ausentes; regimes: RegimeNome[] };

const ehRegime = (x: string): x is RegimePerfil => (REGIMES_PERFIL as readonly string[]).includes(x);

/** Regime do perfil. Grava na hora, como o seletor de nível. */
function SeletorRegime({ regimes }: { regimes: RegimeNome[] }) {
  const { regime } = usePreferencias();
  const nome = useId();
  const opcoes = [...regimes.filter((r) => ehRegime(r.id)), { id: "", nome: "Ainda não sei" }];
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 font-semibold">Regime da empresa</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((r) => (
          <label
            key={r.id || "nao-sei"}
            className="flex min-h-11 items-center rounded-lg border border-controle bg-superficie px-3 font-medium has-checked:border-marca has-checked:bg-marca has-checked:text-sobre-marca has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-marca"
          >
            <input
              type="radio"
              className="sr-only"
              name={nome}
              value={r.id}
              checked={(regime ?? "") === r.id}
              onChange={() => salvar({ regime: ehRegime(r.id) ? r.id : null })}
            />
            {r.nome}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** As três perguntas. Cada resposta vale na hora; “Pronto” e “Pular” só fecham. */
function Perguntas({ anos, padrao, ausentes, regimes, aoTerminar }: Props & { aoTerminar?: () => void }) {
  const { perfil } = usePreferencias();
  return (
    <div className="space-y-5">
      <SeletorRegime regimes={regimes} />
      <div>
        <p className="mb-2 font-semibold">Seu nível</p>
        <div className="w-fit max-w-full">
          <SeletorNivel />
        </div>
      </div>
      <div>
        <p className="mb-2 font-semibold">Ano da ECF que você vai entregar ou estudar</p>
        <SeletorAno anos={anos} padrao={padrao} ausentes={ausentes} rotulo="Ano da ECF no perfil" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Botao
          onClick={() => {
            salvar({ perfil: "respondido" });
            aoTerminar?.();
          }}
        >
          Pronto
        </Botao>
        <Botao
          variante="contorno"
          onClick={() => {
            salvar({ perfil: perfil ?? "pulado" });
            aoTerminar?.();
          }}
        >
          {perfil ? "Fechar" : "Pular por agora"}
        </Botao>
      </div>
    </div>
  );
}

/** Na primeira visita, no topo da home. Some antes da pintura quando o perfil já foi respondido ou pulado (prefs.js). */
export function CartaoPerfil(props: Props) {
  const titulo = useId();
  return (
    <section data-cartao-perfil aria-labelledby={titulo} data-testid="cartao-perfil" className="rounded-2xl border-2 border-marca bg-superficie p-5 sm:p-6">
      <h2 id={titulo} className="text-xl font-bold sm:text-2xl">
        Monte seu perfil em três respostas
      </h2>
      <p className="mt-1 mb-5 max-w-prose text-suave">
        O site se ajusta a você: blocos do seu regime, roteiro de preenchimento, nível do texto e ano. Fica só neste navegador, e você
        pode mudar a qualquer momento em “Meu perfil”.
      </p>
      <Perguntas {...props} />
    </section>
  );
}

/** Qualquer indicador de perfil abre o mesmo painel, que existe uma vez só na página. */
const ABRIR_PERFIL = "ecf:abrir-perfil";

/** Resumo clicável do perfil: ano da página, leiaute e nível. */
export function IndicadorPerfil({ padrao, leiautes, compacto = false }: { padrao: number; leiautes: Record<number, string>; compacto?: boolean }) {
  const pathname = usePathname();
  const ano = anoDaUrl(pathname, padrao);
  const resumo = `AC ${ano} · Leiaute ${leiautes[ano] ?? "?"}`;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      data-testid="indicador-perfil"
      aria-label={compacto ? `Meu perfil: ${resumo}` : undefined}
      onClick={() => {
        document.querySelectorAll("dialog[open]").forEach((d) => (d as HTMLDialogElement).close());
        window.dispatchEvent(new Event(ABRIR_PERFIL));
      }}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-tinta hover:bg-fundo",
        compacto && "justify-center px-0 text-suave hover:text-tinta",
      )}
    >
      {compacto ? (
        <UserRound aria-hidden size={20} strokeWidth={1.5} />
      ) : (
        <span className="min-w-0 leading-snug">
          <span className="block text-xs text-suave">Meu perfil</span>
          <span className="block text-sm">
            <span className="sr-only">: </span>
            {resumo} · <span data-so="iniciante">Iniciante</span>
            <span data-so="profissional">Profissional</span>
          </span>
        </span>
      )}
    </button>
  );
}

/** Painel do perfil: as mesmas perguntas numa janela, mais o caminho para o progresso. */
export function PainelPerfil(props: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const pathname = usePathname();
  // As perguntas só existem com a janela aberta: fechada, ela não repete campos da página.
  const [aberto, setAberto] = useState(false);
  const fechar = () => dialogo.current?.close();
  useEffect(() => {
    const abrir = () => {
      setAberto(true);
      if (!dialogo.current?.open) dialogo.current?.showModal();
    };
    window.addEventListener(ABRIR_PERFIL, abrir);
    return () => window.removeEventListener(ABRIR_PERFIL, abrir);
  }, []);
  return (
    <dialog
      ref={dialogo}
      aria-labelledby={titulo}
      data-testid="dialogo-perfil"
      onClose={() => setAberto(false)}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] max-w-none rounded-2xl bg-superficie p-5 text-tinta backdrop:bg-black/60 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id={titulo} className="text-xl font-bold">
          Meu perfil
        </h2>
        <button type="button" aria-label="Fechar" onClick={fechar} className="grid size-11 shrink-0 place-items-center rounded-lg border border-controle">
          <X aria-hidden size={20} />
        </button>
      </div>
      {aberto && (
        <>
          <Perguntas {...props} aoTerminar={fechar} />
          <Link
            href={rota("/meu-progresso", anoDaUrl(pathname, props.padrao), props.padrao)}
            prefetch={false}
            onClick={fechar}
            className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4"
          >
            <Trophy aria-hidden size={18} /> Ver meu progresso
          </Link>
        </>
      )}
    </dialog>
  );
}
