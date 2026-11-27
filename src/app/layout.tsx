import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { Breadcrumb, Cabecalho, LinkAno } from "@/components/layout/cabecalho";
import { OuvirAtalhos } from "@/components/layout/trilha";
import { ANO_PADRAO, anos, leiauteDoAno } from "@/lib/conteudo";
import { ausentesPorAno, nomeBloco, regimes } from "@/lib/conteudo/leiautes";
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

const AUSENTES = ausentesPorAno();
// Para o menu lateral: número do leiaute e blocos de cada ano.
const LEIAUTES = Object.fromEntries(anos.map((a) => [a, leiauteDoAno(a).numero]));
const BLOCOS = Object.fromEntries(anos.map((a) => [a, leiauteDoAno(a).blocos.map((b) => ({ letra: b.letra, curto: nomeBloco(b.letra, a).curto }))]));

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000", colorScheme: "dark light" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-nivel="iniciante" data-theme="dark" suppressHydrationWarning className={`${texto.variable} ${codigo.variable}`}>
      <head>
        {/* Síncrono de propósito: define tema e nível antes da primeira pintura. */}
        <script src="/prefs.js" />
      </head>
      <body className="antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-marca focus:px-4 focus:py-3 focus:font-semibold focus:text-sobre-marca"
        >
          Pular para o conteúdo
        </a>
        <OuvirAtalhos padrao={ANO_PADRAO} />
        <Cabecalho anos={anos} padrao={ANO_PADRAO} ausentes={AUSENTES} regimes={regimes.regimes} leiautes={LEIAUTES} blocos={BLOCOS} />
        <div className="flex min-h-dvh flex-col lg:pl-[var(--lateral)]">
          <Breadcrumb padrao={ANO_PADRAO} />
          <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[84rem] flex-1 px-4 py-8 outline-none sm:px-6 lg:px-10">
            {children}
          </main>
          <footer className="border-t border-linha">
            <div className="mx-auto max-w-[84rem] space-y-1 px-4 py-6 text-xs text-suave sm:px-6 lg:px-10">
              <p className="font-semibold">Conteúdo educacional; não substitui orientação de profissional contábil nem a legislação oficial.</p>
              <p>
                {AVISO_ECD} Projeto independente, sem vínculo com a Receita Federal.{" "}
                <LinkAno base="/fontes" padrao={ANO_PADRAO}>
                  Fontes e verificações
                </LinkAno>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
