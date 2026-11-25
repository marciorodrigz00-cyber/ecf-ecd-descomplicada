import { meta } from "@/lib/seo";
import { ANO_PADRAO, anos } from "@/lib/conteudo";
import { registroDoAno, registrosDoAno } from "@/lib/conteudo/leiautes";
import { PaginaRegistro } from "@/paginas/blocos";

type Props = { params: Promise<{ ano: string; letra: string; registro: string }> };
export const dynamicParams = false;
export const generateStaticParams = () =>
  anos
    .filter((a) => a !== ANO_PADRAO)
    .flatMap((a) =>
      registrosDoAno(a).map((r) => ({
        ano: String(a),
        letra: r.codigo[0]!.toLowerCase(),
        registro: r.codigo.toLowerCase(),
      })),
    );

export async function generateMetadata({ params }: Props) {
  const { ano, letra, registro } = await params;
  const r = registroDoAno(registro.toUpperCase(), Number(ano))!;
  return meta({ titulo: `${r.codigo}: ${r.nome}`, descricao: `Registro ${r.codigo} da ECF: o que é, exemplo preenchido, ${r.campos.length} campos e regras de validação. ${r.descricao[0] ?? ""}`, base: `/blocos/${letra}/${registro}`, ano: Number(ano) });
}

export default async function Pagina({ params }: Props) {
  const { ano, registro } = await params;
  return <PaginaRegistro codigo={registro.toUpperCase()} ano={Number(ano)} />;
}