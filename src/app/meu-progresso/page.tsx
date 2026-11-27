import { ANO_PADRAO } from "@/lib/conteudo";
import { meta } from "@/lib/seo";
import { MeuProgresso } from "@/paginas";

export const metadata = meta({ titulo: "Meu progresso", descricao: "Trilha, conquistas e atalhos deste navegador.", base: "/meu-progresso" });

export default function Pagina() {
  return <MeuProgresso ano={ANO_PADRAO} />;
}
