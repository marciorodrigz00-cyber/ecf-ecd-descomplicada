import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { meta } from "@/lib/seo";
import { Incentivos } from "@/paginas/incentivos";

type Props = { params: Promise<{ ano: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => anos.filter((a) => a !== ANO_PADRAO).map((a) => ({ ano: String(a) }));

export async function generateMetadata({ params }: Props) {
  return meta({ titulo: "Incentivos fiscais", descricao: "Incentivos de IRPJ e CSLL e o que a LC 224/2025 mudou em cada um.", base: "/incentivos", ano: Number((await params).ano) });
}

export default async function Pagina({ params }: Props) {
  return <Incentivos ano={Number((await params).ano)} />;
}
