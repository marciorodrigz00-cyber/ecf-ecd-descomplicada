import { ANO_PADRAO } from "@/lib/conteudo";
import { incentivos } from "@/lib/conteudo/incentivos";
import { meta } from "@/lib/seo";
import { PaginaIncentivo } from "@/paginas/incentivos";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => incentivos.map((i) => ({ slug: i.id }));

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const i = incentivos.find((x) => x.id === slug)!;
  return meta({ titulo: i.nome, descricao: i.iniciante, base: `/incentivos/${slug}` });
}

export default async function Pagina({ params }: Props) {
  return <PaginaIncentivo id={(await params).slug} ano={ANO_PADRAO} />;
}
