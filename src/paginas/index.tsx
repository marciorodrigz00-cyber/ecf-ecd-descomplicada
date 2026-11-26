import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { Console } from "@/components/console";
import { CartaoRegra, EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { MarcarEstudada } from "@/components/layout/progresso";
import { Atalhos, CartaoTrilha, Conquistas } from "@/components/layout/trilha";
import { CaixaRolavel, Cartao, Etiqueta, Nivel } from "@/components/ui";
import { ANO_PADRAO, fontes, leiauteDoAno, linhaDoTempo, novidades, programa, rastreaveis, regra, regras } from "@/lib/conteudo";
import { conferencia, didatico, divergencias, grafo, legendas, linhaRegime, nomeBloco, regimes, registrosDoBloco } from "@/lib/conteudo/leiautes";
import { data, inteiro } from "@/lib/formatos";
import { SECOES, rota, type Secao } from "@/lib/rotas";
import { AVISO_ECD } from "@/lib/seo";
import { Blocos, urlRegistro } from "./blocos";
import { Exemplos, PaginaSimulador } from "./exemplos";
import { Glossario } from "./glossario";
import { Novidades } from "./novidades";
import { Importancia, OQueE, QuemDeveEntregar } from "./secoes";

const PRONTAS: Record<string, (p: { ano: number }) => React.ReactNode> = {
  "o-que-e": OQueE,
  importancia: Importancia,
  "quem-deve-entregar": QuemDeveEntregar,
  blocos: Blocos,
  exemplos: Exemplos,
  simulador: PaginaSimulador,
  novidades: Novidades,
  glossario: Glossario,
};

export function Inicio({ ano }: { ano: number }) {
  const leiaute = leiauteDoAno(ano);
  const prazo = regra("prazo-regra-geral", ano);
  const ir = (b: string) => rota(b, ano, ANO_PADRAO);
  const nos = [
    ...grafo.externos.map((x) => ({ id: x.id, letra: x.id === "ECFA" ? "ECF" : x.id, curto: x.nome, bloco: null })),
    ...leiaute.blocos.map((b) => {
      const d = didatico(b.letra);
      const n = nomeBloco(b.letra, ano);
      const l = linhaRegime(b.letra);
      return {
        id: b.letra,
        letra: b.letra,
        curto: n.curto,
        bloco: {
          nome: n.nome,
          href: ir(`/blocos/${b.letra.toLowerCase()}`),
          objetivo: n.objetivo,
          analogia: d.analogia,
          nota: l.nota,
          celulas: l.celulas,
          erros: d.erros.map((e) => ({ titulo: e.titulo, comoEvitar: e.comoEvitar, registro: e.registro, href: ir(urlRegistro(e.registro)) })),
          registros: registrosDoBloco(b.letra, ano).map((r) => ({ codigo: r.codigo, nome: r.nome, campos: r.campos.length, href: ir(urlRegistro(r.codigo)) })),
        },
      };
    }),
  ];
  return (
    <div className="space-y-14">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          <div className="mb-5">
            <p className="font-mono text-sm text-suave">
              mapa de fluxo · leiaute {leiaute.numero} · AC {ano}
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Como os dados percorrem a ECF</h1>
            <div className="mt-3 max-w-prose text-lg text-suave">
              <Nivel so="iniciante">
                Nunca viu uma ECF? Pense nela como um dossiê: a empresa reúne a contabilidade e os cálculos de imposto em
                um único arquivo, dividido em capítulos. Clique em um capítulo, ou percorra todos em ordem.
              </Nivel>
              <Nivel so="profissional">
                Blocos, ligações e registros do leiaute {leiaute.numero} em consulta rápida, cada um com norma, vigência e
                data de verificação.
              </Nivel>
            </div>
            <p className="mt-3 max-w-prose rounded-lg bg-alerta-fundo px-4 py-2 text-sm text-alerta">{AVISO_ECD}</p>
            <div className="mt-3">
              <Selo ano={ano} itens={[prazo, legendas.rastreio]} />
            </div>
          </div>
          <Console
            key={ano}
            ano={ano}
            nos={nos}
            ligacoes={grafo.arestas.map((x) => ({ de: x.de, para: x.para, o: x.o, registro: x.base.registro, href: ir(urlRegistro(x.base.registro)) }))}
            regimes={regimes.regimes.map(({ id, nome }) => ({ id, nome }))}
          />
        </div>
        <aside aria-label="Trilha, novidades e atalhos" className="grid grid-cols-1 content-start gap-5 md:grid-cols-3 xl:grid-cols-1">
          <Cartao className="p-5">
            <h2 className="mb-3 text-xl font-bold">Sua trilha</h2>
            <CartaoTrilha ano={ano} padrao={ANO_PADRAO} />
          </Cartao>
          <Cartao className="p-5">
            <h2 className="mb-3 text-xl font-bold">Novidades conferidas</h2>
            <ul className="divide-y divide-linha">
              {novidades.slice(0, 3).map((n) => (
                <li key={n.id} className="py-3 first:pt-0">
                  <p className="font-mono text-sm text-suave">
                    <time dateTime={n.data}>{data(n.data)}</time> · {n.tipo}
                  </p>
                  <Link href={ir(`/novidades/${n.slug}`)} prefetch={false} className="inline-block py-1 font-semibold underline underline-offset-4">
                    {n.titulo}
                  </Link>
                  <div className="mt-1">
                    <EtiquetaStatus status={n.status} />
                  </div>
                </li>
              ))}
            </ul>
            <Link href={ir("/novidades")} prefetch={false} className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
              Ver todas <ArrowRight aria-hidden size={18} />
            </Link>
          </Cartao>
          <Cartao className="p-5">
            <h2 className="mb-3 text-xl font-bold">Atalhos</h2>
            <Atalhos ano={ano} padrao={ANO_PADRAO} />
          </Cartao>
        </aside>
      </div>

      <section aria-labelledby="t-conquistas">
        <h2 id="t-conquistas" className="mb-4 text-2xl font-bold sm:text-3xl">
          Conquistas
        </h2>
        <Conquistas />
      </section>

      <section aria-labelledby="t-trilha">
        <h2 id="t-trilha" className="text-2xl font-bold sm:text-3xl">
          Trilha de estudo
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECOES.map((s, i) => (
            <li key={s.slug}>
              <Link
                href={ir(`/${s.slug}`)}
                prefetch={false}
                className="block h-full rounded-2xl border border-linha bg-superficie p-5 text-tinta no-underline hover:border-marca"
              >
                <span className="font-mono text-sm text-marca">Etapa {inteiro(i + 1)}</span>
                <h3 className="mt-1 text-lg font-semibold">{s.titulo}</h3>
                <div className="mt-2 text-suave">
                  <Nivel so="iniciante">{s.iniciante}</Nivel>
                  <Nivel so="profissional">{s.profissional}</Nivel>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="t-agora">
        <h2 id="t-agora" className="text-2xl font-bold sm:text-3xl">
          O que vale para o ano-calendário {ano}
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <CartaoRegra regra={prazo} />
          <Cartao>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Programa da ECF</h3>
              <EtiquetaStatus status={programa.status} />
            </div>
            <p className="mt-3 text-lg">
              Versão {programa.versao} na página oficial de download, atualizada em {data(programa.paginaAtualizadaEm)}.
            </p>
            <p className="mt-2 text-suave">Confira sempre a página oficial antes de instalar.</p>
            <p className="mt-4 text-sm text-suave">
              <LinkFonte fonte={programa.fonte} /> · comunicado verificado em{" "}
              {data(programa.verificadoEm)}
            </p>
          </Cartao>
        </div>
      </section>
    </div>
  );
}

function Topo({
  titulo,
  ano,
  itens,
  children,
}: {
  titulo: string;
  ano: number;
  itens?: { verificadoEm: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold sm:text-4xl">{titulo}</h1>
      {children && <div className="mt-3 max-w-prose text-lg text-suave">{children}</div>}
      <div className="mt-4">
        <Selo ano={ano} itens={itens} />
      </div>
    </div>
  );
}

function EmConstrucao({ fase }: { fase: number }) {
  return (
    <Cartao className="max-w-2xl">
      <Etiqueta tom="alerta">
        <Hammer aria-hidden size={16} /> Em construção
      </Etiqueta>
      <p className="mt-3">O conteúdo desta página entra na fase {inteiro(fase)} do projeto.</p>
    </Cartao>
  );
}

export function PaginaSecao({ secao, ano }: { secao: Secao; ano: number }) {
  const Pronta = PRONTAS[secao.slug];
  return (
    <>
      <Topo titulo={secao.titulo} ano={ano} itens={Pronta ? [...regras, ...linhaDoTempo] : undefined}>
        <Nivel so="iniciante">{secao.iniciante}</Nivel>
        <Nivel so="profissional">{secao.profissional}</Nivel>
      </Topo>
      {Pronta ? (
        <Pronta ano={ano} />
      ) : (
        <EmConstrucao fase={secao.fase} />
      )}
      <div className="mt-8">
        <MarcarEstudada slug={secao.slug} />
      </div>
    </>
  );
}

export function PaginaFontes({ ano }: { ano: number }) {
  return (
    <>
      <Topo titulo="Fontes e verificações" ano={ano}>
        Toda regra deste site aponta para uma fonte oficial. Aqui está o que foi verificado e quando.
      </Topo>
      <h2 className="mb-4 text-2xl font-bold">Fontes monitoradas</h2>
      <CaixaRolavel rotulo="Tabela de fontes oficiais">
        <table className="w-full min-w-2xl text-left">
          <thead className="border-b border-linha text-sm">
            <tr>
              <th scope="col" className="p-3">Fonte</th>
              <th scope="col" className="p-3">Órgão</th>
              <th scope="col" className="p-3">Papel</th>
              <th scope="col" className="p-3">Observação</th>
            </tr>
          </thead>
          <tbody>
            {fontes.map((f) => (
              <tr key={f.id} className="border-b border-linha last:border-0">
                <td className="p-3">
                  <LinkFonte fonte={{ id: f.id, url: f.url, trecho: f.nome }} />
                </td>
                <td className="p-3">{f.orgao}</td>
                <td className="p-3">{f.papel === "primaria" ? "Primária" : "Secundária"}</td>
                <td className="p-3">{f.observacao ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CaixaRolavel>
      <h2 className="mt-10 mb-4 text-2xl font-bold">Registros e campos</h2>
      <p className="max-w-prose">
        {inteiro(conferencia(ano).codigos.length)} registros conferidos em {data(conferencia(ano).verificadoEm)}.{" "}
        {conferencia(ano).metodo}
      </p>
      <h3 className="mt-5 mb-2 text-lg font-semibold">Divergências encontradas nos próprios manuais</h3>
      <ul className="list-disc space-y-1 pl-5">
        {divergencias.map((d) => (
          <li key={d.onde + d.texto}>
            <strong>{d.onde}</strong> (leiautes {d.leiautes.join(" e ")}): {d.texto}
          </li>
        ))}
      </ul>
      <h2 className="mt-10 mb-4 text-2xl font-bold">Itens verificados</h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {rastreaveis.map((r) => (
          <li key={r.id}>
            <Cartao className="h-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  {"titulo" in r ? r.titulo : "versao" in r ? `Programa da ECF ${r.versao}` : `Leiaute ${r.numero}`}
                </h3>
                <EtiquetaStatus status={r.status} />
              </div>
              <p className="mt-2 text-sm text-suave">{r.norma}</p>
              <p className="text-sm text-suave">{r.fonte.trecho}</p>
              <p className="text-sm text-suave">Verificado em {data(r.verificadoEm)}</p>
            </Cartao>
          </li>
        ))}
      </ul>
    </>
  );
}
