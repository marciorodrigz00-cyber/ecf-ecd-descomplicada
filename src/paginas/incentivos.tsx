import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";
import { FiltroIncentivos } from "@/components/ecf/filtro-incentivos";
import { SITUACAO, SeloSituacao } from "@/components/ecf/situacao-incentivo";
import { comTermos } from "@/components/ecf/com-termos";
import { EtiquetaStatus, LinkFonte, Selo } from "@/components/ecf/rastreio";
import { Nivel } from "@/components/ui";
import { deducaoLimitada, presumidoComAcrescimo } from "@/lib/calculo/lc224";
import { ANO_PADRAO, fontes, regra, textoDoValor } from "@/lib/conteudo";
import { incentivo, incentivos } from "@/lib/conteudo/incentivos";
import { registroDoAno, regimes } from "@/lib/conteudo/leiautes";
import { data, moeda, percentual } from "@/lib/formatos";
import { rota } from "@/lib/rotas";
import { FRUICOES, SITUACOES_LC224, type Incentivo } from "@/schemas";
import { urlRegistro } from "./blocos";

const ir = (b: string, ano: number) => rota(b, ano, ANO_PADRAO);

const FRUICAO: Record<(typeof FRUICOES)[number], string> = {
  presuncao: "Percentual de presunção",
  "deducao-imposto": "Dedução do imposto devido",
  "reducao-imposto": "Redução do imposto",
  exclusao: "Exclusão do lucro real",
  "despesa-dedutivel": "Despesa dedutível",
  credito: "Crédito financeiro",
  isencao: "Isenção",
};
const nomeRegime = (id: string) => regimes.regimes.find((r) => r.id === id)?.nome ?? id;
const fonteNome = (id: string) => fontes.find((f) => f.id === id)!.nome;

function Cabeca({ titulo, children, ano, itens }: { titulo: string; children: React.ReactNode; ano: number; itens: { verificadoEm: string }[] }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold sm:text-4xl">{titulo}</h1>
      <div className="mt-3 max-w-prose text-lg text-suave">{children}</div>
      <div className="mt-4">
        <Selo ano={ano} itens={itens} />
      </div>
    </div>
  );
}

/** O que muda, a partir dos dados: nenhum número ou nome de norma escrito aqui. */
function Aviso({ ano }: { ano: number }) {
  const acrescimo = regra("lc224-acrescimo-presuncao", 2026);
  const limite = regra("lc224-limite-anual", 2026);
  const deducao = regra("lc224-deducao-imposto", 2026);
  const irpj = regra("lc224-inicio-irpj", 2026);
  const csll = regra("lc224-inicio-csll", 2026);
  const lc239 = regra("lc239-acrescimo-presuncao", 2027);
  const pct = (v: { tipo: string; pontosBase?: number }) => (v.tipo === "percentual" ? percentual(v.pontosBase!) : "");
  return (
    <section aria-labelledby="t-lc224" data-testid="aviso-lc224" className="rounded-2xl border border-linha bg-superficie p-6 sm:p-8">
      <p className="font-mono text-xs tracking-widest text-suave uppercase">{fonteNome("lc-224")}</p>
      <h2 id="t-lc224" className="mt-2 text-2xl font-bold">
        O que muda a partir do AC 2026
      </h2>
      <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5">
        <li>
          Incentivos de IRPJ e CSLL que estão no demonstrativo de gastos tributários e não foram excetuados ficam reduzidos: nas deduções do imposto, vale{" "}
          {pct(deducao.valor)} do limite. IRPJ desde {irpj.valor.tipo === "data" ? data(irpj.valor.data) : ""}; CSLL desde{" "}
          {csll.valor.tipo === "data" ? data(csll.valor.data) : ""}.
        </li>
        <li>
          No lucro presumido, a receita que passa de {textoDoValor(limite.valor)} no ano usa percentuais de presunção com acréscimo de {pct(acrescimo.valor)}.
        </li>
        <li>
          A {fonteNome("lc-239")} eleva o acréscimo para {pct(lc239.valor)} a partir de 2027. <EtiquetaStatus status={lc239.status} /> As datas por tributo ainda não têm
          orientação da Receita Federal.
        </li>
      </ul>
      <Link href={ir("/novidades/lc-224-2025", ano)} prefetch={false} className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
        Linha do tempo da lei e o que muda na ECF <ArrowRight aria-hidden size={18} />
      </Link>
    </section>
  );
}

