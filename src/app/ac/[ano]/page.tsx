import { DESCRICAO, meta } from "@/lib/seo";
import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { Inicio } from "@/paginas";

type Props = { params: Promise<{ ano: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => anos.filter((a) => a !== ANO_PADRAO).map((a) => ({ ano: String(a) }));

export async function generateMetadata({ params }: Props) {
  return meta({ titulo: "Início", descricao: DESCRICAO, base: "/", ano: Number((await params).ano) });
}

export default async function Pagina({ params }: Props) {
  return <Inicio ano={Number((await params).ano)} />;
}