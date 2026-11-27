import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, Hammer, ListChecks } from "lucide-react";
import { EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { MarcarEstudada } from "@/components/layout/progresso";
import { AvisoDoRegime, CartaoEntrega } from "@/components/layout/visao-geral";
import { Atalhos, CaminhoAprender, CartaoContinuar, CartaoTrilha, ComProgresso, Conquistas } from "@/components/layout/trilha";
import { CaixaRolavel, Cartao, Etiqueta, Nivel } from "@/components/ui";
import { ANO_PADRAO, fontes, leiauteDoAno, linhaDoTempo, novidades, programa, rastreaveis, regra, regras, textoDoValor, verificacaoMaisAntiga } from "@/lib/conteudo";
import { conferencia, divergencias, registrosDoBloco } from "@/lib/conteudo/leiautes";
import { cn } from "@/lib/cn";
import { resumoRegistro } from "@/lib/exemplos/por-registro";
import { prazoDoAno } from "@/lib/prazo";
import { data, inteiro, percentual } from "@/lib/formatos";
import { SECOES, rota, type Secao } from "@/lib/rotas";
import { Blocos } from "./blocos";
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
  const ir = (b: string) => rota(b, ano, ANO_PADRAO);
  const prazos = regras.filter((r) => r.id === "prazo-regra-geral").flatMap((r) => r.vigencia.acNormal.map((ac) => ({ ac, data: prazoDoAno(ac) })));
  const prazo = regra("prazo-regra-geral", ano);
  const registros = leiaute.blocos.flatMap((b) => registrosDoBloco(b.letra, ano));
  const explicados = registros.filter((r) => resumoRegistro(r.codigo, ano).exemplos.some((e) => e.partes)).length;
  const revisao = [...rastreaveis.map((r) => r.verificadoEm), conferencia(ano).verificadoEm].sort().at(-1)!;
  const novidadePrograma = novidades.find((n) => n.tipo === "programa" && n.titulo.endsWith(programa.versao));
  const numeros = [
    { valor: inteiro(leiaute.blocos.length), rotulo: `blocos cobertos (leiaute ${leiaute.numero})`, href: "/blocos", chave: true },
    { valor: inteiro(explicados), rotulo: "registros explicados com exemplo", href: "/blocos", chave: true },
    { valor: data(revisao).slice(0, 5), completo: data(revisao), rotulo: "última revisão do conteúdo", href: "/fontes" },
    { valor: programa.versao, rotulo: "versão atual do programa", href: novidadePrograma ? `/novidades/${novidadePrograma.slug}` : "/novidades" },
  ];
  const caminho = "flex h-full flex-col rounded-xl border border-linha bg-superficie p-6 text-tinta no-underline transition-[border-color] hover:border-controle";
  const chamada = "mt-3 inline-flex items-center gap-1 text-sm font-semibold text-marca";
  return (
    <div className="space-y-16">
      <section aria-labelledby="t-destaque">
        <p className="text-xs font-semibold tracking-wider text-suave uppercase">ECF · Leiaute {leiaute.numero}</p>
        <h1 id="t-destaque" className="mt-2 text-[clamp(2rem,4vw,2.75rem)] leading-tight font-bold tracking-tight">
          ECF sem complicação
        </h1>
        <p className="mt-3 text-lg text-suave">Entenda o arquivo, prepare cada bloco e confira as regras na fonte oficial.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <CartaoEntrega prazos={prazos} ano={ano} regraGeral={textoDoValor(prazo.valor)}>
            <span data-testid="selo">
              Atualizado conforme leiaute {leiaute.numero}, verificado em {data(verificacaoMaisAntiga([leiaute, prazo]))}
            </span>{" "}
            · <LinkFonte fonte={prazo.fonte} curto />
          </CartaoEntrega>
          <CartaoContinuar ano={ano} padrao={ANO_PADRAO} />
        </div>
      </section>

      <AvisoDoRegime regime="presumido" titulo="Lucro presumido a partir de 2026" texto={avisoPresumido()} href={ir("/incentivos/lucro-presumido")} rotulo="Veja como calcular" />

      <ul aria-label="Números do site" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {numeros.map((n) => (
          <li key={n.rotulo}>
            <Link
              href={ir(n.href)}
              prefetch={false}
              data-testid="cartao-numero"
              className="flex h-full flex-col rounded-xl border border-linha bg-superficie p-5 text-tinta no-underline transition-[border-color] hover:border-controle"
            >
              <span className={cn("text-3xl font-semibold tracking-tight", n.chave && "text-marca")}>
                {n.completo ? (
                  <>
                    <span aria-hidden>{n.valor}</span>
                    <span className="sr-only">{n.completo}</span>
                  </>
                ) : (
                  n.valor
                )}
              </span>
              <span className="mt-1 text-suave">{n.rotulo}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="t-comece">
        <h2 id="t-comece" className="text-xl font-semibold">
          Comece por aqui
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <CaminhoAprender ano={ano} padrao={ANO_PADRAO} className={caminho} chamada={chamada}>
            <BookOpen aria-hidden size={20} strokeWidth={1.5} className="text-marca" />
            <span className="mt-3 font-semibold">Estou aprendendo</span>
            <span className="mt-1 text-suave">Conceitos, quem entrega e glossário.</span>
          </CaminhoAprender>
          <Link href={ir("/preencher")} prefetch={false} className={caminho} data-testid="caminho-preencher">
            <ListChecks aria-hidden size={20} strokeWidth={1.5} className="text-marca" />
            <span className="mt-3 font-semibold">Vou preencher</span>
            <span className="mt-1 text-suave">Roteiro bloco a bloco, com exemplos.</span>
            <span className={chamada}>
              Abrir o roteiro <ArrowRight aria-hidden size={16} />
            </span>
          </Link>
          <Link href={ir("/quem-deve-entregar")} prefetch={false} className={caminho} data-testid="widget-quiz">
            <CircleHelp aria-hidden size={20} strokeWidth={1.5} className="text-marca" />
            <span className="mt-3 font-semibold">Minha empresa precisa entregar?</span>
            <span className="mt-1 text-suave">Responda uma pergunta e descubra.</span>
            <span className={chamada}>
              Descobrir <ArrowRight aria-hidden size={16} />
            </span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="t-novidades">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="t-novidades" className="text-xl font-semibold">
            Novidades
          </h2>
          <Link href={ir("/novidades")} prefetch={false} className="inline-flex min-h-11 items-center gap-1 text-sm underline underline-offset-4">
            Todas as novidades <ArrowRight aria-hidden size={16} />
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-linha rounded-xl border border-linha bg-superficie px-5">
          {novidades.slice(0, 3).map((n) => (
            <li key={n.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
              <time dateTime={n.data} className="w-28 shrink-0 text-suave tabular-nums">
                {data(n.data)}
              </time>
              <Link href={ir(`/novidades/${n.slug}`)} prefetch={false} className="inline-flex min-h-6 items-center font-medium text-tinta no-underline hover:underline">
                {n.titulo}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Texto do aviso do lucro presumido, montado com os valores das regras (nada de número escrito aqui). */
function avisoPresumido(): string {
  const acr = regra("lc224-acrescimo-presuncao", 2026).valor;
  const lim = regra("lc224-limite-anual", 2026).valor;
  if (acr.tipo !== "percentual" || lim.tipo !== "dinheiro") throw new Error("Regras da LC 224 com tipo inesperado");
  return `No AC 2026, a receita acima de ${textoDoValor(lim)} no ano usa percentuais de presunção com acréscimo de ${percentual(acr.pontosBase)}, por trimestre.`;
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