export function Incentivos({ ano }: { ano: number }) {
  const outras = [regra("lc224-csll-transitoria", 2026), regra("lc224-jcp", 2026)];
  return (
    <>
      <Cabeca titulo="Incentivos fiscais" ano={ano} itens={incentivos}>
        <Nivel so="iniciante">Os incentivos de IRPJ e CSLL e o que a lei de 2025 mudou em cada um, com a fonte oficial.</Nivel>
        <Nivel so="profissional">Situação de cada incentivo diante da redução linear, por ano-calendário, com dispositivo e registros da ECF.</Nivel>
      </Cabeca>
      <div className="space-y-12">
        <Aviso ano={ano} />
        <section aria-labelledby="t-lista">
          <h2 id="t-lista" className="mb-4 text-2xl font-bold">
            Incentivos
          </h2>
          <FiltroIncentivos
            regimes={regimes.regimes.map((r) => ({ valor: r.id, texto: r.nome }))}
            situacoes={SITUACOES_LC224.map((s) => ({ valor: s, texto: SITUACAO[s].texto }))}
            itens={incentivos.map((i) => ({
              id: i.id,
              tributos: i.tributos,
              regimes: i.regimes,
              situacao: i.situacao,
              corpo: (
                <Link
                  href={ir(`/incentivos/${i.id}`, ano)}
                  prefetch={false}
                  className="flex h-full flex-col rounded-xl border border-linha bg-superficie p-5 text-tinta no-underline transition-[border-color] hover:border-marca"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs tracking-widest text-suave uppercase">{i.tributos.join(" · ")}</span>
                    <BadgePercent aria-hidden size={18} className="shrink-0 text-suave" />
                  </span>
                  <span className="mt-3 text-lg font-semibold">{i.curto}</span>
                  <span className="mt-1 text-sm text-suave">{FRUICAO[i.fruicao]}</span>
                  <span className="mt-auto pt-4">
                    <SeloSituacao s={i.situacao} />
                  </span>
                </Link>
              ),
            }))}
          />
        </section>
        <section aria-labelledby="t-outras">
          <h2 id="t-outras" className="text-2xl font-bold">
            Outras mudanças da mesma lei
          </h2>
          <p className="mt-2 max-w-prose text-suave">Não são incentivos, mas mudam a apuração ou a ECF.</p>
          <ul className="mt-4 divide-y divide-linha">
            {outras.map((r) => (
              <li key={r.id} className="py-4">
                <p className="font-semibold">{r.titulo}</p>
                <p className="mt-1 max-w-prose">{textoDoValor(r.valor)}.</p>
                {r.resumo && <p className="mt-1 max-w-prose text-sm text-suave">{r.resumo}.</p>}
                <p className="mt-1 text-sm text-suave">
                  {r.norma} · <LinkFonte fonte={r.fonte} curto />
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** Antes × depois, calculado pela mesma biblioteca do simulador (os testes conferem com os exemplos oficiais). */
function Exemplo({ i }: { i: Incentivo }) {
  const ex = i.exemplo;
  if (!ex) return null;
  if (ex.tipo === "deducao") {
    const fator = regra("lc224-deducao-imposto", 2026).valor;
    if (fator.tipo !== "percentual") return null;
    return (
      <div className="space-y-3">
        <p className="text-suave">
          IRPJ à alíquota normal de {moeda(BigInt(ex.irDevido15))}; limite da lei do incentivo de {percentual(ex.limitePb)} desse imposto.
        </p>
        <table className="w-full max-w-2xl text-left">
          <caption className="sr-only">Dedução antes e depois da redução</caption>
          <thead className="border-b border-linha text-sm">
            <tr>
              <th scope="col" className="py-2 pr-4">Valor aplicado</th>
              <th scope="col" className="py-2 pr-4">Dedução antes</th>
              <th scope="col" className="py-2">Dedução no AC 2026</th>
            </tr>
          </thead>
          <tbody>
            {ex.valoresDoados.map((d) => {
              const r = deducaoLimitada(BigInt(ex.irDevido15), ex.limitePb, fator.pontosBase, BigInt(d));
              return (
                <tr key={d} className="border-b border-linha">
                  <td className="py-2 pr-4 font-mono">{moeda(BigInt(d))}</td>
                  <td className="py-2 pr-4 font-mono">{moeda(r.antes)}</td>
                  <td className="py-2 font-mono font-semibold">{moeda(r.deduzivel)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  const acr = regra("lc224-acrescimo-presuncao", 2026).valor;
  const lim = regra("lc224-limite-trimestral", 2026).valor;
  if (acr.tipo !== "percentual" || lim.tipo !== "dinheiro") return null;
  const itens = ex.receitas.map((r) => ({ receita: BigInt(r.centavos), pb: r.presIrpjPb }));
  const depois = presumidoComAcrescimo(itens, BigInt(lim.centavos), acr.pontosBase);
  const antes = presumidoComAcrescimo(itens, itens.reduce((a, x) => a + x.receita, 0n), acr.pontosBase);
  return (
    <div className="space-y-3">
      <p className="text-suave">Base presumida do IRPJ num trimestre, com limite de {moeda(BigInt(lim.centavos))} no período.</p>
      <table className="w-full max-w-3xl text-left">
        <caption className="sr-only">Base presumida antes e depois da redução</caption>
        <thead className="border-b border-linha text-sm">
          <tr>
            <th scope="col" className="py-2 pr-4">Atividade</th>
            <th scope="col" className="py-2 pr-4">Receita</th>
            <th scope="col" className="py-2">Com a LC 224</th>
          </tr>
        </thead>
        <tbody>
          {depois.linhas.map((l, k) => (
            <tr key={ex.receitas[k]!.atividade} className="border-b border-linha align-top">
              <td className="py-2 pr-4">{ex.receitas[k]!.atividade}</td>
              <td className="py-2 pr-4 font-mono">{moeda(l.receita)}</td>
              <td className="py-2 font-mono text-sm">
                {moeda(l.ateLimite)} × {percentual(l.pb)}
                {l.excedente > 0n && (
                  <>
                    {" "}
                    + {moeda(l.excedente)} × {percentual(l.pbAcrescido)}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1">
        <dt>Base presumida antes</dt>
        <dd className="font-mono">{moeda(antes.total)}</dd>
        <dt className="font-semibold">Base presumida no AC 2026</dt>
        <dd className="font-mono font-semibold" data-testid="exemplo-depois">
          {moeda(depois.total)}
        </dd>
      </dl>
    </div>
  );
}

export function PaginaIncentivo({ id, ano }: { id: string; ano: number }) {
  const i = incentivo(id)!;
  const registros = i.registros.filter((r) => registroDoAno(r, ano));
  const secao = "text-2xl font-bold";
  return (
    <article>
      <Cabeca titulo={i.nome} ano={ano} itens={[i]}>
        <p className="flex flex-wrap items-center gap-2 text-base">
          <SeloSituacao s={i.situacao} />
          <EtiquetaStatus status={i.status} />
        </p>
      </Cabeca>
      <div className="space-y-10">
        <div className="max-w-prose text-lg">
          <Nivel so="iniciante">{comTermos(i.iniciante)}</Nivel>
          <Nivel so="profissional">{comTermos(i.profissional)}</Nivel>
        </div>
        {i.situacao === "a-verificar" && i.falta && (
          <p data-testid="falta" className="max-w-prose rounded-lg border border-dashed border-controle bg-fundo px-4 py-3">
            <strong>Falta conferir:</strong> {i.falta}
          </p>
        )}

        <section aria-labelledby="t-quem">
          <h2 id="t-quem" className={secao}>
            Quem pode usar e como funciona
          </h2>
          <dl className="mt-4 grid max-w-3xl gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold">Tributos</dt>
            <dd>{i.tributos.join(" e ")}</dd>
            <dt className="font-semibold">Regimes</dt>
            <dd>{i.regimes.length ? i.regimes.map(nomeRegime).join(", ") : "Conforme a lei do incentivo (não informado nas fontes lidas)"}</dd>
            <dt className="font-semibold">Forma</dt>
            <dd>{FRUICAO[i.fruicao]}</dd>
            {i.setorRegiao && (
              <>
                <dt className="font-semibold">Setor ou região</dt>
                <dd>{i.setorRegiao}</dd>
              </>
            )}
          </dl>
          <p className="mt-4 max-w-prose">{comTermos(i.comoFunciona)}</p>
        </section>

        <section aria-labelledby="t-muda">
          <h2 id="t-muda" className={secao}>
            O que muda com a LC 224
          </h2>
          <p className="mt-2 max-w-prose text-suave">{i.porQue}</p>
          <ol className="mt-4 space-y-4">
            {i.porAno.map((p) => (
              <li key={p.ac} data-ac={p.ac} className="border-l-4 border-linha pl-4">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  AC {p.ac} <EtiquetaStatus status={p.status} />
                </p>
                <p className="mt-1 max-w-prose">{p.efeito}</p>
                <p className="mt-1 text-sm text-suave">
                  {fonteNome(p.fonte.id)}, {p.fonte.trecho} · <LinkFonte fonte={p.fonte} curto />
                </p>
              </li>
            ))}
          </ol>
        </section>

        {i.exemplo && (
          <section aria-labelledby="t-exemplo">
            <h2 id="t-exemplo" className={secao}>
              Antes e depois: {i.exemplo.titulo}
            </h2>
            <div className="mt-4">
              <Exemplo i={i} />
            </div>
            <p className="mt-3 text-sm text-suave">
              Números da fonte: {fonteNome(i.exemplo.fonte.id)}, {i.exemplo.fonte.trecho}. Cálculo feito pela mesma conta do simulador.
            </p>
          </section>
        )}

        <section aria-labelledby="t-ecf">
          <h2 id="t-ecf" className={secao}>
            Onde aparece na ECF
          </h2>
          {registros.length ? (
            <ul className="mt-4 flex flex-wrap gap-3">
              {registros.map((r) => (
                <li key={r}>
                  <Link
                    href={ir(urlRegistro(r), ano)}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-controle bg-superficie px-4 text-tinta no-underline hover:border-marca"
                  >
                    <span className="font-mono font-semibold">{r}</span>
                    <span className="text-sm text-suave">{registroDoAno(r, ano)!.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 max-w-prose text-suave">Nenhum registro da ECF ligado a este incentivo nas fontes lidas.</p>
          )}
        </section>

        {i.judicial && (
          <section aria-labelledby="t-stf">
            <h2 id="t-stf" className={secao}>
              Situação judicial
            </h2>
            <p className="mt-2 max-w-prose">{i.judicial.texto}</p>
            <p className="mt-2 text-sm text-suave">
              Verificado em {data(i.judicial.verificadoEm)}.{" "}
              {i.judicial.fontes.map((f) => (
                <span key={f.id} className="mr-3">
                  <LinkFonte fonte={f} curto /> ({f.trecho})
                </span>
              ))}
            </p>
          </section>
        )}

        <section aria-labelledby="t-base">
          <h2 id="t-base" className={secao}>
            Base legal e fontes
          </h2>
          <ul className="mt-3 space-y-1">
            {i.baseLegal.map((b) => (
              <li key={b.norma}>
                <a href={b.url} rel="noopener noreferrer" className="inline-block py-1 underline underline-offset-4">
                  {b.norma}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-suave">
            Classificação: {fonteNome(i.fonte.id)}, {i.fonte.trecho}. Verificado em {data(i.verificadoEm)}.
          </p>
        </section>

        <Link href={ir("/incentivos", ano)} prefetch={false} className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
          Todos os incentivos <ArrowRight aria-hidden size={18} />
        </Link>
      </div>
    </article>
  );
}

