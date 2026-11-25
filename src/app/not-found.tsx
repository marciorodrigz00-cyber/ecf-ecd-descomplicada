import Link from "next/link";
import { estiloBotao } from "@/components/ui";

export const metadata = { title: "Página não encontrada" };

export default function NaoEncontrada() {
  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-3 max-w-prose text-suave">
        O endereço não existe ou não faz parte do ano-calendário escolhido. Confira o link ou volte ao início.
      </p>
      <Link href="/" className={`${estiloBotao()} mt-6`}>
        Voltar ao início
      </Link>
    </div>
  );
}