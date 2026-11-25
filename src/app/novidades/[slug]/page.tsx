import { meta } from "@/lib/seo";
import { ANO_PADRAO, novidades } from "@/lib/conteudo";
import { PaginaNovidade } from "@/paginas/novidades";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => novidades.map((n) => ({ slug: n.slug }));

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const n = novidades.find((x) => x.slug === slug)!;
  return meta({ titulo: n.titulo, descricao: n.iniciante, base: `/novidades/${slug}` });
}

export default async function Pagina({ params }: Props) {
  return <PaginaNovidade slug={(await params).slug} ano={ANO_PADRAO} />;
}
