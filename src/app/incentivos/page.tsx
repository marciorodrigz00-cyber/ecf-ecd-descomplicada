import { ANO_PADRAO } from "@/lib/conteudo";
import { meta } from "@/lib/seo";
import { Incentivos } from "@/paginas/incentivos";

export const metadata = meta({ titulo: "Incentivos fiscais", descricao: "Incentivos de IRPJ e CSLL e o que a LC 224/2025 mudou em cada um, com a fonte oficial.", base: "/incentivos" });

export default function Pagina() {
  return <Incentivos ano={ANO_PADRAO} />;
}
