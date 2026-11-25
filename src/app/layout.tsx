import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { Breadcrumb, Cabecalho, LinkAno } from "@/components/layout/cabecalho";
import { OuvirAtalhos } from "@/components/layout/trilha";
import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { registroDoAno, registrosDoAno } from "@/lib/conteudo/leiautes";
import { AVISO_ECD, DESCRICAO, INDEXAR, NOME_SITE, SITE } from "@/lib/seo";
import "./globals.css";

const texto = Instrument_Sans({ subsets: ["latin"], display: "swap", variable: "--fonte-texto" });
const codigo = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--fonte-codigo",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: NOME_SITE, template: `%s · ${NOME_SITE}` },
  description: DESCRICAO,
  ...(INDEXAR ? {} : { robots: { index: false, follow: false } }),
  formatDetection: { telephone: false, email: false, address: false },
};

const codigos = new Set(anos.flatMap((a) => registrosDoAno(a).map((r) => r.codigo)));
const AUSENTES = Object.fromEntries(anos.map((a) => [a, [...codigos].filter((c) => !registroDoAno(c, a))]));

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000", colorScheme: "dark light" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-nivel="iniciante" data-theme="dark" suppressHydrationWarning className={`${texto.variable} ${codigo.variable}`}>
      <head>
        {/* Síncrono de propósito: define tema e nível antes da primeira pintura. */}
        <script src="/prefs.js" />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-marca focus:px-4 focus:py-3 focus:font-semibold focus:text-sobre-marca"
        >
          Pular para o conteúdo
        </a>
        <OuvirAtalhos padrao={ANO_PADRAO} />
        <Cabecalho anos={anos} padrao={ANO_PADRAO} ausentes={AUSENTES} />
        <Breadcrumb padrao={ANO_PADRAO} />
        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[92rem] flex-1 px-4 py-8 outline-none sm:px-6">
          {children}
        </main>
        <footer className="border-t border-linha bg-superficie">
          <div className="mx-auto max-w-[92rem] space-y-3 px-4 py-8 text-sm text-suave sm:px-6">
            <p className="font-semibold text-tinta">
              Conteúdo educacional; não substitui orientação de profissional contábil nem a legislação oficial.
            </p>
            <p>
              {AVISO_ECD} Projeto independente, sem vínculo com a Receita Federal.{" "}
              <LinkAno base="/fontes" padrao={ANO_PADRAO}>
                Fontes e verificações
              </LinkAno>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
