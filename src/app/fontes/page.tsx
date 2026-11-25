import { meta } from "@/lib/seo";
import { ANO_PADRAO } from "@/lib/conteudo";
import { PaginaFontes } from "@/paginas";

export const metadata = meta({ titulo: "Fontes e verificações", descricao: "Fontes oficiais usadas neste site, com a data em que cada regra foi verificada.", base: "/fontes" });

export default function Pagina() {
  return <PaginaFontes ano={ANO_PADRAO} />;
}