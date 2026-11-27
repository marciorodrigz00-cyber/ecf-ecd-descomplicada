import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { incentivos } from "@/lib/conteudo/incentivos";
import { meta } from "@/lib/seo";
import { PaginaIncentivo } from "@/paginas/incentivos";

type Props = { params: Promise<{ ano: string; slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => anos.filter((a) => a !== ANO_PADRAO).flatMap((a) => incentivos.map((i) => ({ ano: String(a), slug: i.id })));

export async function generateMetadata({ params }: Props) {
  const { ano, slug } = await params;
  const i = incentivos.find((x) => x.id === slug)!;
  return meta({ titulo: i.nome, descricao: i.iniciante, base: `/incentivos/${slug}`, ano: Number(ano) });
}

export default async function Pagina({ params }: Props) {
  const { ano, slug } = await params;
  return <PaginaIncentivo id={slug} ano={Number(ano)} />;
}
