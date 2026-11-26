import { DESCRICAO, NOME_SITE, meta } from "@/lib/seo";
import { ANO_PADRAO } from "@/lib/conteudo";
import { Inicio } from "@/paginas";

export const metadata = { ...meta({ titulo: NOME_SITE, descricao: DESCRICAO, base: "/" }), title: { absolute: `${NOME_SITE} (ECD em breve): a ECF bloco a bloco` } };

export default function Pagina() {
  return <Inicio ano={ANO_PADRAO} />;
}