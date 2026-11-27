import Link from "next/link";
import { ArrowRight, ClipboardList, GraduationCap, Hammer } from "lucide-react";
import { Console } from "@/components/console";
import { CartaoRegra, EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { MarcarEstudada } from "@/components/layout/progresso";
import { CartaoPerfil } from "@/components/layout/perfil";
import { Atalhos, CaminhoAprender, CartaoTrilha, ComProgresso, Conquistas } from "@/components/layout/trilha";
import { CaixaRolavel, Cartao, Etiqueta, Nivel } from "@/components/ui";
import { ANO_PADRAO, anos, fontes, leiauteDoAno, linhaDoTempo, novidades, programa, rastreaveis, regra, regras } from "@/lib/conteudo";
import { ausentesPorAno, conferencia, didatico, divergencias, grafo, legendas, linhaRegime, nomeBloco, regimes, registrosDoBloco } from "@/lib/conteudo/leiautes";
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
  const card = "flex h-full flex-col rounded-2xl border-2 border-linha bg-superficie p-6 text-tinta no-underline transition-colors hover:border-marca";
  return (
    <div className="space-y-14">
      <CartaoPerfil anos={anos} padrao={ANO_PADRAO} ausentes={ausentesPorAno()} regimes={regimes.regimes.map(({ id, nome }) => ({ id, nome }))} />

      <section aria-labelledby="t-caminhos">
        <p className="font-mono text-sm text-suave">
          leiaute {leiaute.numero} · AC {ano}
        </p>
        <h1 id="t-caminhos" className="mt-1 text-3xl font-bold sm:text-4xl">
          Entenda e prepare a ECF
        </h1>
        <div className="mt-3 max-w-prose text-lg text-suave">
          <Nivel so="iniciante">Escolha por onde começar: aprender o que é a ECF, ou ir direto ao passo a passo do preenchimento.</Nivel>
          <Nivel so="profissional">Trilha de estudo ou roteiro de preenchimento por regime, com fonte e data de verificação em cada regra.</Nivel>
        </div>
        <p className="mt-3 max-w-prose rounded-lg bg-alerta-fundo px-4 py-2 text-sm text-alerta">{AVISO_ECD}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <CaminhoAprender ano={ano} padrao={ANO_PADRAO} className={card}>
            <GraduationCap aria-hidden size={32} className="text-marca" />
            <span className="mt-3 text-2xl font-bold">Estou aprendendo</span>
            <span className="mt-2 text-suave">O que é a ECF, quem entrega, os blocos e os exemplos, numa trilha em ordem.</span>
          </CaminhoAprender>
          <Link href={ir("/preencher")} prefetch={false} className={card} data-testid="caminho-preencher">
            <ClipboardList aria-hidden size={32} className="text-marca" />
            <span className="mt-3 text-2xl font-bold">Vou preencher</span>
            <span className="mt-2 text-suave">O passo a passo do arquivo para o regime da empresa, bloco por bloco.</span>
            <span className="mt-3 flex items-center gap-2 font-semibold">
              Abrir o roteiro <ArrowRight aria-hidden size={18} />
            </span>
          </Link>
        </div>
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

      <section aria-labelledby="t-novidades">
        <h2 id="t-novidades" className="text-2xl font-bold sm:text-3xl">
          Novidades conferidas
        </h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {novidades.slice(0, 3).map((n) => (
            <li key={n.id} className="rounded-2xl border border-linha bg-superficie p-5">
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
        <Link href={ir("/novidades")} prefetch={false} className="mt-2 inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
          Ver todas <ArrowRight aria-hidden size={18} />
        </Link>
      </section>

      <section aria-labelledby="t-mapa">
        <p className="font-mono text-sm text-suave">
          mapa de fluxo · leiaute {leiaute.numero} · AC {ano}
        </p>
        <h2 id="t-mapa" className="mt-1 text-2xl font-bold sm:text-3xl">
          Como os dados percorrem a ECF
        </h2>
        <div className="mt-3 max-w-prose text-lg text-suave">
          <Nivel so="iniciante">
            Nunca viu uma ECF? Pense nela como um dossiê: a empresa reúne a contabilidade e os cálculos de imposto em um único arquivo,
            dividido em capítulos. Clique em um capítulo, ou percorra todos em ordem.
          </Nivel>
          <Nivel so="profissional">
            Blocos, ligações e registros do leiaute {leiaute.numero} em consulta rápida, cada um com norma, vigência e data de verificação.
          </Nivel>
        </div>
        <div className="mt-3 mb-5">
          <Selo ano={ano} itens={[prazo, legendas.rastreio]} />
        </div>
        <Console
          key={ano}
          ano={ano}
          nos={nos}
          ligacoes={grafo.arestas.map((x) => ({ de: x.de, para: x.para, o: x.o, registro: x.base.registro, href: ir(urlRegistro(x.base.registro)) }))}
          regimes={regimes.regimes.map(({ id, nome }) => ({ id, nome }))}
        />
      </section>
    </div>
  );
}

/** Meu progresso: trilha, conquistas e atalhos. Sem contadores em zero para quem acabou de chegar. */
export function MeuProgresso({ ano }: { ano: number }) {
  const ir = (b: string) => rota(b, ano, ANO_PADRAO);
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Meu progresso</h1>
        <p className="mt-3 max-w-prose text-lg text-suave">O que você já estudou e abriu neste navegador, e por onde continuar.</p>
      </div>
      <ComProgresso
        convite={
          <Cartao className="p-6" data-testid="sem-progresso">
            <h2 className="text-xl font-bold">Você ainda não começou</h2>
            <p className="mt-2 max-w-prose text-suave">
              Quando você marcar uma seção como estudada ou abrir um bloco, o seu progresso aparece aqui. Nada sai deste navegador.
            </p>
            <Link href={ir("/o-que-e")} prefetch={false} className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
              Começar por “O que é” <ArrowRight aria-hidden size={18} />
            </Link>
          </Cartao>
        }
      >
        <section aria-labelledby="t-sua-trilha">
          <h2 id="t-sua-trilha" className="mb-4 text-2xl font-bold">
            Sua trilha
          </h2>
          <Cartao className="p-5">
            <CartaoTrilha ano={ano} padrao={ANO_PADRAO} />
          </Cartao>
        </section>
        <section aria-labelledby="t-conquistas">
          <h2 id="t-conquistas" className="mb-4 text-2xl font-bold">
            Conquistas
          </h2>
          <Conquistas />
        </section>
      </ComProgresso>

      <section aria-labelledby="t-trilha">
        <h2 id="t-trilha" className="text-2xl font-bold">
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

      <section aria-labelledby="t-atalhos">
        <h2 id="t-atalhos" className="mb-4 text-2xl font-bold">
          Atalhos
        </h2>
        <Cartao className="p-5">
          <Atalhos ano={ano} padrao={ANO_PADRAO} />
        </Cartao>
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
