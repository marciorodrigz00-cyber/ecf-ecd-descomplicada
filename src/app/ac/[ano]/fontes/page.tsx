import { meta } from "@/lib/seo";
import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { PaginaFontes } from "@/paginas";

type Props = { params: Promise<{ ano: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => anos.filter((a) => a !== ANO_PADRAO).map((a) => ({ ano: String(a) }));

export async function generateMetadata({ params }: Props) {
  return meta({ titulo: "Fontes e verificações", descricao: "Fontes oficiais usadas neste site, com a data em que cada regra foi verificada.", base: "/fontes", ano: Number((await params).ano) });
}

export default async function Pagina({ params }: Props) {
  return <PaginaFontes ano={Number((await params).ano)} />;
}