import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { meta } from "@/lib/seo";
import { MeuProgresso } from "@/paginas";

type Props = { params: Promise<{ ano: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => anos.filter((a) => a !== ANO_PADRAO).map((a) => ({ ano: String(a) }));

export async function generateMetadata({ params }: Props) {
  return meta({ titulo: "Meu progresso", descricao: "Trilha, conquistas e atalhos deste navegador.", base: "/meu-progresso", ano: Number((await params).ano) });
}

export default async function Pagina({ params }: Props) {
  return <MeuProgresso ano={Number((await params).ano)} />;
}
