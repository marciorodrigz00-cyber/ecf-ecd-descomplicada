import { meta } from "@/lib/seo";
import { ANO_PADRAO } from "@/lib/conteudo";
import { SECOES } from "@/lib/rotas";
import { PaginaSecao } from "@/paginas";

type Props = { params: Promise<{ secao: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => SECOES.map((s) => ({ secao: s.slug }));

export async function generateMetadata({ params }: Props) {
  const { secao } = await params;
  const s = SECOES.find((x) => x.slug === secao)!;
  return meta({ titulo: s.titulo, descricao: s.iniciante, base: `/${secao}` });
}

export default async function Pagina({ params }: Props) {
  const { secao } = await params;
  return <PaginaSecao secao={SECOES.find((x) => x.slug === secao)!} ano={ANO_PADRAO} />;
}