import { meta } from "@/lib/seo";
import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { Preencher } from "@/paginas/blocos";

type Props = { params: Promise<{ ano: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => anos.filter((a) => a !== ANO_PADRAO).map((a) => ({ ano: String(a) }));

export async function generateMetadata({ params }: Props) {
  return meta({ titulo: "Roteiro de preenchimento", descricao: "Passo a passo da ECF: só os blocos do seu regime, na ordem do arquivo, com os erros a evitar em cada um.", base: "/preencher", ano: Number((await params).ano) });
}

export default async function Pagina({ params }: Props) {
  return <Preencher ano={Number((await params).ano)} />;
}