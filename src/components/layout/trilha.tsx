"use client";

import { ArrowRight, Award, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { preferenciasAgora, salvar, usePreferencias } from "@/lib/preferencias";
import { conquistas } from "@/lib/preferencias/conquistas";
import { SECOES, anoDaUrl, rota } from "@/lib/rotas";
import { BarraProgresso } from "./progresso";

/** Registra visita a bloco ou registro, só neste navegador. */
export function registrarVisita(codigo: string) {
  const campo = codigo.length === 1 ? "blocos" : "registros";
  const atual = preferenciasAgora()[campo];
  if (!atual.includes(codigo)) salvar({ [campo]: [...atual, codigo] });
}
export function registrarFeito(feito: string) {
  const { feitos } = preferenciasAgora();
  if (!feitos.includes(feito)) salvar({ feitos: [...feitos, feito] });
}
export function MarcarVisita({ codigo }: { codigo: string }) {
  useEffect(() => registrarVisita(codigo), [codigo]);
  return null;
}

export function CartaoTrilha({ ano, padrao }: { ano: number; padrao: number }) {
  const { estudadas } = usePreferencias();
  const proxima = SECOES.find((s) => !estudadas.includes(s.slug));
  return (
    <>
      <BarraProgresso />
      {proxima && (
        <Link
          href={rota(`/${proxima.slug}`, ano, padrao)}
          prefetch={false}
          className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-lg border border-linha bg-fundo px-4 text-tinta no-underline hover:border-marca"
        >
          Continuar: {proxima.curto} <ArrowRight aria-hidden size={18} />
        </Link>
      )}
    </>
  );
}

export function Conquistas() {
  const prefs = usePreferencias();
  const lista = conquistas(prefs, SECOES.length);
  const feitas = lista.filter((c) => c.feito >= c.meta).length;
  return (
    <div>
      <p id="rotulo-conquistas" className="font-semibold">
        {feitas} de {lista.length} conquistas
      </p>
      <div
        role="progressbar"
        aria-labelledby="rotulo-conquistas"
        aria-valuemin={0}
        aria-valuemax={lista.length}
        aria-valuenow={feitas}
        className="mt-3 flex gap-1"
      >
        {lista.map((c, i) => (
          <span key={c.id} className={cn("h-3 flex-1 rounded-full border border-controle", i < feitas ? "bg-marca" : "bg-fundo")} />
        ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {lista.map((c) => {
          const ok = c.feito >= c.meta;
          const Icone = ok ? Award : Lock;
          return (
            <li
              key={c.id}
              data-conquista={c.id}
              data-feita={ok}
              className={cn("flex gap-3 rounded-xl border bg-superficie p-4", ok ? "border-marca" : "border-linha")}
            >
              <Icone aria-hidden size={26} className={cn("shrink-0", ok ? "text-marca" : "text-suave")} />
              <span className="min-w-0">
                <span className="block font-semibold">{c.titulo}</span>
                <span className="block text-sm text-suave">{c.como}</span>
                <span className={cn("mt-1 block text-sm font-medium", ok ? "text-marca" : "text-suave")}>
                  {ok ? "Conquistada" : `${c.feito} de ${c.meta}`}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const TECLAS: Record<string, string> = { s: "/simulador", q: "/quem-deve-entregar", g: "/glossario" };
export const ATALHOS = [
  { tecla: "S", href: "/simulador", texto: "Simulador de IRPJ e CSLL" },
  { tecla: "Q", href: "/quem-deve-entregar", texto: "Quem deve entregar" },
  { tecla: "G", href: "/glossario", texto: "Glossário" },
] as const;

/** Teclas soltas: podem ser desligadas (WCAG 2.1.4) e não agem em campos nem com diálogo aberto. */
export function OuvirAtalhos({ padrao }: { padrao: number }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const ouvir = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.defaultPrevented) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo?.closest("input,select,textarea,[contenteditable],dialog") || document.querySelector("dialog[open]")) return;
      const destino = TECLAS[e.key.toLowerCase()];
      if (!destino || !preferenciasAgora().atalhos) return;
      router.push(rota(destino, anoDaUrl(pathname, padrao), padrao));
    };
    window.addEventListener("keydown", ouvir);
    return () => window.removeEventListener("keydown", ouvir);
  }, [router, pathname, padrao]);
  return null;
}

export function Atalhos({ ano, padrao }: { ano: number; padrao: number }) {
  const { atalhos } = usePreferencias();
  return (
    <>
      <ul className="space-y-2">
        {ATALHOS.map((a) => (
          <li key={a.tecla}>
            <Link
              href={rota(a.href, ano, padrao)}
              prefetch={false}
              className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-linha bg-fundo px-4 text-tinta no-underline hover:border-marca"
            >
              {a.texto}
              {atalhos && <kbd className="rounded border border-controle px-2 font-mono text-sm text-suave">{a.tecla}</kbd>}
            </Link>
          </li>
        ))}
      </ul>
      <label className="mt-3 flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={atalhos} onChange={(e) => salvar({ atalhos: e.target.checked })} className="size-5 accent-marca" />
        Usar teclas de atalho
      </label>
    </>
  );
}
