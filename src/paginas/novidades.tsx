import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FiltroNovidades } from "@/components/ecf/filtro-novidades";
import { comTermos } from "@/components/ecf/com-termos";
import { EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { Cartao, Etiqueta, Nivel } from "@/components/ui";
import { ANO_PADRAO, leiauteDoAno, novidades } from "@/lib/conteudo";
import { registroDoAno } from "@/lib/conteudo/leiautes";
import { data, semQuebra } from "@/lib/formatos";
import { rota } from "@/lib/rotas";
import { TIPOS_NOVIDADE, type Novidade } from "@/schemas";
import { urlRegistro } from "./blocos";

const TIPO: Record<Novidade["tipo"], string> = {
  programa: "Programa",
  leiaute: "Leiaute",
  norma: "Norma",
  comunicado: "Comunicado",
};

/** "1 a 12" quando são muitos seguidos; senão, lista. */
function textoLeiautes(l: string[]): string {
  if (l.length === 1) return `Leiaute ${l[0]}`;
  return l.length > 2 ? `Leiautes ${l[0]} a ${l.at(-1)}` : `Leiautes ${l.join(" e ")}`;
}

function Cabecalho({ n }: { n: Novidade }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-suave">
      <time dateTime={n.data} className="font-mono">
        {data(n.data)}
      </time>
      <Etiqueta>{TIPO[n.tipo]}</Etiqueta>
      <Etiqueta>{textoLeiautes(n.leiautes)}</Etiqueta>
      <EtiquetaStatus status={n.status} />
    </p>
  );
}

export function Novidades({ ano }: { ano: number }) {
  const usados = TIPOS_NOVIDADE.filter((t) => novidades.some((n) => n.tipo === t));
  return (
    <div className="space-y-8">
      <Cartao className="max-w-3xl">
        <p>
          Cada item foi lido na fonte oficial antes de entrar aqui. O monitor das fontes só prepara rascunhos:
          nada é publicado sem que uma pessoa confira e aprove.
        </p>
      </Cartao>
      <FiltroNovidades
        leiaute={leiauteDoAno(ano).numero}
        tipos={usados.map((t) => ({ valor: t, texto: TIPO[t] }))}
        itens={novidades.map((n) => ({
          id: n.id,
          tipo: n.tipo,
          leiautes: n.leiautes,
          corpo: (
            <Cartao>
              <Cabecalho n={n} />
              <h2 className="mt-3 text-xl font-bold">
                <Link href={rota(`/novidades/${n.slug}`, ano, ANO_PADRAO)} prefetch={false} className="underline underline-offset-4">
                  {n.titulo}
                </Link>
              </h2>
              <div className="mt-2 max-w-prose">
                <Nivel so="iniciante">{n.iniciante}</Nivel>
                <Nivel so="profissional">{semQuebra(n.profissional)}</Nivel>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 text-sm text-suave">
                <span>{semQuebra(n.norma)}</span>
                <LinkFonte fonte={n.fonte} curto />
              </p>
            </Cartao>
          ),
        }))}
      />
    </div>
  );
}

export function PaginaNovidade({ slug, ano }: { slug: string; ano: number }) {
  const n = novidades.find((x) => x.slug === slug)!;
  const registros = n.registros.filter((r) => registroDoAno(r, ano));
  return (
    <article className="space-y-8">
      <div>
        <Cabecalho n={n} />
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{n.titulo}</h1>
        <div className="mt-4">
          <Selo ano={ano} itens={[n]} />
        </div>
      </div>
      <div className="max-w-prose text-lg">
        <Nivel so="iniciante">{comTermos(n.iniciante)}</Nivel>
        <Nivel so="profissional">{comTermos(semQuebra(n.profissional))}</Nivel>
      </div>
      {n.fazer && (
        <Cartao className="max-w-3xl">
          <h2 className="text-lg font-semibold">O que fazer</h2>
          <p className="mt-2">{n.fazer}</p>
        </Cartao>
      )}
      {registros.length > 0 && (
        <section aria-labelledby="t-reg">
          <h2 id="t-reg" className="text-lg font-semibold">
            Registros citados
          </h2>
          <ul className="mt-2 flex flex-wrap gap-3">
            {registros.map((r) => (
              <li key={r}>
                <Link
                  href={rota(urlRegistro(r), ano, ANO_PADRAO)}
                  prefetch={false}
                  className="inline-flex min-h-11 items-center rounded-lg border border-controle bg-superficie px-4 font-mono text-tinta"
                >
                  {r}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <dl className="grid max-w-3xl gap-x-6 gap-y-2 text-suave sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">Norma</dt>
        <dd>{semQuebra(n.norma)}</dd>
        <dt className="font-semibold">Vale para</dt>
        <dd>{textoLeiautes(n.leiautes)}</dd>
        <dt className="font-semibold">Fonte</dt>
        <dd>
          <LinkFonte fonte={n.fonte} /> ({semQuebra(n.fonte.trecho)})
        </dd>
        <dt className="font-semibold">Verificado em</dt>
        <dd>{data(n.verificadoEm)}</dd>
      </dl>
      <Link href={rota("/novidades", ano, ANO_PADRAO)} className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
        Todas as novidades <ArrowRight aria-hidden size={18} />
      </Link>
    </article>
  );
}
