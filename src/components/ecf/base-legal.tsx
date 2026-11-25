import { CaixaRolavel } from "@/components/ui";
import { EtiquetaStatus, LinkFonte } from "@/components/ecf/rastreio";
import { regra, textoDoValor } from "@/lib/conteudo";
import { data, semQuebra } from "@/lib/formatos";
import type { Regra } from "@/schemas";

function Item({ r }: { r: Regra }) {
  return (
    <li className="border-l-3 border-marca pl-4">
      <p>
        <strong>{r.titulo}.</strong> {semQuebra(`${textoDoValor(r.valor)}. ${r.resumo ?? ""}`)}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-suave">
        <span>{semQuebra(r.norma)}</span>
        <LinkFonte fonte={r.fonte} curto />
        <span>Verificado em {data(r.verificadoEm)}</span>
        <EtiquetaStatus status={r.status} />
      </p>
    </li>
  );
}

/** Iniciante: recolhida. Profissional: aberta. */
export function BaseLegal({ ids, ano }: { ids: readonly string[]; ano: number }) {
  const lista = (
    <ul className="mt-3 space-y-4">
      {ids.map((id) => (
        <Item key={id} r={regra(id, ano)} />
      ))}
    </ul>
  );
  return (
    <div className="mt-3">
      <details data-so="iniciante">
        <summary className="inline-flex min-h-11 items-center font-semibold text-marca underline underline-offset-4">
          Ver a base legal
        </summary>
        {lista}
      </details>
      <div data-so="profissional">{lista}</div>
    </div>
  );
}

export function TabelaRegras({ rotulo, ids, ano }: { rotulo: string; ids: readonly string[]; ano: number }) {
  return (
    <CaixaRolavel rotulo={rotulo}>
      <table className="w-full min-w-3xl text-left">
        <caption className="sr-only">{rotulo}</caption>
        <thead className="border-b border-linha text-sm">
          <tr>
            <th scope="col" className="p-3">Situação</th>
            <th scope="col" className="p-3">Regra</th>
            <th scope="col" className="p-3">Norma e fonte</th>
            <th scope="col" className="p-3">Verificado em</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const r = regra(id, ano);
            return (
              <tr key={id} className="border-b border-linha align-top last:border-0">
                <th scope="row" className="p-3 font-semibold">{r.titulo}</th>
                <td className="p-3">{semQuebra(textoDoValor(r.valor))}</td>
                <td className="p-3 text-sm">
                  {semQuebra(r.norma)}
                  <br />
                  <LinkFonte fonte={r.fonte} curto />
                </td>
                <td className="p-3">{data(r.verificadoEm)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </CaixaRolavel>
  );
}
