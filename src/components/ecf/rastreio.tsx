import { BadgeCheck, CircleAlert, FileSearch } from "lucide-react";
import { Cartao, Etiqueta } from "@/components/ui";
import { data, semQuebra } from "@/lib/formatos";
import { fontes, leiauteDoAno, textoDoValor, verificacaoMaisAntiga } from "@/lib/conteudo";
import type { Regra, Status } from "@/schemas";

const STATUS: Record<Status, { texto: string; tom: "ok" | "neutro" | "alerta"; Icone: typeof BadgeCheck }> = {
  revisado: { texto: "Revisado por profissional", tom: "ok", Icone: BadgeCheck },
  conferido: { texto: "Conferido com a fonte", tom: "ok", Icone: BadgeCheck },
  extraido: { texto: "Extraído, sem revisão", tom: "alerta", Icone: FileSearch },
  "a-verificar": { texto: "A verificar", tom: "alerta", Icone: CircleAlert },
};

export function EtiquetaStatus({ status }: { status: Status }) {
  const { texto, tom, Icone } = STATUS[status];
  return (
    <Etiqueta tom={tom}>
      <Icone aria-hidden size={16} />
      {texto}
    </Etiqueta>
  );
}

export function Selo({ ano, itens = [] }: { ano: number; itens?: { verificadoEm: string }[] }) {
  const leiaute = leiauteDoAno(ano);
  return (
    <p data-testid="selo" className="inline-flex items-start gap-2 text-sm text-suave">
      <BadgeCheck aria-hidden size={18} className="mt-0.5 shrink-0 text-ok" />
      <span>
        Atualizado conforme leiaute {leiaute.numero}, verificado em{" "}
        {data(verificacaoMaisAntiga([leiaute, ...itens]))} · AC {ano}
      </span>
    </p>
  );
}

/** curto: ao lado da norma já escrita, o nome da fonte fica só para leitor de tela. */
export function LinkFonte({ fonte, curto = false }: { fonte: Regra["fonte"]; curto?: boolean }) {
  const { nome } = fontes.find((f) => f.id === fonte.id)!;
  return (
    <a href={fonte.url} rel="noopener noreferrer" className="inline-block py-1 underline underline-offset-4">
      {curto ? "Fonte oficial" : nome}
      <span className="sr-only">
        {curto && `: ${nome}`} (site externo), {fonte.trecho}
      </span>
    </a>
  );
}

export function CartaoRegra({ regra }: { regra: Regra }) {
  return (
    <Cartao>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{regra.titulo}</h3>
        <EtiquetaStatus status={regra.status} />
      </div>
      <p className="mt-3 text-lg">{semQuebra(textoDoValor(regra.valor))}.</p>
      {regra.resumo && <p className="mt-2 text-suave">{regra.resumo}</p>}
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm text-suave sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">Norma</dt>
        <dd>{semQuebra(regra.norma)}</dd>
        <dt className="font-semibold">Leiaute</dt>
        <dd>{regra.leiautes.join(" e ")}</dd>
        <dt className="font-semibold">Fonte</dt>
        <dd>
          <LinkFonte fonte={regra.fonte} />
        </dd>
        <dt className="font-semibold">Verificado em</dt>
        <dd>{data(regra.verificadoEm)}</dd>
      </dl>
    </Cartao>
  );
}
