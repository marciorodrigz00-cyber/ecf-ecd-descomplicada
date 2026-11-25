import { meta } from "@/lib/seo";
import { ANO_PADRAO, anos, novidades } from "@/lib/conteudo";
import { PaginaNovidade } from "@/paginas/novidades";

type Props = { params: Promise<{ ano: string; slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () =>
  anos.filter((a) => a !== ANO_PADRAO).flatMap((a) => novidades.map((n) => ({ ano: String(a), slug: n.slug })));

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const n = novidades.find((x) => x.slug === slug)!;
  // A novidade é a mesma em qualquer ano: o endereço canônico é um só.
  return meta({ titulo: n.titulo, descricao: n.iniciante, base: `/novidades/${slug}`, canonico: `/novidades/${slug}` });
}

export default async function Pagina({ params }: Props) {
  const { ano, slug } = await params;
  return <PaginaNovidade slug={slug} ano={Number(ano)} />;
}
