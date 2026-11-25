import Link from "next/link";
import { FiltroGlossario } from "@/components/ecf/filtro-glossario";
import { EtiquetaStatus, LinkFonte } from "@/components/ecf/rastreio";
import { Cartao, Nivel } from "@/components/ui";
import { normalizar } from "@/lib/busca";
import { ANO_PADRAO, glossario } from "@/lib/conteudo";
import { registroDoAno } from "@/lib/conteudo/leiautes";
import { semQuebra } from "@/lib/formatos";
import { rota } from "@/lib/rotas";
import { urlRegistro } from "./blocos";

export function Glossario({ ano }: { ano: number }) {
  return (
    <FiltroGlossario
      itens={glossario.map((t) => ({
        id: t.id,
        letra: normalizar(t.termo)[0]!.toUpperCase(),
        chave: normalizar([t.termo, ...t.sinonimos, t.iniciante, t.profissional].join(" ")),
        corpo: (
          <Cartao className="h-full p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold first-letter:uppercase">{t.termo}</h2>
              <EtiquetaStatus status={t.status} />
            </div>
            {t.sinonimos.length > 0 && <p className="mt-1 text-sm text-suave">Também: {t.sinonimos.join(", ")}</p>}
            <div className="mt-3 max-w-prose">
              <Nivel so="iniciante">{t.iniciante}</Nivel>
              <Nivel so="profissional">{t.profissional}</Nivel>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-suave">
              <span>{semQuebra(t.norma)}</span>
              <LinkFonte fonte={t.fonte} curto />
              {t.registros
                .filter((r) => registroDoAno(r, ano))
                .map((r) => (
                  <Link key={r} href={rota(urlRegistro(r), ano, ANO_PADRAO)} prefetch={false} className="inline-block py-1 font-mono underline underline-offset-4">
                    {r}
                  </Link>
                ))}
            </p>
          </Cartao>
        ),
      }))}
    />
  );
}
