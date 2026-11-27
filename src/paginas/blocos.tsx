import Link from "next/link";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";
import { NOME_FAMILIA, tomDoBloco } from "@/components/ecf/blocos";
import { ICONES } from "@/components/ecf/icones";
import { MapaBlocos } from "@/components/ecf/mapa";
import { EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { BaseLegal } from "@/components/ecf/base-legal";
import { BlocosPorRegime, EtiquetaSituacao, LegendaSituacao, type CartaoBloco } from "@/components/ecf/regimes";
import { comTermos } from "@/components/ecf/com-termos";
import { BotaoCopiar } from "@/components/ecf/copiar";
import { RedirecionarAncora, SeletorRegistro } from "@/components/ecf/navegacao-registro";
import { ExemploCampoACampo } from "@/components/ecf/exemplo-registro";
import { Roteiro } from "@/components/ecf/roteiro";
import { MarcarVisita } from "@/components/layout/trilha";
import { CaixaRolavel, Cartao, Etiqueta, Nivel, estiloBotao } from "@/components/ui";
import { ANO_PADRAO, leiauteDoAno, leiautes } from "@/lib/conteudo";
import {
  ancorasDasRegras,
  ancorasDosCampos,
  conferencia,
  descricaoOficial,
  didatico,
  grafo,
  legendas,
  linhaRegime,
  mudancas,
  nomeBloco,
  regimes,
  registroDoAno,
  registrosDoBloco,
  statusRegistro,
  vizinhos,
} from "@/lib/conteudo/leiautes";
import { resumoRegistro } from "@/lib/exemplos/por-registro";
import { roteiroDe } from "@/lib/simulacao/montar";
import { SecaoSimulacao } from "@/components/simulacao";
import { data, inteiro, ordinal, semQuebra } from "@/lib/formatos";
import { rota } from "@/lib/rotas";
import type { Registro } from "@/schemas";

const ir = (base: string, ano: number) => rota(base, ano, ANO_PADRAO);
const urlBloco = (letra: string) => `/blocos/${letra.toLowerCase()}`;
export const urlRegistro = (codigo: string) => `${urlBloco(codigo[0]!)}/${codigo.toLowerCase()}`;

function cartoes(ano: number): CartaoBloco[] {
  const { blocos } = leiauteDoAno(ano);
  return blocos.map((b, i) => ({
    letra: b.letra,
    nome: nomeBloco(b.letra, ano).nome,
    ecd: nomeBloco(b.letra, ano).ecd,
    familia: b.familia,
    grupo: NOME_FAMILIA[b.familia],
    tom: tomDoBloco(b, blocos),
    posicao: i + 1,
    href: ir(urlBloco(b.letra), ano),
    objetivo: nomeBloco(b.letra, ano).objetivo,
    nota: linhaRegime(b.letra).nota,
    celulas: linhaRegime(b.letra).celulas,
    registros: registrosDoBloco(b.letra, ano).length,
  }));
}

function Mapa({ ano, inicial }: { ano: number; inicial?: string }) {
  const { blocos } = leiauteDoAno(ano);
  return (
    <MapaBlocos
      inicial={inicial}
      nos={[
        ...grafo.externos.map((x) => ({ id: x.id, nome: x.nome, href: null, familia: null })),
        ...blocos.map((b) => ({ id: b.letra, nome: `Bloco ${b.letra}: ${nomeBloco(b.letra, ano).curto}`, href: ir(urlBloco(b.letra), ano), familia: b.familia })),
      ]}
      arestas={grafo.arestas.map((a) => ({
        de: a.de,
        para: a.para,
        o: a.o,
        base: a.base.tabela ?? [a.base.registro, a.base.regra].filter(Boolean).join(", "),
        href: ir(urlRegistro(a.base.registro), ano),
      }))}
    />
  );
}

export function Blocos({ ano }: { ano: number }) {
  const total = leiauteDoAno(ano).blocos.length;
  return (
    <div className="space-y-12">
      <Cartao className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-prose text-lg">
          Prefere ir passo a passo? O roteiro mostra só os blocos do seu regime, na ordem do arquivo.
        </p>
        <Link href={ir("/preencher", ano)} prefetch={false} className={estiloBotao()}>
          <ListChecks aria-hidden size={18} /> Abrir o roteiro
        </Link>
      </Cartao>
      <section aria-labelledby="t-grade">
        <h2 id="t-grade" className="mb-4 text-2xl font-bold">
          {inteiro(total)} blocos cobertos
        </h2>
        <BlocosPorRegime blocos={cartoes(ano)} regimes={regimes.regimes} />
        <p className="mt-4 max-w-prose text-sm text-suave">
          Os nomes são os do Manual de Orientação. Os grupos ({Object.values(NOME_FAMILIA).join(", ")}) foram criados por
          este site para facilitar o estudo: o Manual não usa essa divisão. As formas mistas de tributação seguem as
          condições de cada registro.
        </p>
      </section>
      <section aria-labelledby="t-mapa">
        <h2 id="t-mapa" className="mb-4 text-2xl font-bold">
          De onde vêm os dados
        </h2>
        <Mapa ano={ano} />
      </section>
    </div>
  );
}

function separarObrigatoriedade(s: string): { sigla: string; condicao: string | null } {
  const m = /^(OC|FC|O|F|N)(?:\n|$|\s)([\s\S]*)$/.exec(s);
  if (!m) return { sigla: s, condicao: null };
  return { sigla: m[1]!, condicao: m[2]!.trim() || null };
}

function Obrigatoriedade({ valor }: { valor: string }) {
  const { sigla, condicao } = separarObrigatoriedade(valor);
  const nome = (legendas.obrigatoriedade as Record<string, string>)[sigla];
  return (
    <>
      <span className="font-semibold">{nome ?? sigla}</span>
      {condicao && <span className="block whitespace-pre-line text-sm text-suave">{condicao}</span>}
    </>
  );
}

/** Blocos que recebem dados da ECD: deixa claro o que é de cada escrituração. */
function AvisoEcd() {
  return (
    <p data-testid="aviso-ecd" className="mt-3 flex max-w-prose flex-wrap items-baseline gap-2">
      <Etiqueta>dados da ECD</Etiqueta>
      <span className="text-suave">
        A ECD é a escrituração contábil da empresa. Este bloco faz parte da ECF, mas o conteúdo dele vem da ECD.
      </span>
    </p>
  );
}

export function PaginaBloco({ letra, ano }: { letra: string; ano: number }) {
  const { blocos } = leiauteDoAno(ano);
  const bloco = blocos.find((b) => b.letra.toLowerCase() === letra)!;
  const Icone = ICONES[bloco.letra]!;
  const d = didatico(bloco.letra);
  const linha = linhaRegime(bloco.letra);
  const regs = registrosDoBloco(bloco.letra, ano);
  const i = blocos.indexOf(bloco);
  const vistos = { iniciante: new Set<string>(), profissional: new Set<string>() };
  return (
    <div className="space-y-10">
      <MarcarVisita codigo={bloco.letra} />
      <div>
        <div
          data-familia={bloco.familia}
          data-tom={tomDoBloco(bloco, blocos)}
          className="bloco mb-5 inline-flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <Icone aria-hidden className="bloco-icone" size={28} />
          <span className="font-medium">
            {NOME_FAMILIA[bloco.familia]} · {ordinal(i + 1)} do arquivo
          </span>
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Bloco {bloco.letra}: {bloco.nome}
        </h1>
        {nomeBloco(bloco.letra, ano).ecd && <AvisoEcd />}
        <div className="mt-4 max-w-prose text-lg">
          <Nivel so="iniciante">
            <p>{comTermos(d.objetivo, vistos.iniciante)}</p>
            <p className="mt-2 text-suave">{comTermos(d.analogia, vistos.iniciante)}</p>
          </Nivel>
          <Nivel so="profissional">
            <p className="whitespace-pre-line">{comTermos(semQuebra(descricaoOficial(bloco.letra, ano)), vistos.profissional)}</p>
          </Nivel>
        </div>
        <div className="mt-4">
          <Selo ano={ano} itens={[conferencia(ano)]} />
        </div>
      </div>

      <section aria-labelledby="t-regime">
        <h2 id="t-regime" className="mb-3 text-2xl font-bold">
          Quem preenche
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {regimes.regimes.map((r) => (
            <div key={r.id} className="rounded-xl border border-linha bg-superficie p-4">
              <dt className="font-semibold">{r.nome}</dt>
              <dd className="mt-2">
                <EtiquetaSituacao s={linha.celulas[r.id]} />
              </dd>
            </div>
          ))}
        </dl>
        <LegendaSituacao />
        <p className="mt-3 text-suave">
          {linha.nota} Base:{" "}
          {linha.base.map((c, n) => (
            <span key={c}>
              {n > 0 && " e "}
              <Link href={ir(urlRegistro(c), ano)} prefetch={false} className="inline-block py-0.5 underline underline-offset-4">
                registro {c}
              </Link>
            </span>
          ))}
          .
        </p>
      </section>

      <section aria-labelledby="t-origem">
        <h2 id="t-origem" className="mb-3 text-2xl font-bold">
          De onde vêm os dados
        </h2>
        <p className="mb-4 max-w-prose">{d.origem}</p>
        <Mapa ano={ano} inicial={bloco.letra} />
      </section>

      <section aria-labelledby="t-erros">
        <h2 id="t-erros" className="mb-3 text-2xl font-bold">
          Erros e como evitar
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {d.erros.map((e) => (
            <li key={e.titulo}>
              <Cartao className="h-full">
                <h3 className="font-semibold">{e.titulo}</h3>
                <p className="mt-2">{e.comoEvitar}</p>
                <p className="mt-3 text-sm">
                  <Link href={ir(urlRegistro(e.registro), ano)} prefetch={false} className="inline-block py-0.5 break-all underline underline-offset-4">
                    {e.registro}
                    {e.regra && `, ${e.regra}`}
                  </Link>
                </p>
              </Cartao>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="t-registros">
        <h2 id="t-registros" className="mb-3 text-2xl font-bold">
          {inteiro(regs.length)} registros
        </h2>
        <ol className="grid gap-2 md:grid-cols-2">
          {regs.map((r) => (
            <li key={r.codigo}>
              <Link
                href={ir(urlRegistro(r.codigo), ano)}
                prefetch={false}
                className="flex h-full min-h-11 items-start gap-3 rounded-xl border border-linha bg-superficie p-3 text-tinta no-underline hover:border-marca"
              >
                <span className="font-mono font-semibold">{r.codigo}</span>
                <span className="min-w-0">
                  {r.nome}
                  <span className="block text-sm text-suave">
                    {(legendas.obrigatoriedade as Record<string, string>)[separarObrigatoriedade(r.saida).sigla] ?? r.saida} ·{" "}
                    {inteiro(r.campos.length)} campos
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <Vizinhos
        rotulo="Outros blocos"
        anterior={blocos[i - 1] && { href: ir(urlBloco(blocos[i - 1]!.letra), ano), texto: `Bloco ${blocos[i - 1]!.letra}` }}
        proximo={blocos[i + 1] && { href: ir(urlBloco(blocos[i + 1]!.letra), ano), texto: `Bloco ${blocos[i + 1]!.letra}` }}
      />
    </div>
  );
}

function Vizinhos({
  rotulo,
  anterior,
  proximo,
}: {
  rotulo: string;
  anterior?: { href: string; texto: string };
  proximo?: { href: string; texto: string };
}) {
  return (
    <nav aria-label={rotulo} className="flex flex-wrap justify-between gap-3">
      {anterior ? (
        <Link href={anterior.href} prefetch={false} className={estiloBotao({ variante: "contorno" })}>
          <ArrowLeft aria-hidden size={18} /> {anterior.texto}
        </Link>
      ) : (
        <span />
      )}
      {proximo && (
        <Link href={proximo.href} prefetch={false} className={estiloBotao({ variante: "contorno" })}>
          {proximo.texto} <ArrowRight aria-hidden size={18} />
        </Link>
      )}
    </nav>
  );
}

const LIMITE = 420;

function TextoLongo({ texto, termos }: { texto: string; termos?: Set<string> }) {
  const limpo = semQuebra(texto);
  // Dica do glossário só no texto inteiro; o resumo do <summary> fica sem nada clicável dentro.
  const comDicas = (t: string) => (termos ? comTermos(t, termos) : t);
  if (limpo.length <= LIMITE) return <span className="whitespace-pre-line">{comDicas(limpo)}</span>;
  const corte = limpo.slice(0, 200).replace(/\s+\S*$/, "");
  return (
    <details>
      <summary className="min-h-6">
        {corte}… <span className="font-semibold text-marca underline underline-offset-4">ver tudo</span>
      </summary>
      <span className="mt-2 block whitespace-pre-line">{comDicas(limpo)}</span>
    </details>
  );
}

const COLUNAS = ["Nº", "Campo", "Descrição", "Tipo", "Tamanho", "Decimais", "Valores válidos", "Obrigatório"] as const;
/** No celular cada linha vira um cartão (mesma marcação, só o estilo muda): as âncoras não se repetem. */
const celula = "flex gap-3 px-1 py-1 before:w-28 before:shrink-0 before:text-sm before:font-semibold before:text-suave before:content-[attr(data-rotulo)] md:table-cell md:p-3 md:before:content-none";

function TabelaCampos({ r, base }: { r: Registro; base: string }) {
  const ancoras = ancorasDosCampos(r.campos);
  return (
    <CaixaRolavel rotulo={`Campos do registro ${r.codigo}`}>
      <table className="block w-full text-left md:table md:min-w-5xl">
        <caption className="sr-only">Campos do registro {r.codigo}</caption>
        <thead className="sr-only border-b border-linha text-sm md:not-sr-only md:table-header-group">
          <tr>
            {COLUNAS.map((c) => (
              <th key={c} scope="col" className="p-3 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block space-y-3 md:table-row-group md:space-y-0">
          {ancoras.map(([c, ancora]) => (
            <tr
              key={c.numero}
              id={ancora}
              data-campo={c.nome}
              className="block scroll-mt-6 rounded-xl border border-linha p-3 align-top target:bg-ok-fundo data-alvo:bg-ok-fundo md:table-row md:rounded-none md:border-0 md:border-b md:p-0 md:last:border-0"
            >
              <td className={celula} data-rotulo="Nº">
                {inteiro(c.numero)}
              </td>
              <th scope="row" className={`${celula} font-mono text-sm font-semibold`} data-rotulo="Campo">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="break-all">{c.nome}</span>
                  <BotaoCopiar texto={`${base}#${ancora}`} link curto rotulo={`Copiar link do campo ${c.nome}`} />
                </span>
              </th>
              <td className={`${celula} text-sm md:max-w-md`} data-rotulo="Descrição">
                <span className="min-w-0">
                  <TextoLongo texto={c.descricao} />
                </span>
              </td>
              <td className={celula} data-rotulo="Tipo">
                {c.tipo === "—" ? "—" : <abbr title={(legendas.tipos as Record<string, string>)[c.tipo]}>{c.tipo}</abbr>}
              </td>
              <td className={celula} data-rotulo="Tamanho">
                {c.tamanho}
              </td>
              <td className={celula} data-rotulo="Decimais">
                {c.decimal}
              </td>
              <td className={`${celula} text-sm break-words whitespace-pre-line md:max-w-48`} data-rotulo="Valores válidos">
                <span className="min-w-0">{c.valores}</span>
              </td>
              <td className={`${celula} text-sm whitespace-pre-line`} data-rotulo="Obrigatório">
                {c.obrigatorio}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CaixaRolavel>
  );
}

/** Anterior e próximo na ordem do arquivo, atravessando blocos. */
function NavArquivo({ rotulo, codigo, ano }: { rotulo: string; codigo: string; ano: number }) {
  const { anterior, proximo } = vizinhos(codigo, ano);
  const outroBloco = (c: string) => (c[0] !== codigo[0] ? ` · bloco ${c[0]}` : "");
  const item = (x: Registro, lado: "anterior" | "proximo") => (
    <Link
      href={ir(urlRegistro(x.codigo), ano)}
      prefetch={false}
      rel={lado === "anterior" ? "prev" : "next"}
      data-testid={`registro-${lado}`}
      className={`${estiloBotao({ variante: "contorno" })} max-w-full min-w-0`}
    >
      {lado === "anterior" && <ArrowLeft aria-hidden size={18} className="shrink-0" />}
      <span className="min-w-0 truncate">
        <span className="font-mono">{x.codigo}</span>
        <span className="font-normal text-suave">
          {outroBloco(x.codigo)} · {x.nome}
        </span>
      </span>
      {lado === "proximo" && <ArrowRight aria-hidden size={18} className="shrink-0" />}
    </Link>
  );
  return (
    <nav aria-label={rotulo} className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0">{anterior ? item(anterior, "anterior") : <span className="text-sm text-suave">Primeiro registro do arquivo</span>}</div>
      <div className="min-w-0 sm:text-right">{proximo ? item(proximo, "proximo") : <span className="text-sm text-suave">Último registro do arquivo</span>}</div>
    </nav>
  );
}

/** Tela larga: coluna fixa com os registros do bloco e os blocos vizinhos. */
function MapaDoBloco({ bloco, codigo, ano }: { bloco: string; codigo: string; ano: number }) {
  const blocos = leiauteDoAno(ano).blocos;
  const k = blocos.findIndex((b) => b.letra === bloco);
  const [antes, depois] = [blocos[k - 1], blocos[k + 1]];
  return (
    <aside className="hidden xl:block">
      <nav aria-label={`Registros do bloco ${bloco}`} data-testid="mapa-do-bloco" className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-linha bg-superficie p-4">
        <p className="mb-2 font-semibold">
          Bloco {bloco}: {nomeBloco(bloco, ano).curto}
        </p>
        <ol className="space-y-0.5 text-sm">
          {registrosDoBloco(bloco, ano).map((x) => (
            <li key={x.codigo}>
              <Link
                href={ir(urlRegistro(x.codigo), ano)}
                prefetch={false}
                aria-current={x.codigo === codigo ? "page" : undefined}
                className="flex min-h-8 gap-2 rounded-md px-2 py-1 text-tinta no-underline hover:bg-fundo aria-[current=page]:bg-marca aria-[current=page]:text-sobre-marca"
              >
                <span className="shrink-0 font-mono font-semibold">{x.codigo}</span>
                <span className="min-w-0 truncate">{x.nome}</span>
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex justify-between gap-2 border-t border-linha pt-3 text-sm">
          {antes ? (
            <Link href={ir(urlBloco(antes.letra), ano)} prefetch={false} className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
              <ArrowLeft aria-hidden size={14} /> Bloco {antes.letra}
            </Link>
          ) : (
            <span />
          )}
          {depois && (
            <Link href={ir(urlBloco(depois.letra), ano)} prefetch={false} className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
              Bloco {depois.letra} <ArrowRight aria-hidden size={14} />
            </Link>
          )}
        </div>
      </nav>
    </aside>
  );
}

export function PaginaRegistro({ codigo, ano }: { codigo: string; ano: number }) {
  const r = registroDoAno(codigo, ano)!;
  const bloco = codigo[0]!;
  const doBloco = registrosDoBloco(bloco, ano);
  const i = doBloco.findIndex((x) => x.codigo === codigo);
  const leiaute = leiauteDoAno(ano);
  const m = mudancas(codigo, ano);
  const outroAno = leiautes.find((l) => l.anoCalendario !== ano && !registroDoAno(codigo, l.anoCalendario));
  const resumo = resumoRegistro(codigo, ano);
  const roteiro = roteiroDe(codigo, ano);
  const ancoras = ancorasDosCampos(r.campos);
  const regras = ancorasDasRegras(r);
  const base = ir(urlRegistro(codigo), ano);
  const posBloco = leiaute.blocos.findIndex((b) => b.letra === bloco);
  // Dicas do glossário: cada termo uma vez por seção.
  const vistos = () => new Set<string>();
  const vistosPara = vistos();
  const vistosRegras = vistos();
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-10">
    <div className="min-w-0 space-y-10">
      <MarcarVisita codigo={codigo} />
      <RedirecionarAncora mapa={Object.fromEntries(ancoras.map(([c, a]) => [`campo-${c.numero}`, a]))} />
      <NavArquivo rotulo="Registro anterior e próximo, no topo" codigo={codigo} ano={ano} />
      <div>
        <p className="font-mono text-suave" data-testid="posicao-no-arquivo">
          Bloco {bloco}, {ordinal(i + 1)} de {doBloco.length} registros · bloco {ordinal(posBloco + 1)} de {leiaute.blocos.length} no arquivo
        </p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          {r.codigo}: {r.nome}
        </h1>
        <div className="mt-4">
          <Selo ano={ano} itens={[conferencia(ano)]} />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <EtiquetaStatus status={statusRegistro(codigo, ano)} />
          <LinkFonte fonte={{ ...leiaute.fonte, trecho: `Registro ${r.codigo}` }} />
          <span className="text-suave">{semQuebra(leiaute.norma)}</span>
        </p>
        {outroAno && (
          <p className="mt-3">
            <Etiqueta tom="alerta">Não existe no leiaute {outroAno.numero}</Etiqueta>
          </p>
        )}
        <div className="mt-4">
          <SeletorRegistro atual={codigo} opcoes={doBloco.map((x) => ({ codigo: x.codigo, nome: x.nome, href: ir(urlRegistro(x.codigo), ano) }))} />
        </div>
      </div>

      <section aria-labelledby="t-para">
        <h2 id="t-para" className="mb-3 text-2xl font-bold">
          Para que serve
        </h2>
        {roteiro && (
          <div data-testid="para-que-serve" className="mb-4 max-w-prose text-lg">
            <Nivel so="iniciante">
              <p>{comTermos(roteiro.paraQueServe.iniciante, vistosPara)}</p>
            </Nivel>
            <Nivel so="profissional">
              <p>{comTermos(roteiro.paraQueServe.profissional, vistos())}</p>
            </Nivel>
          </div>
        )}
        {roteiro && r.descricao.length > 0 && <h3 className="mb-2 font-semibold">No Manual</h3>}
        {r.descricao.length > 0 ? (
          <div className="max-w-prose space-y-2">
            {r.descricao.map((p, n) => (
              <div key={n}>
                <TextoLongo texto={p} termos={vistosPara} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-suave">O Manual não traz descrição para este registro.</p>
        )}
        <Nivel so="iniciante">
          <p data-testid="sobre-o-bloco" className="mt-4 max-w-prose rounded-lg border border-linha bg-fundo px-4 py-3 text-suave">
            <strong className="text-tinta">Sobre o bloco {bloco}:</strong> {nomeBloco(bloco, ano).objetivo}
          </p>
        </Nivel>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Obrigatoriedade na transmissão", <Obrigatoriedade key="s" valor={r.saida} />],
            ["Obrigatoriedade na importação", <Obrigatoriedade key="e" valor={r.entrada} />],
            ["Ocorrência", <span key="o" className="whitespace-pre-line">{r.ocorrencia}</span>],
            ["Nível e chave", <span key="n" className="break-words">{`${r.nivel} · ${r.chave}`}</span>],
          ].map(([t, v]) => (
            <div key={t as string} className="rounded-xl border border-linha bg-superficie p-4">
              <dt className="text-sm text-suave">{t}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="t-preenchido">
        <h2 id="t-preenchido" className="mb-3 text-2xl font-bold">
          Veja o preenchimento
        </h2>
        {resumo.exemplos.length === 0 && <p className="max-w-prose text-suave">{resumo.semExemplo}</p>}
        <div className="space-y-4">
          {resumo.exemplos.map((ex, n) => (
            <details key={ex.titulo} open={n === 0} className="rounded-xl border border-linha bg-superficie p-4">
              <summary className="min-h-8 font-semibold">{ex.titulo}</summary>
              <div className="mt-3">
                <ExemploCampoACampo ex={ex} rotulo={`${codigo}, ${ex.titulo}`} />
              </div>
            </details>
          ))}
        </div>
        {roteiro && (
          <div className="mt-4">
            <SecaoSimulacao codigo={codigo} url={`/dados/${ano}/roteiro-${codigo.toLowerCase()}.json`} />
          </div>
        )}
      </section>

      {m && m.mudanca && (
        <section aria-labelledby="t-mudou">
          <h2 id="t-mudou" className="mb-3 text-2xl font-bold">
            O que mudou desde o leiaute {m.de}
          </h2>
          {m.mudanca.tipo === "novo" ? (
            <p>Registro novo.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {m.mudanca.itens.map((x) => (
                <li key={x} className="break-words">
                  {x}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-sm text-suave">
            Comparação automática da estrutura dos dois manuais. Mudanças só de redação não aparecem.
          </p>
        </section>
      )}

      <section aria-labelledby="t-campos">
        <h2 id="t-campos" className="mb-3 text-2xl font-bold">
          {inteiro(r.campos.length)} campos
        </h2>
        <Nivel so="iniciante">
          <p className="mb-3 max-w-prose text-suave">
            Cada linha da tabela é um dado que o arquivo leva, na ordem em que aparece. As regras que o programa confere estão logo
            abaixo.
          </p>
        </Nivel>
        <TabelaCampos r={r} base={base} />
        <p className="mt-2 text-sm text-suave">
          Tipos:{" "}
          {[...new Set(r.campos.map((c) => c.tipo))]
            .filter((t) => t !== "—")
            .map((t) => `${t} = ${(legendas.tipos as Record<string, string>)[t]}`)
            .join("; ")}
          .
        </p>
      </section>

      <section aria-labelledby="t-regras" id="regras" className="scroll-mt-6">
          <h2 id="t-regras" className="mb-3 text-2xl font-bold">
            Regras de validação
          </h2>
          <Nivel so="iniciante">
            <p className="mb-3 max-w-prose text-suave">
              O que o programa da ECF confere ao validar o arquivo, no texto do próprio Manual. É técnico: use como referência quando o
              programa apontar um erro.
            </p>
          </Nivel>
          {r.regrasRegistro.length + r.regrasCampo.length === 0 && (
            <p className="text-suave">O Manual não lista regras para este registro.</p>
          )}
          {r.regrasRegistro.length > 0 && (
            <>
              <h3 className="mb-2 text-lg font-semibold">Do registro</h3>
              <ul className="space-y-3">
                {regras
                  .filter((x) => x.campo === "*")
                  .map((x) => (
                    <li key={x.ancora} id={x.ancora} className="scroll-mt-6 border-l-3 border-marca pl-4 target:bg-ok-fundo">
                      <code className="block font-mono text-sm font-semibold break-all">{x.codigo}</code>
                      <TextoLongo texto={x.texto} termos={vistosRegras} />
                    </li>
                  ))}
              </ul>
            </>
          )}
          {r.regrasCampo.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 text-lg font-semibold">Dos campos</h3>
              <ul className="space-y-3">
                {regras
                  .filter((x) => x.campo !== "*")
                  .map((x) => (
                    <li key={x.ancora} id={x.ancora} className="scroll-mt-6 border-l-3 border-linha pl-4 target:bg-ok-fundo">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold break-all">{x.campo}</span>
                        <Etiqueta tom={x.tipo === "Erro" ? "alerta" : "neutro"}>
                          {x.tipo === "a verificar" ? "Tipo a verificar" : x.tipo}
                        </Etiqueta>
                      </p>
                      <code className="block font-mono text-sm break-all">{x.codigo}</code>
                      <TextoLongo texto={x.texto} termos={vistosRegras} />
                    </li>
                  ))}
              </ul>
            </>
          )}
      </section>

      {r.exemplo.length > 0 && (
        <section aria-labelledby="t-exemplo">
          <h2 id="t-exemplo" className="mb-3 text-2xl font-bold">
            Texto completo do exemplo no Manual
          </h2>
          <CaixaRolavel rotulo="Exemplo de preenchimento">
            <pre className="p-4 font-mono text-sm">{r.exemplo.join("\n")}</pre>
          </CaixaRolavel>
          <p className="mt-2 text-sm text-suave">
            Transcrito do Manual, com dados de teste do próprio Manual. Pode conter códigos de versões anteriores.
          </p>
        </section>
      )}

      <NavArquivo rotulo="Registro anterior e próximo, no fim" codigo={codigo} ano={ano} />
    </div>
    <MapaDoBloco bloco={bloco} codigo={codigo} ano={ano} />
    </div>
  );
}

export function Preencher({ ano }: { ano: number }) {
  const passos = cartoes(ano).map((c) => {
    const d = didatico(c.letra);
    return { ...c, origem: d.origem, erros: d.erros.map(({ titulo, comoEvitar }) => ({ titulo, comoEvitar })) };
  });
  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Roteiro de preenchimento</h1>
      <p className="mt-3 max-w-prose text-lg text-suave">
        Um bloco por vez, na ordem do arquivo. A etapa em que você parou fica salva neste navegador.
      </p>
      <div className="mt-4 mb-6">
        <Selo ano={ano} itens={[conferencia(ano)]} />
      </div>
      <div className="mb-8">
        <BaseLegal ids={["ordem-recuperacao", "recuperacao-obrigatoria"]} ano={ano} />
      </div>
      <Roteiro blocos={passos} regimes={regimes.regimes} />
      <p className="mt-6 text-sm text-suave">
        Conferido com os manuais em {data(conferencia(ano).verificadoEm)}. O roteiro não substitui o programa da ECF.
      </p>
    </>
  );
}
