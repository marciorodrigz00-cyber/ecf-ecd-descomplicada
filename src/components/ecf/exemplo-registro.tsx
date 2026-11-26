import { CaixaRolavel } from "@/components/ui";
import type { ExemploRegistro } from "@/lib/exemplos/por-registro";
import { LinhaExplicada } from "./linha-explicada";

/**
 * Uma linha de exemplo. Quando dá para decompor, cada campo é clicável (linha explicada) e a lista completa fica recolhida.
 * Campos vazios ficam recolhidos para não esconder o que importa.
 */
export function ExemploCampoACampo({ ex, rotulo }: { ex: ExemploRegistro; rotulo: string }) {
  const cheios = ex.partes?.filter((p) => p.valor !== "") ?? [];
  const vazios = ex.partes?.filter((p) => p.valor === "") ?? [];
  return (
    <div>
      {ex.partes ? (
        <LinhaExplicada partes={ex.partes} rotulo={rotulo} />
      ) : (
        <CaixaRolavel rotulo={`Linha de exemplo: ${rotulo}`}>
          <pre className="p-4 font-mono text-sm text-marca">{ex.linha}</pre>
        </CaixaRolavel>
      )}
      {ex.partes && (
        <details className="mt-4">
          <summary className="min-h-8 cursor-pointer font-semibold">Todos os campos em lista</summary>
          <dl className="mt-3 grid grid-cols-1 gap-2">
            {cheios.map((p, i) => (
              <div key={`${p.nome}-${i}`} className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-lg border border-linha bg-fundo p-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
                <dt className="min-w-0">
                  <span className="block font-mono text-sm font-semibold break-all">{p.nome}</span>
                  <span className="mt-1 inline-block max-w-full rounded bg-ok-fundo px-2 py-0.5 font-mono text-sm break-all text-ok">{p.valor}</span>
                </dt>
                <dd className="min-w-0 text-sm break-words whitespace-pre-line text-suave">{p.leitura ?? p.descricao}</dd>
              </div>
            ))}
          </dl>
          {vazios.length > 0 && (
            <p className="mt-3 text-sm text-suave">
              Em branco neste exemplo: <span className="font-mono break-words">{vazios.map((p) => p.nome).join(", ")}</span>.
            </p>
          )}
        </details>
      )}
      <p className="mt-3 text-sm text-suave">{ex.nota}</p>
    </div>
  );
}
