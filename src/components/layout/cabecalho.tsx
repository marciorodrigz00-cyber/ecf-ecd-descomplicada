"use client";

import { ChevronRight, Menu, Trophy, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Busca } from "@/components/busca";
import { cn } from "@/lib/cn";
import { ENDERECO_MUDOU } from "@/lib/parametros";
import { preferenciasAgora } from "@/lib/preferencias";
import { SECOES, anoDaUrl, caminhoBase, rota, secaoDoCaminho, type Ausentes } from "@/lib/rotas";
import { BotaoTema, SeletorAno, SeletorNivel } from "./controles";
import { BotaoPerfil, type RegimeNome } from "./perfil";

type Props = { anos: number[]; padrao: number; ausentes: Ausentes; regimes: RegimeNome[] };

/** Menu principal. “Importância” fica dentro de “O que é”; “Fontes” é página avulsa. */
const MENU = [...SECOES.filter((s) => s.slug !== "importancia").map((s) => ({ slug: s.slug, curto: s.curto })), { slug: "fontes", curto: "Fontes" }];
const DENTRO_DE: Record<string, string> = { importancia: "o-que-e" };

// Vale uma vez por carga: voltar para a home depois não redireciona de novo.
let entradaTratada = false;

function ItensMenu({ padrao, vertical, aoIr }: { padrao: number; vertical?: boolean; aoIr?: () => void }) {
  const pathname = usePathname();
  const ano = anoDaUrl(pathname, padrao);
  const primeiro = caminhoBase(pathname).split("/")[1] ?? "";
  const ativa = DENTRO_DE[primeiro] ?? primeiro;
  return (
    <ul className={cn("flex", vertical ? "flex-col gap-1" : "flex-wrap gap-x-1")}>
      {MENU.map((s) => {
        const atual = s.slug === ativa;
        return (
          <li key={s.slug}>
            <Link
              href={rota(`/${s.slug}`, ano, padrao)}
              prefetch={false}
              aria-current={atual ? "page" : undefined}
              onClick={aoIr}
              className={cn(
                "flex min-h-11 items-center px-3 font-medium text-tinta no-underline hover:text-marca",
                vertical ? "rounded-lg" : "border-b-3 border-transparent",
                atual && (vertical ? "bg-marca text-sobre-marca hover:text-sobre-marca" : "border-marca text-marca"),
              )}
            >
              {s.curto}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Sem tela. O Suspense deixa só este pedaço fora do HTML gerado; o resto da página continua estático. */
function AvisoEndereco() {
  const busca = useSearchParams().toString();
  useEffect(() => {
    window.dispatchEvent(new Event(ENDERECO_MUDOU));
  }, [busca]);
  return null;
}

/** Link para a página de progresso, perto do perfil. */
function LinkProgresso({ padrao, aoIr }: { padrao: number; aoIr?: () => void }) {
  const pathname = usePathname();
  const atual = caminhoBase(pathname) === "/meu-progresso";
  return (
    <Link
      href={rota("/meu-progresso", anoDaUrl(pathname, padrao), padrao)}
      prefetch={false}
      aria-current={atual ? "page" : undefined}
      onClick={aoIr}
      className="flex min-h-11 items-center gap-2 px-3 font-medium text-tinta no-underline hover:text-marca aria-[current=page]:text-marca"
    >
      <Trophy aria-hidden size={18} /> Meu progresso
    </Link>
  );
}

export function Cabecalho({ anos, padrao, ausentes, regimes }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
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

  const fechar = () => dialogo.current?.close();

  return (
    <header className="border-b border-linha bg-superficie">
      <Suspense fallback={null}>
        <AvisoEndereco />
      </Suspense>
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="flex shrink-0 items-center gap-2">
          <Link
            href={rota("/", ano, padrao)}
            prefetch={false}
            aria-label="ECF e ECD descomplicada, página inicial"
            className="flex min-h-11 items-center gap-3 font-mono text-lg font-semibold text-tinta no-underline"
          >
            <span className="rounded-md bg-marca px-2 whitespace-nowrap text-sobre-marca">ECF e ECD</span>{" "}
            <span className="sr-only sm:not-sr-only">descomplicada</span>
          </Link>
          <span data-testid="ecd-em-breve" className="hidden rounded-md border border-controle px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-suave md:inline">
            ECD em breve
          </span>
        </span>
        <span className="flex min-w-0 flex-1 justify-end xl:justify-start">
          <Busca padrao={padrao} />
        </span>
        <div className="hidden items-center gap-3 lg:flex">
          <SeletorAno anos={anos} padrao={padrao} ausentes={ausentes} />
          <SeletorNivel />
          <BotaoTema />
        </div>
        <BotaoPerfil anos={anos} padrao={padrao} ausentes={ausentes} regimes={regimes} />
        <button
          type="button"
          aria-label="Abrir menu"
          aria-haspopup="dialog"
          onClick={() => {
            if (!dialogo.current?.open) dialogo.current?.showModal();
          }}
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-controle xl:hidden"
        >
          <Menu aria-hidden size={22} />
        </button>
      </div>
      <div className="mx-auto hidden max-w-[92rem] items-center justify-between px-3 xl:flex">
        <nav aria-label="Principal">
          <ItensMenu padrao={padrao} />
        </nav>
        <LinkProgresso padrao={padrao} />
      </div>

      <dialog
        ref={dialogo}
        aria-label="Menu"
        className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,100vw)] max-w-none bg-superficie p-5 text-tinta"
      >
        <div className="mb-4 flex items-center justify-between">
          <BotaoTema />
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={fechar}
            className="grid size-11 place-items-center rounded-lg border border-controle"
          >
            <X aria-hidden size={22} />
          </button>
        </div>
        <div className="mb-5 flex flex-col items-start gap-3 border-b border-linha pb-5 lg:hidden">
          <SeletorNivel />
          <SeletorAno anos={anos} padrao={padrao} ausentes={ausentes} />
        </div>
        <nav aria-label="Principal (menu)">
          <ItensMenu padrao={padrao} vertical aoIr={fechar} />
        </nav>
        <div className="mt-4 border-t border-linha pt-4">
          <LinkProgresso padrao={padrao} aoIr={fechar} />
        </div>
      </dialog>
    </header>
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
    <nav aria-label="Você está em" className="mx-auto w-full max-w-[92rem] px-4 pt-5 text-sm sm:px-6">
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
