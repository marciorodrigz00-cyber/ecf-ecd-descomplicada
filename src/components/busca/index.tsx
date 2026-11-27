"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { agrupar, buscar, preparar, type Indice, type LinhaIndice, type Resultado, type TipoItem } from "@/lib/busca";
import { cn } from "@/lib/cn";
import { anoDaUrl } from "@/lib/rotas";

const NOME: Record<TipoItem, string> = { bloco: "Bloco", registro: "Registro", campo: "Campo", termo: "Glossário", secao: "Página", novidade: "Novidade", regra: "Regra" };
const GRUPO: Record<TipoItem, string> = { bloco: "Blocos", registro: "Registros", campo: "Campos", termo: "Glossário", secao: "Páginas", novidade: "Novidades", regra: "Regras de validação" };
const guardados = new Map<number, Indice>();
type Carga = { ano: number; estado: "carregando" | "erro" | "pronto" };

export function Busca({ padrao }: { padrao: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const ano = anoDaUrl(pathname, padrao);
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const [aberta, setAberta] = useState(false);
  const [texto, setTexto] = useState("");
  const [sel, setSel] = useState(0);
  const [carga, setCarga] = useState<Carga>({ ano, estado: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const id = useId();

  const indice = guardados.get(ano);
  const consulta = texto.trim();
  const iniciais = (): Resultado[] => (indice ? indice.linhas.slice(0, 17).map(([, codigo, titulo, href]) => ({ tipo: "bloco", codigo, titulo, href })) : []);
  const itens = !indice ? [] : consulta === "" ? iniciais() : agrupar(buscar(indice, consulta));
  // Grupos por tipo, já na ordem de itens: o índice de cada opção continua o mesmo para o teclado.
  const grupos = itens.reduce<{ tipo: TipoItem; de: number; ate: number }[]>((g, r, i) => {
    const ultimo = g.at(-1);
    if (ultimo && ultimo.tipo === r.tipo) ultimo.ate = i;
    else g.push({ tipo: r.tipo, de: i, ate: i });
    return g;
  }, []);
  const estado = indice ? "pronto" : carga.ano === ano ? carga.estado : "carregando";

  function abrir() {
    if (dialogo.current?.open || document.querySelector("dialog[open]")) return;
    setTexto("");
    setSel(0);
    setAberta(true);
    dialogo.current?.showModal();
    campo.current?.focus();
  }
  const fechar = () => dialogo.current?.close();

  useEffect(() => {
    const ouvir = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogo.current?.open) campo.current?.focus();
        else abrir();
      }
    };
    window.addEventListener("keydown", ouvir);
    return () => window.removeEventListener("keydown", ouvir);
  }, []);

  // Clique fora fecha: o alvo é o próprio diálogo só quando o clique cai na área escura.
  useEffect(() => {
    const d = dialogo.current!;
    const fora = (e: MouseEvent) => e.target === d && d.close();
    d.addEventListener("click", fora);
    return () => d.removeEventListener("click", fora);
  }, []);

  useEffect(() => {
    if (!aberta || guardados.has(ano)) return;
    const corte = new AbortController();
    fetch(`/dados/${ano}/busca.json`, { signal: corte.signal })
      .then((r) => (r.ok ? (r.json() as Promise<LinhaIndice[]>) : Promise.reject(new Error(String(r.status)))))
      .then((linhas) => {
        guardados.set(ano, preparar(linhas));
        setCarga({ ano, estado: "pronto" });
      })
      .catch(() => {
        if (!corte.signal.aborted) setCarga({ ano, estado: "erro" });
      });
    return () => corte.abort();
  }, [aberta, ano, tentativa]);

  useEffect(() => {
    lista.current?.querySelector("[aria-selected=true]")?.scrollIntoView({ block: "nearest" });
  }, [sel, texto]);

  function ir(r: Resultado | undefined) {
    if (!r) return;
    fechar();
    router.push(r.href);
  }
  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    const passo = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (passo && itens.length) {
      e.preventDefault();
      setSel((s) => (s + passo + itens.length) % itens.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      ir(itens[sel]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        className="flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-lg border border-controle bg-fundo px-3 text-suave hover:border-marca xl:min-w-0 xl:flex-1 xl:justify-start"
      >
        <Search aria-hidden size={20} className="shrink-0" />
        <span className="sr-only min-w-0 flex-1 truncate text-left xl:not-sr-only xl:truncate">
          Buscar bloco, registro, campo ou termo
        </span>
        <kbd className="hidden shrink-0 rounded border border-controle px-2 font-mono text-sm xl:block">
          Ctrl K
        </kbd>
      </button>
      <dialog
        ref={dialogo}
        aria-label="Busca"
        onClose={() => setAberta(false)}
        className="m-0 mx-auto mt-[8vh] max-h-[84vh] w-[min(44rem,94vw)] max-w-none overflow-hidden rounded-2xl border border-controle bg-superficie p-0 text-tinta"
      >
        <div className="flex max-h-[84vh] flex-col">
          <div className="flex items-center gap-2 border-b border-linha px-4">
            <Search aria-hidden size={20} className="shrink-0 text-suave" />
            <input
              ref={campo}
              type="text"
              role="combobox"
              aria-label="Buscar"
              aria-expanded={itens.length > 0}
              aria-controls={`${id}-lista`}
              aria-activedescendant={itens.length ? `${id}-${sel}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
              maxLength={80}
              value={texto}
              placeholder="M300, livro caixa, prejuízo fiscal…"
              onChange={(e) => {
                setTexto(e.target.value);
                setSel(0);
              }}
              onKeyDown={teclas}
              className="min-h-14 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-suave"
            />
            <button type="button" aria-label="Fechar busca" onClick={fechar} className="grid size-11 shrink-0 place-items-center rounded-lg">
              <X aria-hidden size={20} />
            </button>
          </div>
          <p role="status" data-testid="busca-estado" className="px-5 pt-3 text-sm text-suave">
            {estado === "carregando" && "Carregando a busca…"}
            {estado === "pronto" && consulta === "" && "Todos os blocos. Digite para buscar."}
            {estado === "pronto" && consulta !== "" && (itens.length === 0 ? `Nenhum resultado para '${consulta}'` : itens.length === 1 ? "1 resultado" : `${itens.length} resultados${itens.length === 40 ? " (os mais próximos)" : ""}`)}
          </p>
          {estado === "erro" && (
            <div role="alert" className="px-5 py-3">
              <p>Não foi possível carregar a busca agora.</p>
              <button
                type="button"
                onClick={() => {
                  setCarga({ ano, estado: "carregando" });
                  setTentativa((t) => t + 1);
                }}
                className="mt-2 min-h-11 rounded-lg border border-controle px-4"
              >
                Tentar de novo
              </button>
            </div>
          )}
          <div ref={lista} id={`${id}-lista`} role="listbox" aria-label="Resultados" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto p-2">
            {grupos.map((g) => (
              <div key={g.tipo} role="group" aria-labelledby={`${id}-g-${g.tipo}`} data-grupo={g.tipo}>
                {consulta !== "" && (
                  <div id={`${id}-g-${g.tipo}`} role="presentation" className="px-3 pt-3 pb-1 text-sm font-semibold text-suave">
                    {GRUPO[g.tipo]}
                  </div>
                )}
                {consulta === "" && (
                  <span id={`${id}-g-${g.tipo}`} className="sr-only">
                    {GRUPO[g.tipo]}
                  </span>
                )}
                {itens.slice(g.de, g.ate + 1).map((r, k) => {
                  const i = g.de + k;
                  return (
                    // O teclado age no campo, pelo padrão de combobox; o clique é o atalho do mouse e do toque.
                    <div
                      key={r.href + r.codigo + r.titulo}
                      id={`${id}-${i}`}
                      role="option"
                      tabIndex={-1}
                      aria-selected={i === sel}
                      onClick={() => ir(r)}
                      onKeyDown={(e) => e.key === "Enter" && ir(r)}
                      onMouseMove={() => i !== sel && setSel(i)}
                      className={cn("flex min-h-11 cursor-pointer items-baseline gap-3 rounded-lg px-3 py-2", i === sel && "bg-ok-fundo")}
                    >
                      <span className="min-w-0 flex-1">
                        {r.codigo && r.tipo !== "bloco" && <span className="mr-2 font-mono font-semibold break-all text-marca">{r.codigo}</span>}
                        {r.titulo}
                      </span>
                      <span className="shrink-0 text-sm text-suave">{NOME[r.tipo]}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p aria-hidden className="hidden border-t border-linha px-5 py-2 text-sm text-suave sm:block">
            ↑ ↓ para escolher · Enter para abrir · Esc para fechar
          </p>
        </div>
      </dialog>
    </>
  );
}
