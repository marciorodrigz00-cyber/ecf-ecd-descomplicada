import { anos, leiauteDoAno } from "@/lib/conteudo";
import { registrosDoBloco } from "@/lib/conteudo/leiautes";
import { montarIndice } from "@/lib/busca/indice";
import { resumoRegistro } from "@/lib/exemplos/por-registro";

/** Arquivos estáticos, buscados só quando a pessoa abre um registro no mapa ou a busca. */
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () =>
  anos.flatMap((a) => ["busca", ...leiauteDoAno(a).blocos.map((b) => b.letra.toLowerCase())].map((n) => ({ ano: String(a), arquivo: `${n}.json` })));

export async function GET(_: Request, { params }: { params: Promise<{ ano: string; arquivo: string }> }) {
  const { ano, arquivo } = await params;
  if (arquivo === "busca.json") return Response.json(montarIndice(Number(ano)));
  const letra = arquivo[0]!.toUpperCase();
  return Response.json(registrosDoBloco(letra, Number(ano)).map((r) => resumoRegistro(r.codigo, Number(ano))));
}
