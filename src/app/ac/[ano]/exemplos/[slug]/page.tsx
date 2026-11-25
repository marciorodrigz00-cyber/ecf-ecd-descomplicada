import { meta } from "@/lib/seo";
import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { exemplo, exemplos } from "@/lib/exemplos";
import { PaginaExemplo } from "@/paginas/exemplos";

type Props = { params: Promise<{ ano: string; slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () =>
  anos
    .filter((a) => a !== ANO_PADRAO)
    .flatMap((a) => exemplos.map((e) => ({ ano: String(a), slug: e.dados.slug })));

export async function generateMetadata({ params }: Props) {
  const { ano, slug } = await params;
  const d = exemplo(slug)!.dados;
  return meta({ titulo: d.titulo, descricao: `Exemplo fictício de ECF, ${d.regime.toLowerCase()}: os números e o arquivo explicado linha a linha.`, base: `/exemplos/${slug}`, ano: Number(ano) });
}

export default async function Pagina({ params }: Props) {
  const { ano, slug } = await params;
  return <PaginaExemplo slug={slug} ano={Number(ano)} />;
}