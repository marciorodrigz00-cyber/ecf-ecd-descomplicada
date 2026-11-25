import { meta } from "@/lib/seo";
import { didatico } from "@/lib/conteudo/leiautes";
import { ANO_PADRAO, leiauteDoAno } from "@/lib/conteudo";
import { PaginaBloco } from "@/paginas/blocos";

type Props = { params: Promise<{ letra: string }> };
export const dynamicParams = false;
export const generateStaticParams = () =>
  leiauteDoAno(ANO_PADRAO).blocos.map((b) => ({ letra: b.letra.toLowerCase() }));

export async function generateMetadata({ params }: Props) {
  const { letra } = await params;
  const d = didatico(letra.toUpperCase());
  return meta({ titulo: `Bloco ${letra.toUpperCase()}: ${d.curto}`, descricao: d.objetivo, base: `/blocos/${letra}` });
}

export default async function Pagina({ params }: Props) {
  return <PaginaBloco letra={(await params).letra} ano={ANO_PADRAO} />;
}