import Link from "next/link";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";
import { NOME_FAMILIA, tomDoBloco } from "@/components/ecf/blocos";
import { ICONES } from "@/components/ecf/icones";
import { MapaBlocos } from "@/components/ecf/mapa";
import { EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { BaseLegal } from "@/components/ecf/base-legal";
import { BlocosPorRegime, EtiquetaSituacao, type CartaoBloco } from "@/components/ecf/regimes";
import { comTermos } from "@/components/ecf/com-termos";
import { ExemploCampoACampo } from "@/components/ecf/exemplo-registro";
import { Roteiro } from "@/components/ecf/roteiro";
import { MarcarVisita } from "@/components/layout/trilha";
import { CaixaRolavel, Cartao, Etiqueta, Nivel, estiloBotao } from "@/components/ui";
import { ANO_PADRAO, leiauteDoAno, leiautes } from "@/lib/conteudo";
import {
  conferencia,
  descricaoOficial,
  didatico,
  grafo,
  legendas,
  linhaRegime,
  mudancas,
  regimes,
  registroDoAno,
  registrosDoBloco,
  statusRegistro,
} from "@/lib/conteudo/leiautes";
import { resumoRegistro } from "@/lib/exemplos/por-registro";
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
    nome: b.nome,
    familia: b.familia,
    tom: tomDoBloco(b, blocos),
    posicao: i + 1,
    href: ir(urlBloco(b.letra), ano),
    objetivo: didatico(b.letra).objetivo,
    nota: linhaRegime(b.letra).nota,
    celulas: linhaRegime(b.letra).celulas,
  }));
}

