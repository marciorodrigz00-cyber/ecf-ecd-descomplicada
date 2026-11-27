"use client";

import {
  BadgePercent,
  BookA,
  BookOpen,
  Blocks,
  Building2,
  Bell,
  Calculator,
  CircleHelp,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { salvar, usePreferencias } from "@/lib/preferencias";
import { anoDaUrl, caminhoBase, rota } from "@/lib/rotas";
import { BotaoTema } from "./controles";
import { IndicadorPerfil } from "./perfil";

type Item = { slug: string; rotulo: string; Icone: LucideIcon; tambem?: string[] };
type Grupo = { titulo: string | null; itens: Item[] };

/** Menu principal. “Importância” fica dentro de “O que é”. */
export const GRUPOS: Grupo[] = [
  { titulo: null, itens: [{ slug: "", rotulo: "Visão geral", Icone: LayoutDashboard }] },
  {
    titulo: "Aprender",
    itens: [
      { slug: "o-que-e", rotulo: "O que é a ECF", Icone: BookOpen, tambem: ["importancia"] },
      { slug: "quem-deve-entregar", rotulo: "Quem entrega", Icone: CircleHelp },
      { slug: "glossario", rotulo: "Glossário", Icone: BookA },
    ],
  },
  {
    titulo: "Preencher",
    itens: [
      { slug: "blocos", rotulo: "Blocos e registros", Icone: Blocks },
      { slug: "preencher", rotulo: "Roteiro", Icone: ListChecks },
      { slug: "exemplos", rotulo: "Casos práticos", Icone: Building2 },
      { slug: "simulador", rotulo: "Simulador", Icone: Calculator },
    ],
  },
  { titulo: "Incentivos", itens: [{ slug: "incentivos", rotulo: "Incentivos fiscais", Icone: BadgePercent }] },
  {
    titulo: "Atualizações",
    itens: [
      { slug: "novidades", rotulo: "Novidades", Icone: Bell },
      { slug: "fontes", rotulo: "Fontes e verificações", Icone: ShieldCheck },
    ],
  },
];

export type BlocoLateral = { letra: string; curto: string };
export type PropsLateral = { padrao: number; leiautes: Record<number, string>; blocos: Record<number, BlocoLateral[]> };
type Dica = { texto: string; topo: number } | null;

/** Primeira parte do caminho (sem o ano): "" na home, "blocos" em /blocos/m/m300. */
function useArea() {
  const pathname = usePathname();
  const partes = caminhoBase(pathname).split("/");
  return { pathname, area: partes[1] ?? "", bloco: partes[2]?.toUpperCase() ?? null };
}

const LARGA = "(min-width: 1280px)";
function useLarga(): boolean {
  return useSyncExternalStore(
    (aviso) => {
      const m = window.matchMedia(LARGA);
      m.addEventListener("change", aviso);
      return () => m.removeEventListener("change", aviso);
    },
    () => window.matchMedia(LARGA).matches,
    () => true,
  );
}

/** Logo, busca, perfil, menu e rodapé. Serve à coluna fixa e à gaveta do celular. */
export function ConteudoLateral({
  padrao,
  leiautes,
  blocos,
  emGaveta = false,
  aoIr,
  aoDica,
  topo,
}: PropsLateral & { emGaveta?: boolean; aoIr?: () => void; aoDica?: (d: Dica) => void; topo?: React.ReactNode }) {
  const { pathname, area, bloco } = useArea();
  const ano = anoDaUrl(pathname, padrao);
  const base = useId();
  const dica = (texto: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => mostrar(e.currentTarget, texto),
    onFocus: (e: React.FocusEvent<HTMLElement>) => mostrar(e.currentTarget, texto),
    onMouseLeave: () => aoDica?.(null),
    onBlur: () => aoDica?.(null),
  });
  function mostrar(el: HTMLElement, texto: string) {
    if (!aoDica) return;
    const r = el.getBoundingClientRect();
    aoDica({ texto, topo: r.top + r.height / 2 });
  }
  return (
    <div className="flex h-full flex-col">
      {/* Topo fixo: logo e, na coluna, o botão de recolher. */}
      <div className={cn("topo-lateral flex items-center gap-2 border-b border-linha px-3 py-3", emGaveta && "pr-16")}>
        {/* Sem aria-label: o nome do link é o texto visível, mais "página inicial" para o leitor de tela. */}
        <Link
          href={rota("/", ano, padrao)}
          prefetch={false}
          onClick={aoIr}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 font-semibold text-tinta no-underline"
        >
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-marca text-xs font-bold text-sobre-marca">
            ECF
          </span>
          <span className="so-aberta-leitor min-w-0 text-sm leading-tight whitespace-nowrap">
            <span className="block">ECF</span>
            <span className="block">
              descomplicada<span className="sr-only">, página inicial</span>
            </span>
          </span>
        </Link>
        {topo}
      </div>

      {/* Só a lista rola; topo e rodapé ficam sempre visíveis. */}
      <nav aria-label="Principal" className="nav-lateral min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3">
        {GRUPOS.map((g, gi) => (
          <div key={g.titulo ?? "inicio"} className={cn(gi > 0 && "mt-4")}>
            {g.titulo && (
              <p id={`${base}-${gi}`} className="so-aberta mb-1 px-3 text-xs font-semibold tracking-wider text-suave uppercase">
                {g.titulo}
              </p>
            )}
            <ul aria-labelledby={g.titulo ? `${base}-${gi}` : undefined} className="space-y-0.5">
              {g.itens.map((it) => {
                const atual = it.slug === area || (it.tambem?.includes(area) ?? false);
                // "page" na própria página da área; "true" nas páginas filhas (bloco, registro, detalhe).
                const naPropria = caminhoBase(pathname) === `/${it.slug}`;
                return (
                  <li key={it.slug}>
                    <Link
                      href={rota(`/${it.slug}`, ano, padrao)}
                      prefetch={false}
                      onClick={aoIr}
                      aria-current={naPropria ? "page" : atual ? "true" : undefined}
                      data-item-menu={it.slug || "inicio"}
                      {...dica(it.rotulo)}
                      className={cn(
                        "item-lateral relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium no-underline",
                        atual ? "item-ativo text-tinta" : "text-suave hover:bg-fundo hover:text-tinta",
                      )}
                    >
                      <it.Icone aria-hidden size={20} strokeWidth={1.5} className={cn("shrink-0", atual && "text-marca")} />
                      <span className="so-aberta-leitor truncate">{it.rotulo}</span>
                    </Link>
                    {it.slug === "blocos" && area === "blocos" && blocos[ano] && (
                      <ul aria-label="Blocos do arquivo" data-testid="sub-blocos" className="sub-blocos mt-1 mb-2 grid gap-1 pl-3">
                        {blocos[ano].map((b) => {
                          const este = b.letra === bloco;
                          return (
                            <li key={b.letra}>
                              <Link
                                href={rota(`/blocos/${b.letra.toLowerCase()}`, ano, padrao)}
                                prefetch={false}
                                onClick={aoIr}
                                title={`Bloco ${b.letra}: ${b.curto}`}
                                aria-label={`Bloco ${b.letra}: ${b.curto}`}
                                aria-current={este ? "page" : undefined}
                                className={cn(
                                  "grid min-h-8 place-items-center rounded-md font-mono text-sm font-semibold no-underline",
                                  este ? "bg-marca text-sobre-marca" : "text-suave hover:bg-fundo hover:text-tinta",
                                )}
                              >
                                {b.letra}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé fixo: perfil e tema. */}
      <div className="rodape-lateral flex items-center gap-2 border-t border-linha px-3 py-3">
        <span className="so-aberta min-w-0 flex-1">
          <IndicadorPerfil padrao={padrao} leiautes={leiautes} />
        </span>
        <span className="so-compacta" {...dica("Meu perfil")}>
          <IndicadorPerfil padrao={padrao} leiautes={leiautes} compacto />
        </span>
        <span {...dica("Tema claro ou escuro")}>
          <BotaoTema />
        </span>
      </div>
    </div>
  );
}

/** Coluna fixa na altura da tela a partir de 1024 px. Aberta a partir de 1280 px; recolhida (trilho de ícones) entre 1024 e 1279 px. */
export function Lateral(props: PropsLateral) {
  const { pathname } = useArea();
  const { menu } = usePreferencias();
  const larga = useLarga();
  // Entre 1024 e 1279 px, abrir é temporário: vale até a próxima página.
  const [abertaEm, setAbertaEm] = useState<string | null>(null);
  const expandida = abertaEm === pathname;
  const compacto = !expandida && (menu === "recolhido" || !larga);
  const [dica, setDica] = useState<Dica>(null);

  useEffect(() => {
    if (!expandida) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbertaEm(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [expandida]);

  function alternar() {
    setDica(null);
    if (larga) {
      setAbertaEm(null);
      salvar({ menu: menu === "recolhido" ? null : "recolhido" });
    } else setAbertaEm(expandida ? null : pathname);
  }

  return (
    <aside data-lateral data-expandida={expandida || undefined} className="lateral fixed inset-y-0 left-0 z-30 hidden border-r border-linha bg-superficie lg:block">
      <div className="h-full">
        <ConteudoLateral
          {...props}
          aoDica={compacto ? setDica : undefined}
          topo={
            <button
              type="button"
              onClick={alternar}
              aria-expanded={!compacto}
              aria-label={compacto ? "Expandir menu" : "Recolher menu"}
              title={compacto ? "Expandir menu" : "Recolher menu"}
              data-testid="recolher-menu"
              className="grid size-11 shrink-0 place-items-center rounded-lg text-suave hover:bg-fundo hover:text-tinta"
            >
              {compacto ? <PanelLeftOpen aria-hidden size={20} strokeWidth={1.5} /> : <PanelLeftClose aria-hidden size={20} strokeWidth={1.5} />}
            </button>
          }
        />
      </div>
      {compacto && dica && (
        <span
          aria-hidden
          role="tooltip"
          data-testid="dica-menu"
          style={{ top: dica.topo }}
          className="pointer-events-none fixed left-[4.5rem] z-40 -translate-y-1/2 rounded-md bg-tinta px-2.5 py-1 text-sm font-medium whitespace-nowrap text-fundo shadow-lg"
        >
          {dica.texto}
        </span>
      )}
    </aside>
  );
}
