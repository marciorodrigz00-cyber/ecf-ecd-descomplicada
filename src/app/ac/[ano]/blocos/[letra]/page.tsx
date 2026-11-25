import { meta } from "@/lib/seo";
import { didatico } from "@/lib/conteudo/leiautes";
import { ANO_PADRAO, leiautes } from "@/lib/conteudo";
import { PaginaBloco } from "@/paginas/blocos";

type Props = { params: Promise<{ ano: string; letra: string }> };
export const dynamicParams = false;
export const generateStaticParams = () =>
  leiautes.filter((l) => l.anoCalendario !== ANO_PADRAO).flatMap((l) => l.blocos.map((b) => ({ ano: String(l.anoCalendario), letra: b.letra.toLowerCase() })));

export async function generateMetadata({ params }: Props) {
  const { ano, letra } = await params;
  const d = didatico(letra.toUpperCase());
  return meta({ titulo: `Bloco ${letra.toUpperCase()}: ${d.curto}`, descricao: d.objetivo, base: `/blocos/${letra}`, ano: Number(ano) });
}

export default async function Pagina({ params }: Props) {
  const { ano, letra } = await params;
  return <PaginaBloco letra={letra} ano={Number(ano)} />;
}