function Mapa({ ano, inicial }: { ano: number; inicial?: string }) {
  const { blocos } = leiauteDoAno(ano);
  return (
    <MapaBlocos
      inicial={inicial}
      nos={[
        ...grafo.externos.map((x) => ({ id: x.id, nome: x.nome, href: null, familia: null })),
        ...blocos.map((b) => ({ id: b.letra, nome: `Bloco ${b.letra}: ${b.nome}`, href: ir(urlBloco(b.letra), ano), familia: b.familia })),
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
          Os nomes são os do Manual de Orientação. Os grupos são didáticos. “Depende” quer dizer que o bloco só
          existe se uma condição do Manual for atendida. As formas mistas de tributação seguem as condições de cada
          registro.
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

function TextoLongo({ texto }: { texto: string }) {
  const limpo = semQuebra(texto);
  if (limpo.length <= LIMITE) return <span className="whitespace-pre-line">{limpo}</span>;
  const corte = limpo.slice(0, 200).replace(/\s+\S*$/, "");
  return (
    <details>
      <summary className="min-h-6">
        {corte}… <span className="font-semibold text-marca underline underline-offset-4">ver tudo</span>
      </summary>
      <span className="mt-2 block whitespace-pre-line">{limpo}</span>
    </details>
  );
}

function TabelaCampos({ r }: { r: Registro }) {
  return (
    <CaixaRolavel rotulo={`Campos do registro ${r.codigo}`}>
      <table className="w-full min-w-5xl text-left">
        <caption className="sr-only">Campos do registro {r.codigo}</caption>
        <thead className="border-b border-linha text-sm">
          <tr>
            {["Nº", "Campo", "Descrição", "Tipo", "Tamanho", "Decimais", "Valores válidos", "Obrigatório"].map((c) => (
              <th key={c} scope="col" className="p-3 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.campos.map((c) => (
            <tr key={c.numero} id={`campo-${c.numero}`} className="scroll-mt-6 border-b border-linha align-top last:border-0 target:bg-ok-fundo">
              <td className="p-3">{inteiro(c.numero)}</td>
              <th scope="row" className="p-3 font-mono text-sm font-semibold">
                {c.nome}
              </th>
              <td className="max-w-md p-3 text-sm">
                <TextoLongo texto={c.descricao} />
              </td>
              <td className="p-3">
                {c.tipo === "—" ? "—" : <abbr title={(legendas.tipos as Record<string, string>)[c.tipo]}>{c.tipo}</abbr>}
              </td>
              <td className="p-3">{c.tamanho}</td>
              <td className="p-3">{c.decimal}</td>
              <td className="max-w-48 p-3 text-sm break-words whitespace-pre-line">{c.valores}</td>
              <td className="p-3 text-sm whitespace-pre-line">{c.obrigatorio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CaixaRolavel>
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
  return (
    <div className="space-y-10">
      <MarcarVisita codigo={codigo} />
      <div>
        <p className="font-mono text-suave">
          Bloco {bloco} · {ordinal(i + 1)} registro do bloco
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
      </div>

      <section aria-labelledby="t-para">
        <h2 id="t-para" className="mb-3 text-2xl font-bold">
          Para que serve
        </h2>
        <Nivel so="iniciante">
          <p className="mb-3 max-w-prose text-suave">
            Este registro faz parte do bloco {bloco}. {didatico(bloco).objetivo}
          </p>
        </Nivel>
        {r.descricao.length > 0 ? (
          <div className="max-w-prose space-y-2">
            {r.descricao.map((p, n) => (
              <div key={n}>
                <TextoLongo texto={p} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-suave">O Manual não traz descrição para este registro.</p>
        )}
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
          Exemplo preenchido
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
            Cada linha da tabela é um dado que o arquivo leva, na ordem em que aparece. Para ver também as regras de
            validação, mude o nível para “Já conheço”.
          </p>
        </Nivel>
        <TabelaCampos r={r} />
        <p className="mt-2 text-sm text-suave">
          Tipos:{" "}
          {[...new Set(r.campos.map((c) => c.tipo))]
            .filter((t) => t !== "—")
            .map((t) => `${t} = ${(legendas.tipos as Record<string, string>)[t]}`)
            .join("; ")}
          .
        </p>
      </section>

      <Nivel so="profissional">
        <section aria-labelledby="t-regras">
          <h2 id="t-regras" className="mb-3 text-2xl font-bold">
            Regras de validação
          </h2>
          {r.regrasRegistro.length + r.regrasCampo.length === 0 && (
            <p className="text-suave">O Manual não lista regras para este registro.</p>
          )}
          {r.regrasRegistro.length > 0 && (
            <>
              <h3 className="mb-2 text-lg font-semibold">Do registro</h3>
              <ul className="space-y-3">
                {r.regrasRegistro.map((x, n) => (
                  <li key={n} className="border-l-3 border-marca pl-4">
                    <code className="block font-mono text-sm font-semibold break-all">{x.codigo}</code>
                    <TextoLongo texto={x.texto} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {r.regrasCampo.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 text-lg font-semibold">Dos campos</h3>
              <ul className="space-y-3">
                {r.regrasCampo.flatMap((c) =>
                  c.regras.map((x) => (
                    <li key={`${c.campo}-${x.codigo}`} className="border-l-3 border-linha pl-4">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold break-all">{c.campo}</span>
                        <Etiqueta tom={x.tipo === "Erro" ? "alerta" : "neutro"}>
                          {x.tipo === "a verificar" ? "Tipo a verificar" : x.tipo}
                        </Etiqueta>
                      </p>
                      <code className="block font-mono text-sm break-all">{x.codigo}</code>
                      <TextoLongo texto={x.texto} />
                    </li>
                  )),
                )}
              </ul>
            </>
          )}
        </section>
      </Nivel>

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

      <Vizinhos
        rotulo="Outros registros do bloco"
        anterior={doBloco[i - 1] && { href: ir(urlRegistro(doBloco[i - 1]!.codigo), ano), texto: doBloco[i - 1]!.codigo }}
        proximo={doBloco[i + 1] && { href: ir(urlRegistro(doBloco[i + 1]!.codigo), ano), texto: doBloco[i + 1]!.codigo }}
      />
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
