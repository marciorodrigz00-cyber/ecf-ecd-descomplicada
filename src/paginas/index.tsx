import Link from "next/link";
import { ArrowRight, Bell, Blocks, ClipboardList, FileText, GraduationCap, Hammer, ShieldCheck, Trophy } from "lucide-react";
import { EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { MarcarEstudada } from "@/components/layout/progresso";
import { ContagemPrazo, NovidadesRecentes } from "@/components/layout/visao-geral";
import { Atalhos, CaminhoAprender, CartaoTrilha, ComProgresso, Conquistas } from "@/components/layout/trilha";
import { CaixaRolavel, Cartao, Etiqueta, Nivel } from "@/components/ui";
import { ANO_PADRAO, fontes, leiauteDoAno, linhaDoTempo, novidades, quiz, rastreaveis, regra, regras, textoDoValor } from "@/lib/conteudo";
import { conferencia, divergencias, registrosDoBloco } from "@/lib/conteudo/leiautes";
import { cn } from "@/lib/cn";
import { resumoRegistro } from "@/lib/exemplos/por-registro";
import { prazoDoAno } from "@/lib/prazo";
import { data, inteiro } from "@/lib/formatos";
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
  const primeira = quiz.perguntas.find((p) => p.id === quiz.inicio)!;
  const numeros = [
    { rotulo: "Blocos cobertos", valor: inteiro(leiaute.blocos.length), legenda: `do leiaute ${leiaute.numero}`, href: "/blocos", Icone: Blocks },
    { rotulo: "Registros explicados", valor: inteiro(explicados), legenda: "com exemplo de preenchimento", href: "/blocos", Icone: FileText, destaque: true },
    { rotulo: "Última revisão", valor: data(revisao), legenda: "fontes oficiais conferidas", href: "/fontes", Icone: ShieldCheck },
    { rotulo: "Novidades", valor: <NovidadesRecentes datas={novidades.map((n) => n.data)} />, legenda: "nos últimos 90 dias · ver o que mudou", href: "/novidades", Icone: Bell },
  ];
  const caminho = "flex h-full flex-col border-t-2 border-linha pt-5 text-tinta no-underline transition-colors hover:border-marca";
  return (
    <div className="space-y-12">
      <section aria-labelledby="t-destaque" data-testid="destaque" className="relative overflow-hidden rounded-2xl border border-linha bg-superficie">
        <FundoSped />
        <div className="relative grid gap-8 p-6 sm:p-10 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-end">
          <div>
            <p className="flex items-center gap-3 font-mono text-xs tracking-widest text-suave uppercase">
              ECF {ano + 1} <span aria-hidden className="h-px w-8 bg-controle" /> Ano-calendário {ano}
            </p>
            <h1 id="t-destaque" className="mt-4 font-mono text-4xl font-semibold tracking-tight uppercase sm:text-6xl">
              A ECF,
              <span className="block text-marca">sem complicação.</span>
            </h1>
            <p className="mt-4 max-w-prose text-lg text-suave">Entenda o arquivo, prepare cada bloco e confira as regras na fonte oficial.</p>
            <div className="mt-8">
              <ContagemPrazo prazos={prazos} ano={ano} />
              <div className="mt-4">
                <Selo ano={ano} itens={[prazo, conferencia(ano)]} />
              </div>
              <p className="mt-2 text-xs text-suave">
                Regra geral: {textoDoValor(prazo.valor).toLowerCase()} (<LinkFonte fonte={prazo.fonte} curto />).
              </p>
            </div>
          </div>
          <div data-testid="widget-quiz" className="rounded-xl border border-linha bg-fundo p-5">
            <ComProgresso
              convite={
                <>
                  <p className="font-mono text-xs tracking-widest text-suave uppercase">Quem entrega</p>
                  <h2 className="mt-2 text-lg font-semibold">Minha empresa precisa entregar?</h2>
                  <p className="mt-1 text-sm text-suave">{primeira.texto}</p>
                  <Link
                    href={ir("/quem-deve-entregar")}
                    prefetch={false}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-marca px-5 font-semibold text-sobre-marca no-underline"
                  >
                    Descobrir <ArrowRight aria-hidden size={18} />
                  </Link>
                </>
              }
            >
              <p className="font-mono text-xs tracking-widest text-suave uppercase">Sua trilha</p>
              <h2 className="mt-2 text-lg font-semibold">Continue de onde parou</h2>
              <CaminhoAprender ano={ano} padrao={ANO_PADRAO} className="mt-2 inline-flex min-h-11 flex-col justify-center text-tinta underline underline-offset-4">
                <span className="sr-only">Próximo tema da trilha</span>
              </CaminhoAprender>
            </ComProgresso>
          </div>
        </div>
      </section>

      <ul aria-label="Números do site" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {numeros.map((n) => (
          <li key={n.rotulo}>
            <Link
              href={ir(n.href)}
              prefetch={false}
              data-testid="cartao-numero"
              className={cn(
                "flex h-full flex-col rounded-xl border p-5 text-tinta no-underline transition-colors hover:border-marca",
                n.destaque ? "cartao-destaque" : "border-linha bg-superficie",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs tracking-widest text-suave uppercase">{n.rotulo}</span>
                <n.Icone aria-hidden size={18} className={n.destaque ? "text-marca" : "text-suave"} />
              </span>
              <span className={cn("mt-3 font-mono text-3xl font-semibold", n.destaque && "text-marca")}>{n.valor}</span>
              <span className="mt-1 text-sm text-suave">{n.legenda}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="t-comece">
        <h2 id="t-comece" className="text-2xl font-bold">
          Comece por aqui
        </h2>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <CaminhoAprender ano={ano} padrao={ANO_PADRAO} className={caminho}>
            <GraduationCap aria-hidden size={28} className="text-marca" />
            <span className="mt-3 text-xl font-bold">Estou aprendendo</span>
            <span className="mt-1 text-suave">O que é a ECF, quem entrega, os blocos e os casos práticos, numa trilha em ordem.</span>
          </CaminhoAprender>
          <Link href={ir("/preencher")} prefetch={false} className={caminho} data-testid="caminho-preencher">
            <ClipboardList aria-hidden size={28} className="text-marca" />
            <span className="mt-3 text-xl font-bold">Vou preencher</span>
            <span className="mt-1 text-suave">O passo a passo do arquivo para o regime da empresa, bloco por bloco.</span>
            <span className="mt-3 flex items-center gap-2 font-semibold">
              Abrir o roteiro <ArrowRight aria-hidden size={18} />
            </span>
          </Link>
        </div>
        <Link href={ir("/meu-progresso")} prefetch={false} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-suave underline underline-offset-4">
          <Trophy aria-hidden size={16} /> Ver meu progresso
        </Link>
      </section>

      <section aria-labelledby="t-novidades">
        <h2 id="t-novidades" className="text-2xl font-bold">
          Novidades
        </h2>
        <ul className="mt-4 divide-y divide-linha">
          {novidades.slice(0, 3).map((n) => (
            <li key={n.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
              <time dateTime={n.data} className="w-28 shrink-0 font-mono text-sm text-suave">
                {data(n.data)}
              </time>
              <Link href={ir(`/novidades/${n.slug}`)} prefetch={false} className="inline-flex min-h-6 items-center font-semibold underline underline-offset-4">
                {n.titulo}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={ir("/novidades")} prefetch={false} className="mt-2 inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
          Todas as novidades <ArrowRight aria-hidden size={18} />
        </Link>
      </section>
    </div>
  );
}

/** Linhas de um arquivo SPED em baixo contraste, só decoração. Em SVG, fora da leitura de tela. */
function FundoSped() {
  const linhas = ["|0000|LECF|0012|", "|0010||A|N|N|", "|0020|S|N|N|", "|J100|01012025|", "|K155|1.01.01|", "|L100|1|A|", "|M300|1|E|", "|N630|1|", "|P200|1|", "|Y540|1|", "|9900|0000|1|", "|9999|1234|"];
  return (
    <svg
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[30rem] text-marca opacity-[0.12] min-[1440px]:block"
      viewBox="0 0 600 420"
      preserveAspectRatio="xMaxYMid slice"
    >
      {linhas.map((l, i) => (
        <text key={l} x={i % 2 ? 140 : 90} y={36 + i * 34} fill="currentColor" fontFamily="var(--font-mono)" fontSize="22">
          {l}
        </text>
      ))}
    </svg>
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
