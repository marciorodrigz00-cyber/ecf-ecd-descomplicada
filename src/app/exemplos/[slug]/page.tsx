import { meta } from "@/lib/seo";
import { ANO_PADRAO } from "@/lib/conteudo";
import { exemplo, exemplos } from "@/lib/exemplos";
import { PaginaExemplo } from "@/paginas/exemplos";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => exemplos.map((e) => ({ slug: e.dados.slug }));

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const d = exemplo(slug)!.dados;
  return meta({ titulo: d.titulo, descricao: `Exemplo fictício de ECF, ${d.regime.toLowerCase()}: os números e o arquivo explicado linha a linha.`, base: `/exemplos/${slug}` });
}

export default async function Pagina({ params }: Props) {
  return <PaginaExemplo slug={(await params).slug} ano={ANO_PADRAO} />;
}