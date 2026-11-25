import { meta } from "@/lib/seo";
import { ANO_PADRAO } from "@/lib/conteudo";
import { Preencher } from "@/paginas/blocos";

export const metadata = meta({ titulo: "Roteiro de preenchimento", descricao: "Passo a passo da ECF: só os blocos do seu regime, na ordem do arquivo, com os erros a evitar em cada um.", base: "/preencher" });

export default function Pagina() {
  return <Preencher ano={ANO_PADRAO} />;
}