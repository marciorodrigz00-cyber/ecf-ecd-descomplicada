import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { BaseLegal, TabelaRegras } from "@/components/ecf/base-legal";
import { LinhaDoTempo } from "@/components/ecf/linha-do-tempo";
import { comTermos } from "@/components/ecf/com-termos";
import { EtiquetaStatus, LinkFonte } from "@/components/ecf/rastreio";
import { Quiz } from "@/components/quiz";
import { Cartao, Nivel, estiloBotao } from "@/components/ui";
import { ANO_PADRAO, linhaDoTempo, paginas, quiz } from "@/lib/conteudo";
import { data, semQuebra } from "@/lib/formatos";
import { rota } from "@/lib/rotas";

function Secoes({ pagina, ano }: { pagina: keyof typeof paginas; ano: number }) {
  // Uma vez por nível: o texto de cada nível aparece sozinho na tela.
  const vistos = { iniciante: new Set<string>(), profissional: new Set<string>() };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {paginas[pagina].map((s) => (
        <section key={s.id} aria-labelledby={s.id} className="rounded-2xl border border-linha bg-superficie p-6">
          <h2 id={s.id} className="text-xl font-bold">
            {s.titulo}
          </h2>
          {(["iniciante", "profissional"] as const).map((n) => (
            <Nivel key={n} so={n}>
              {s[n].map((p) => (
                <p key={p} className="mt-3 max-w-prose">
                  {comTermos(p, vistos[n])}
                </p>
              ))}
            </Nivel>
          ))}
          <BaseLegal ids={s.regras} ano={ano} />
        </section>
      ))}
    </div>
  );
}

function Ecossistema() {
  const caixa = "rounded-xl border border-controle bg-superficie p-4 text-center font-semibold";
  const seta = (
    <>
      <ArrowRight aria-hidden className="mx-auto hidden shrink-0 text-marca md:block" size={28} />
      <ArrowDown aria-hidden className="mx-auto shrink-0 text-marca md:hidden" size={28} />
    </>
  );
  return (
    <figure className="rounded-2xl border border-linha bg-superficie p-6">
      <figcaption className="mb-5">
        <span className="font-semibold">Caminho dos dados.</span> A ECD e a ECF anterior alimentam a ECF, que contém o
        e-Lalur e o e-Lacs. O resultado é enviado pelo Sped e precisa combinar com a DCTF.
      </figcaption>
      <div aria-hidden className="grid items-center gap-4 md:grid-cols-[1fr_auto_1.4fr_auto_1fr]">
        <div className="grid gap-3">
          <div className={caixa}>ECD: contas e saldos</div>
          <div className={caixa}>ECF anterior: saldos finais</div>
        </div>
        {seta}
        <div className="rounded-xl border-2 border-marca bg-fundo p-4 text-center">
          <p className="mb-3 text-lg font-bold">ECF</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className={caixa}>e-Lalur: IRPJ</div>
            <div className={caixa}>e-Lacs: CSLL</div>
          </div>
        </div>
        {seta}
        <div className="grid gap-3">
          <div className={caixa}>Sped</div>
          <div className={caixa}>DCTF</div>
        </div>
      </div>
    </figure>
  );
}

export function OQueE({ ano }: { ano: number }) {
  const itens = linhaDoTempo.map((e) => ({
    id: e.id,
    quando: "data" in e.quando ? data(e.quando.data) : `AC ${e.quando.ano}`,
    titulo: e.titulo,
    corpo: (
      <>
        <div className="mt-3 max-w-prose text-lg">
          <Nivel so="iniciante">{e.iniciante}</Nivel>
          <Nivel so="profissional">{e.profissional}</Nivel>
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-suave">
          <span>{semQuebra(e.norma)}</span>
          <LinkFonte fonte={e.fonte} curto />
          <EtiquetaStatus status={e.status} />
        </p>
      </>
    ),
  }));
  return (
    <div className="space-y-12">
      <Secoes pagina="o-que-e" ano={ano} />
      <section aria-labelledby="t-mapa">
        <h2 id="t-mapa" className="mb-4 text-2xl font-bold">
          A ECF no ecossistema Sped
        </h2>
        <Ecossistema />
      </section>
      <section aria-labelledby="t-tempo">
        <h2 id="t-tempo" className="mb-4 text-2xl font-bold">
          Linha do tempo
        </h2>
        <LinhaDoTempo itens={itens} />
      </section>
      <Link
        href={rota("/importancia", ano, ANO_PADRAO)}
        prefetch={false}
        data-testid="link-importancia"
        className="flex items-center justify-between gap-4 rounded-2xl border-2 border-marca bg-superficie p-6 text-tinta no-underline hover:bg-fundo"
      >
        <span>
          <span className="block text-xl font-bold">Por que a ECF importa</span>
          <span className="mt-1 block text-suave">Para que o Fisco usa a ECF, os cruzamentos e o que acontece quando ela atrasa.</span>
        </span>
        <ArrowRight aria-hidden size={24} className="shrink-0" />
      </Link>
    </div>
  );
}

