import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { BaseLegal } from "@/components/ecf/base-legal";
import { comTermos } from "@/components/ecf/com-termos";
import { LinkFonte, Selo } from "@/components/ecf/rastreio";
import { CaixaRolavel, Cartao, Etiqueta, Nivel, estiloBotao } from "@/components/ui";
import { Simulador, type RegraCitada } from "@/components/simulador";
import { ANO_PADRAO, leiauteDoAno, regras, textoDoValor } from "@/lib/conteudo";
import { registroDoAno } from "@/lib/conteudo/leiautes";
import { parametros, parametrosLc224 } from "@/lib/conteudo/tributos";
import { ANO_EXEMPLOS, entradaInicial, exemplo, exemplos, tabelas, type Exemplo } from "@/lib/exemplos";
import { data, inteiro, moeda, semQuebra } from "@/lib/formatos";
import { rota } from "@/lib/rotas";
import { urlRegistro } from "./blocos";

const ir = (base: string, ano: number) => rota(base, ano, ANO_PADRAO);

function Aviso() {
  return (
    <p className="flex max-w-3xl items-start gap-3 rounded-xl bg-alerta-fundo p-4 text-alerta">
      <TriangleAlert aria-hidden size={22} className="mt-0.5 shrink-0" />
      <span>
        Empresas, pessoas e números fictícios, só para estudo. CNPJ e CPF têm dígitos inválidos de propósito. Conteúdo
        educacional; não substitui orientação de profissional contábil nem a legislação oficial.
      </span>
    </p>
  );
}

function OutroAno({ ano, base }: { ano: number; base: string }) {
  if (ano === ANO_EXEMPLOS) return null;
  return (
    <Cartao className="max-w-3xl">
      <p>
        Os exemplos usam o leiaute {leiauteDoAno(ANO_EXEMPLOS).numero}, do ano-calendário {ANO_EXEMPLOS}. Para o
        ano-calendário {ano}, alguns campos são diferentes.
      </p>
      <Link href={ir(base, ANO_EXEMPLOS)} prefetch={false} className={`${estiloBotao({ variante: "contorno" })} mt-4`}>
        Ver no ano-calendário {ANO_EXEMPLOS}
      </Link>
    </Cartao>
  );
}

