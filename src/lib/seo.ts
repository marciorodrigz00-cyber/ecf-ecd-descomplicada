import type { Metadata } from "next";
import { ANO_PADRAO } from "@/lib/conteudo";
import { rota } from "@/lib/rotas";

/**
 * Endereço do site no build. Na Vercel, o domínio de produção vem pronto; SITE_URL serve para domínio próprio.
 * Sem nenhum dos dois (build local), usa o servidor local e o site não se oferece a buscadores.
 */
function endereco(): string {
  const bruto = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (!bruto) return "http://127.0.0.1:4173";
  const u = new URL(bruto);
  if (u.protocol !== "https:" || u.username || u.port) throw new Error("SITE_URL precisa ser https, sem porta nem credencial");
  return u.origin;
}
export const SITE = endereco();
/** Só produção de verdade é indexada: nem prévia, nem build local. */
export const INDEXAR = SITE.startsWith("https://") && (process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production");
export const NOME_SITE = "ECF e ECD Descomplicada";
/** O nome fala em ECD; o conteúdo, ainda não. Aparece no rodapé e na entrada. */
export const AVISO_ECD = "Por enquanto, o conteúdo é de ECF. A parte da ECD ainda não está disponível: ela aparece só como origem dos dados.";
export const DESCRICAO = "Entenda e prepare a Escrituração Contábil Fiscal, bloco a bloco, com a fonte oficial de cada regra.";

const cortar = (s: string) => (s.length <= 160 ? s : `${s.slice(0, 157).replace(/\s+\S*$/, "")}…`);

/** Metadados de uma página. O canônico pode ser de outro ano quando o conteúdo é o mesmo. */
export function meta({ titulo, descricao, base, ano = ANO_PADRAO, canonico }: { titulo: string; descricao: string; base: string; ano?: number; canonico?: string }): Metadata {
  const url = canonico ?? rota(base, ano, ANO_PADRAO);
  const t = ano === ANO_PADRAO ? titulo : `${titulo}, ano-calendário ${ano}`;
  const d = cortar(descricao.replace(/\s+/g, " ").trim());
  return {
    title: t,
    description: d,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "pt_BR", siteName: NOME_SITE, title: t, description: d, url, images: [{ url: "/og.png", width: 1200, height: 630, alt: `${NOME_SITE}: a ECF explicada bloco a bloco` }] },
    twitter: { card: "summary_large_image", title: t, description: d, images: ["/og.png"] },
  };
}
