"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Busca } from "@/components/busca";
import { cn } from "@/lib/cn";
import { preferenciasAgora } from "@/lib/preferencias";
import { SECOES, anoDaUrl, caminhoBase, rota, secaoDoCaminho, type Ausentes } from "@/lib/rotas";
import { BotaoTema, SeletorAno, SeletorNivel } from "./controles";

type Props = { anos: number[]; padrao: number; ausentes: Ausentes };

// Vale uma vez por carga: voltar para a home depois não redireciona de novo.
let entradaTratada = false;

function ItensMenu({ padrao, vertical, aoIr }: { padrao: number; vertical?: boolean; aoIr?: () => void }) {
  const pathname = usePathname();
  const ano = anoDaUrl(pathname, padrao);
  const ativa = secaoDoCaminho(caminhoBase(pathname))?.slug;
  return (
    <ul className={cn("flex", vertical ? "flex-col gap-1" : "flex-wrap gap-x-1")}>
      {SECOES.map((s) => {
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

export function Cabecalho({ anos, padrao, ausentes }: Props) {
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
      router.replace(rota("/", pref, padrao));
    }
  }, [anos, padrao, pathname, router]);

  // Nova seção: leva o foco ao título, sem mexer na rolagem que o navegador já fez.
  useEffect(() => {
    if (anterior.current === pathname) return;
    anterior.current = pathname;
    const h1 = document.querySelector<HTMLElement>("h1");
    h1?.setAttribute("tabindex", "-1");
    h1?.focus({ preventScroll: true });
  }, [pathname]);

  const fechar = () => dialogo.current?.close();

  return (
    <header className="border-b border-linha bg-superficie">
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={rota("/", ano, padrao)}
          prefetch={false}
          className="flex min-h-11 shrink-0 items-center gap-3 font-mono text-lg font-semibold text-tinta no-underline"
        >
          <span className="rounded-md bg-marca px-2 whitespace-nowrap text-sobre-marca">ECF e ECD</span>
          <span className="sr-only sm:not-sr-only">descomplicada</span>
        </Link>
        <span className="flex min-w-0 flex-1 justify-end xl:justify-start">
          <Busca padrao={padrao} />
        </span>
        <div className="hidden items-center gap-3 lg:flex">
          <SeletorAno anos={anos} padrao={padrao} ausentes={ausentes} />
          <SeletorNivel />
          <BotaoTema />
        </div>
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
      <nav aria-label="Principal" className="mx-auto hidden max-w-[92rem] px-3 xl:block">
        <ItensMenu padrao={padrao} />
      </nav>

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
      </dialog>
    </header>
  );
}

const EXEMPLOS: Record<string, string> = {
  "lucro-real": "Lucro real",
  "lucro-presumido": "Lucro presumido",
  isenta: "Isenta",
};
const AVULSAS: Record<string, string> = { fontes: "Fontes", preencher: "Roteiro" };

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
