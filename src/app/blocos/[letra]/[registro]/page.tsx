import { meta } from "@/lib/seo";
import { ANO_PADRAO } from "@/lib/conteudo";
import { registroDoAno, registrosDoAno } from "@/lib/conteudo/leiautes";
import { PaginaRegistro } from "@/paginas/blocos";

type Props = { params: Promise<{ letra: string; registro: string }> };
export const dynamicParams = false;
export const generateStaticParams = () =>
  registrosDoAno(ANO_PADRAO).map((r) => ({ letra: r.codigo[0]!.toLowerCase(), registro: r.codigo.toLowerCase() }));

export async function generateMetadata({ params }: Props) {
  const { letra, registro } = await params;
  const r = registroDoAno(registro.toUpperCase(), ANO_PADRAO)!;
  return meta({ titulo: `${r.codigo}: ${r.nome}`, descricao: `Registro ${r.codigo} da ECF: o que é, exemplo preenchido, ${r.campos.length} campos e regras de validação. ${r.descricao[0] ?? ""}`, base: `/blocos/${letra}/${registro}` });
}

export default async function Pagina({ params }: Props) {
  return <PaginaRegistro codigo={(await params).registro.toUpperCase()} ano={ANO_PADRAO} />;
}