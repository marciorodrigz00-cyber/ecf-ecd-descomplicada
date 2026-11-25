import { meta } from "@/lib/seo";
import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { SECOES } from "@/lib/rotas";
import { PaginaSecao } from "@/paginas";

type Props = { params: Promise<{ ano: string; secao: string }> };
export const dynamicParams = false;
export const generateStaticParams = () =>
  anos.filter((a) => a !== ANO_PADRAO).flatMap((a) => SECOES.map((s) => ({ ano: String(a), secao: s.slug })));

export async function generateMetadata({ params }: Props) {
  const { ano, secao } = await params;
  const s = SECOES.find((x) => x.slug === secao)!;
  return meta({ titulo: s.titulo, descricao: s.iniciante, base: `/${secao}`, ano: Number(ano) });
}

export default async function Pagina({ params }: Props) {
  const { ano, secao } = await params;
  return <PaginaSecao secao={SECOES.find((x) => x.slug === secao)!} ano={Number(ano)} />;
}