export function Exemplos({ ano }: { ano: number }) {
  return (
    <div className="space-y-8">
      <Aviso />
      <OutroAno ano={ano} base="/exemplos" />
      <ul className="grid gap-4 lg:grid-cols-3">
        {exemplos.map(({ dados: d, arquivo }) => (
          <li key={d.slug}>
            <Link
              href={ir(`/exemplos/${d.slug}`, ano)}
              prefetch={false}
              className="block h-full rounded-2xl border border-linha bg-superficie p-6 text-tinta no-underline hover:border-marca"
            >
              <Etiqueta>{d.regime}</Etiqueta>
              <h2 className="mt-3 text-xl font-bold">{d.titulo}</h2>
              <div className="mt-2 text-suave">
                <Nivel so="iniciante">{d.iniciante[0]}</Nivel>
                <Nivel so="profissional">{d.profissional[0]}</Nivel>
              </div>
              <p className="mt-4 flex items-center gap-2 font-semibold text-marca">
                {inteiro(arquivo.linhas.length)} linhas explicadas <ArrowRight aria-hidden size={18} />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BASES: Record<string, string[]> = {
  real: ["lucro-real-conceito", "provisoes", "multas-fiscais", "csll-indedutivel", "comp-prejuizo", "comp-base-negativa", "irpj-aliquota", "irpj-adicional", "irpj-adicional-limite", "csll-aliquota", "apuracao-trimestral", "arredondamento"],
  presumido: ["presumido-base", "presumido-opcao", "pres-irpj-geral", "pres-irpj-servicos", "pres-csll-geral", "pres-csll-servicos", "irpj-aliquota", "irpj-adicional", "irpj-adicional-limite", "csll-aliquota", "livro-caixa", "arredondamento"],
  isenta: ["imunes-isentas", "recuperacao-obrigatoria"],
};
const FORA: Record<string, string> = {
  real: "Ficam de fora os blocos C e E, preenchidos pelo programa na recuperação, os blocos sem dados e o bloco 9, gerado no fim.",
  presumido: "Ficam de fora os blocos sem dados e o bloco 9, gerado pelo programa no fim.",
  isenta: "Ficam de fora os blocos sem dados e o bloco 9, gerado pelo programa no fim.",
};

export function PaginaExemplo({ slug, ano }: { slug: string; ano: number }) {
  const e = exemplo(slug)!;
  const d = e.dados;
  return (
    <div className="space-y-10">
      <div>
        <Etiqueta>{d.regime}</Etiqueta>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{d.titulo}</h1>
        <div className="mt-4 max-w-prose space-y-3 text-lg">
          {(["iniciante", "profissional"] as const).map((n) => (
            <Nivel key={n} so={n}>
              {((vistos) =>
                d[n].map((p) => (
                  <p key={p} className="mb-3">
                    {comTermos(p, vistos)}
                  </p>
                )))(new Set<string>())}
            </Nivel>
          ))}
        </div>
        <div className="mt-4">
          <Selo ano={ano} itens={[tabelas.rastreio]} />
        </div>
      </div>
      <Aviso />
      {ano !== ANO_EXEMPLOS ? <OutroAno ano={ano} base={`/exemplos/${slug}`} /> : <Corpo e={e} ano={ano} />}
    </div>
  );
}

function Corpo({ e, ano }: { e: Exemplo; ano: number }) {
  const { dados: d, arquivo } = e;
  const numeradas = arquivo.linhas.map((l, i) => ({ ...l, n: i + 1 }));
  const blocos = [...new Set(arquivo.linhas.map((l) => l.reg[0]!))];
  return (
    <>
      <section aria-labelledby="t-num">
        <h2 id="t-num" className="mb-4 text-2xl font-bold">
          Os números
        </h2>
        <p className="mb-4 text-suave">
          De {data(d.inicio)} a {data(d.fim)}.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {arquivo.resumo.map((r) => (
            <div key={r.titulo} className="min-w-0">
              <h3 className="mb-2 text-lg font-semibold">{r.titulo}</h3>
              <CaixaRolavel rotulo={r.titulo}>
                <table className="w-full min-w-md text-left">
                  <caption className="sr-only">{r.titulo}</caption>
                  <thead className="border-b border-linha text-sm">
                    <tr>
                      <th scope="col" className="p-3">Item</th>
                      {r.colunas.map((c) => (
                        <th key={c} scope="col" className="p-3 text-right">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.linhas.map((l, i) => {
                      const total = /^(TOTAL|LUCRO OU)/.test(l.rotulo);
                      return (
                        <tr key={i} className={`border-b border-linha last:border-0 ${total ? "font-bold" : ""}`}>
                          <th scope="row" className={total ? "p-3 font-bold" : "p-3 font-normal"}>{l.rotulo}</th>
                          {l.valores.map((v, k) => (
                            <td key={k} className="p-3 text-right font-mono text-sm whitespace-nowrap">{moeda(v)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CaixaRolavel>
            </div>
          ))}
        </div>
      </section>

      {d.tipo === "real" && (
        <section aria-labelledby="t-lanc">
          <h2 id="t-lanc" className="mb-4 text-2xl font-bold">
            Lançamentos que geraram os saldos
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {d.periodos.map((p) => (
              <div key={p.id} className="min-w-0">
                <h3 className="mb-2 text-lg font-semibold">{p.id}</h3>
                <CaixaRolavel rotulo={`Lançamentos do ${p.id}`}>
                  <table className="w-full min-w-lg text-left text-sm">
                    <caption className="sr-only">Lançamentos do {p.id}</caption>
                    <thead className="border-b border-linha">
                      <tr>
                        <th scope="col" className="p-3">Histórico</th>
                        <th scope="col" className="p-3">Débito</th>
                        <th scope="col" className="p-3">Crédito</th>
                        <th scope="col" className="p-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.lancamentos.map((l, i) => (
                        <tr key={i} className="border-b border-linha last:border-0">
                          <th scope="row" className="p-3 font-normal">{l.historico}</th>
                          <td className="p-3 font-mono">{l.d}</td>
                          <td className="p-3 font-mono">{l.c}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{moeda(BigInt(l.valor))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CaixaRolavel>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-suave">
            O IRPJ, a CSLL e o encerramento do resultado são calculados e lançados no fim de cada período.
          </p>
        </section>
      )}

      <section aria-labelledby="t-regras">
        <h2 id="t-regras" className="text-2xl font-bold">
          Regras usadas
        </h2>
        <BaseLegal ids={BASES[d.tipo]!} ano={ano} />
      </section>

      <section aria-labelledby="t-arq">
        <h2 id="t-arq" className="text-2xl font-bold">
          O arquivo, linha por linha
        </h2>
        <p className="mt-2 mb-4 max-w-prose text-suave">
          {inteiro(arquivo.linhas.length)} linhas conferidas com o leiaute. {FORA[d.tipo]} Supõe entrega no prazo.
        </p>
        {blocos.map((b) => {
          const regs = [...new Set(numeradas.filter((l) => l.reg[0] === b).map((l) => l.reg))];
          return (
            <div key={b} className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">Bloco {b}</h3>
              <div className="space-y-2">
                {regs.map((reg) => {
                  const r = registroDoAno(reg, ano)!;
                  const linhas = numeradas.filter((l) => l.reg === reg);
                  const campos = r.campos.slice(1);
                  const usados = campos.map((_, i) => linhas.some((l) => l.campos[i] !== ""));
                  return (
                    <details key={reg} data-registro={reg} className="rounded-xl border border-linha bg-superficie">
                      <summary className="flex min-h-11 flex-wrap items-center gap-x-3 px-4 py-2">
                        <span className="font-mono font-semibold">{reg}</span>
                        <span>{r.nome}</span>
                        <span className="text-sm text-suave">
                          {inteiro(linhas.length)} {linhas.length === 1 ? "linha" : "linhas"}
                        </span>
                      </summary>
                      <div className="px-4 pb-4">
                        <p className="mb-3 text-sm">
                          <Link href={ir(urlRegistro(reg), ano)} prefetch={false} className="inline-block py-0.5 underline underline-offset-4">
                            Ver o leiaute do {reg}
                          </Link>
                        </p>
                        <CaixaRolavel rotulo={`Linhas do registro ${reg}`}>
                          <table className="w-full min-w-3xl text-left text-sm">
                            <caption className="sr-only">Linhas do registro {reg}</caption>
                            <thead className="border-b border-linha">
                              <tr>
                                <th scope="col" className="p-2">Linha</th>
                                <th scope="col" className="min-w-64 p-2">O que diz</th>
                                {campos.map((c, i) => usados[i] && (
                                  <th key={c.nome} scope="col" className="p-2 font-mono">{c.nome}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {linhas.map((l) => (
                                <tr key={l.n} className="border-b border-linha align-top last:border-0">
                                  <th scope="row" className="p-2 font-mono font-normal">{inteiro(l.n)}</th>
                                  <td className="min-w-64 p-2">{semQuebra(l.explicacao)}</td>
                                  {campos.map((c, i) => usados[i] && (
                                    <td key={c.nome} className="p-2 font-mono">{l.campos[i] === "" ? "—" : l.campos[i]}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CaixaRolavel>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })}
        <details className="rounded-xl border border-linha bg-superficie">
          <summary className="flex min-h-11 items-center px-4 font-semibold">Ver como texto do arquivo</summary>
          <div className="px-4 pb-4">
            <CaixaRolavel rotulo="Texto do arquivo">
              <pre className="p-4 font-mono text-xs">
                {arquivo.linhas.map((l) => `|${[l.reg, ...l.campos].join("|")}|`).join("\n")}
              </pre>
            </CaixaRolavel>
          </div>
        </details>
        <p className="mt-4 text-sm text-suave">
          Descrições e fórmulas: <LinkFonte fonte={tabelas.rastreio.fonte} />, verificadas em {data(tabelas.rastreio.verificadoEm)}.
        </p>
      </section>
    </>
  );
}

export function PaginaSimulador({ ano }: { ano: number }) {
  const lc = parametrosLc224();
  const citadas: Record<string, RegraCitada> = Object.fromEntries(
    regras
      // As regras do ano e as da LC 224, usadas no modo AC 2026 do lucro presumido.
      .filter((r) => r.vigencia.acNormal.includes(ano) || r.id.startsWith("lc224-"))
      .map((r) => [
        r.id,
        {
          titulo: r.titulo,
          texto: semQuebra([textoDoValor(r.valor), r.resumo?.replace(/\.$/, "")].filter(Boolean).join(". ")),
          norma: semQuebra(r.norma),
          url: r.fonte.url,
          verificar: r.status === "a-verificar",
        },
      ]),
  );
  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-suave">
        Os campos já vêm com o 4º trimestre dos exemplos. Troque os números e veja cada passo mudar.
      </p>
      <Simulador
        parametros={parametros(ano)}
        regras={citadas}
        inicial={entradaInicial}
        ano={ano}
        lc224={{
          ac: lc.ac,
          base: lc.base,
          limiteTrimestre: Number(lc.lc224.limiteTrimestre),
          acrescimoPb: lc.lc224.acrescimoPb,
          trimestreInicioCsll: lc.lc224.trimestreInicioCsll,
          href: rota("/incentivos/lucro-presumido", ano, ANO_PADRAO),
        }}
      />
      <section aria-labelledby="t-limites">
        <h2 id="t-limites" className="text-xl font-bold">
          Limites e critérios
        </h2>
        <BaseLegal ids={["formulas-ecf", "arredondamento", "lc-224", "presumido-opcao"]} ano={ano} />
      </section>
    </div>
  );
}