export function Importancia({ ano }: { ano: number }) {
  return (
    <div className="space-y-12">
      <Secoes pagina="importancia" ano={ano} />
      <section aria-labelledby="t-multas">
        <h2 id="t-multas" className="text-2xl font-bold">
          Multas
        </h2>
        <div className="mt-3 max-w-prose text-lg text-suave">
          <Nivel so="iniciante">
            Atrasar ou errar custa caro, e a conta muda conforme o regime. Quem corrige antes de ser fiscalizado paga
            menos ou, em um dos casos, não paga.
          </Nivel>
          <Nivel so="profissional">O regime define o dispositivo aplicável, a base de cálculo e as reduções.</Nivel>
        </div>
        <BaseLegal ids={["multa-qual", "multa-automatica"]} ano={ano} />
        <h3 className="mt-8 mb-3 text-xl font-bold">Lucro real</h3>
        <TabelaRegras
          rotulo="Multas no lucro real"
          ano={ano}
          ids={[
            "multa-real-atraso",
            "multa-real-limite",
            "multa-real-reducao",
            "multa-real-sem-lucro",
            "multa-real-erro",
            "multa-real-erro-reducao",
          ]}
        />
        <h3 className="mt-8 mb-3 text-xl font-bold">Demais pessoas jurídicas</h3>
        <TabelaRegras
          rotulo="Multas das demais pessoas jurídicas"
          ano={ano}
          ids={["multa-demais-atraso", "multa-demais-requisitos", "multa-demais-erro", "multa-demais-reducao"]}
        />
      </section>
    </div>
  );
}

export function QuemDeveEntregar({ ano }: { ano: number }) {
  const bases = Object.fromEntries(
    [...quiz.resultados, ...quiz.complementos].map((x) => [x.id, <BaseLegal key={x.id} ids={x.regras} ano={ano} />]),
  );
  return (
    <div className="space-y-12">
      <section aria-label="Quiz: minha empresa precisa entregar?" className="max-w-3xl">
        <Quiz quiz={quiz} bases={bases} />
        <p className="mt-3 text-sm text-suave">
          Resultado para estudo, referente ao ano-calendário {ano}. Nada do que você responde sai deste navegador.
        </p>
      </section>
      <section aria-labelledby="t-regras">
        <h2 id="t-regras" className="mb-4 text-2xl font-bold">
          As regras por trás do quiz
        </h2>
        <TabelaRegras
          rotulo="Regras de obrigatoriedade"
          ano={ano}
          ids={["obrigados", "dispensa-simples", "dispensa-publicos", "dispensa-inativas", "scp", "imunes-isentas"]}
        />
      </section>
      <section aria-labelledby="t-prazos">
        <h2 id="t-prazos" className="mb-4 text-2xl font-bold">
          Prazos
        </h2>
        <TabelaRegras
          rotulo="Prazos de entrega"
          ano={ano}
          ids={["prazo-regra-geral", "prazo-especial-1", "prazo-especial-2", "prazo-horario"]}
        />
        <Cartao className="mt-5 max-w-2xl">
          <p>Já sabe que precisa entregar? O próximo passo é conhecer o arquivo.</p>
          <Link href={rota("/blocos", ano, ANO_PADRAO)} prefetch={false} className={`${estiloBotao()} mt-4`}>
            Ver os blocos <ArrowRight aria-hidden size={18} />
          </Link>
        </Cartao>
      </section>
    </div>
  );
}
