"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Busca, BotaoBusca } from "@/components/busca";
import { ENDERECO_MUDOU } from "@/lib/parametros";
import { preferenciasAgora } from "@/lib/preferencias";
import { anoDaUrl, caminhoBase, rota, secaoDoCaminho, type Ausentes } from "@/lib/rotas";
import { ConteudoLateral, Lateral, type PropsLateral } from "./lateral";
import { PainelPerfil, type RegimeNome } from "./perfil";

type Props = { anos: number[]; padrao: number; ausentes: Ausentes; regimes: RegimeNome[] } & PropsLateral;

// Vale uma vez por carga: voltar para a home depois não redireciona de novo.
let entradaTratada = false;

/** Sem tela. O Suspense deixa só este pedaço fora do HTML gerado; o resto da página continua estático. */
function AvisoEndereco() {
  const busca = useSearchParams().toString();
  useEffect(() => {
    window.dispatchEvent(new Event(ENDERECO_MUDOU));
  }, [busca]);
  return null;
}

/** Menu lateral (computador), barra fina e gaveta (celular), busca e painel de perfil. */
export function Cabecalho({ anos, padrao, ausentes, regimes, leiautes, blocos }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const gaveta = useRef<HTMLDialogElement>(null);
  const anterior = useRef(pathname);
  const ano = anoDaUrl(pathname, padrao);

  // Preferência de ano só atua ao entrar pela home.
  useEffect(() => {
    if (entradaTratada) return;
    entradaTratada = true;
    const pref = preferenciasAgora().ano;
    if (pathname === "/" && pref !== null && pref !== padrao && anos.includes(pref)) {
      // Leva junto a seleção que veio no link.
      router.replace(rota("/", pref, padrao) + window.location.search);
    }
  }, [anos, padrao, pathname, router]);

  // Voltar e Avançar devolvem a rolagem de antes: só a ida por link começa no topo.
  const historico = useRef<string | null>(null);
  useEffect(() => {
    const anotar = () => {
      historico.current = window.location.pathname;
    };
    window.addEventListener("popstate", anotar);
    return () => window.removeEventListener("popstate", anotar);
  }, []);

  // Nova seção: começa no topo, com o foco no título. O Next mantém a rolagem quando a página nova já está visível.
  useEffect(() => {
    if (anterior.current === pathname) return;
    anterior.current = pathname;
    const h1 = document.querySelector<HTMLElement>("h1");
    h1?.setAttribute("tabindex", "-1");
    h1?.focus({ preventScroll: true });
    if (historico.current !== pathname && !window.location.hash) window.scrollTo(0, 0);
    historico.current = null;
  }, [pathname]);

  // O conteúdo da gaveta só existe com ela aberta: fechada, não repete o menu da coluna.
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const fechar = () => gaveta.current?.close();
  const lateral = { padrao, leiautes, blocos };

  return (
    <>
      <Suspense fallback={null}>
        <AvisoEndereco />
      </Suspense>
      <Busca padrao={padrao} />
      <PainelPerfil anos={anos} padrao={padrao} ausentes={ausentes} regimes={regimes} />
      <Lateral {...lateral} />

      <header className="flex items-center gap-2 border-b border-linha bg-superficie px-3 py-2 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-haspopup="dialog"
          onClick={() => {
            setGavetaAberta(true);
            if (!gaveta.current?.open) gaveta.current?.showModal();
          }}
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-controle"
        >
          <Menu aria-hidden size={22} />
        </button>
        <Link
          href={rota("/", ano, padrao)}
          prefetch={false}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 font-mono font-semibold text-tinta no-underline"
        >
          <span className="rounded-md bg-marca px-2 py-0.5 whitespace-nowrap text-sobre-marca">ECF e ECD</span>
          <span className="truncate">
            <span className="sr-only"> </span>descomplicada<span className="sr-only">, página inicial</span>
          </span>
        </Link>
        <BotaoBusca compacto />
      </header>

      <dialog
        ref={gaveta}
        aria-label="Menu"
        data-testid="gaveta"
        onClose={() => setGavetaAberta(false)}
        className="gaveta m-0 h-dvh max-h-none w-[min(18rem,88vw)] max-w-none overflow-hidden bg-superficie p-0 text-tinta backdrop:bg-black/60"
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fechar}
          className="absolute top-4 right-3 z-10 grid size-11 place-items-center rounded-lg border border-controle bg-superficie"
        >
          <X aria-hidden size={22} />
        </button>
        {gavetaAberta && <ConteudoLateral {...lateral} emGaveta aoIr={fechar} />}
      </dialog>
    </>
  );
}

const EXEMPLOS: Record<string, string> = {
  "lucro-real": "Lucro real",
  "lucro-presumido": "Lucro presumido",
  isenta: "Isenta",
};
const AVULSAS: Record<string, string> = { fontes: "Fontes", preencher: "Roteiro", "meu-progresso": "Meu progresso" };

export function Breadcrumb({ padrao }: { padrao: number }) {
  const pathname = usePathname();
  const ano = anoDaUrl(pathname, padrao);
  const base = caminhoBase(pathname);
  const partes = base.split("/").filter(Boolean);
  if (partes.length === 0) return null;
  const secao = secaoDoCaminho(base);
  const trilha = [
    { href: "/", texto: "Início" },
    { href: `/${partes[0]}`, texto: secao?.curto ?? AVULSAS[partes[0]!] ?? "Página" },
    ...(secao?.slug === "blocos" && partes[1]
      ? [{ href: `/blocos/${partes[1]}`, texto: `Bloco ${partes[1].toUpperCase()}` }]
      : []),
    ...(secao?.slug === "novidades" && partes[1] ? [{ href: base, texto: "Detalhe" }] : []),
    ...(secao?.slug === "exemplos" && partes[1] ? [{ href: base, texto: EXEMPLOS[partes[1]] ?? "Exemplo" }] : []),
    ...(secao?.slug === "blocos" && partes[2] ? [{ href: base, texto: partes[2].toUpperCase() }] : []),
  ];
  return (
    <nav aria-label="Você está em" className="mx-auto w-full max-w-[84rem] px-4 pt-6 text-sm sm:px-6 lg:px-10">
      <ol className="flex flex-wrap items-center gap-1 text-suave">
        {trilha.map((t, i) => (
          <li key={t.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden size={16} />}
            {i === trilha.length - 1 ? (
              <span aria-current="page">{t.texto}</span>
            ) : (
              <Link
                href={rota(t.href, ano, padrao)}
                prefetch={false}
                className="inline-flex min-h-6 items-center underline underline-offset-4"
              >
                {t.texto}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Âncora interna que preserva o ano da URL (para rodapé e afins). */
export function LinkAno({ base, padrao, children }: { base: string; padrao: number; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      href={rota(base, anoDaUrl(pathname, padrao), padrao)}
      prefetch={false}
      className="inline-flex min-h-6 items-center underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
