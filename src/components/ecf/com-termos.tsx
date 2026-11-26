import type { ReactNode } from "react";
import { glossario } from "@/lib/conteudo";
import { Termo } from "./termo";

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Sigla e nome próprio valem só como escritos; o resto, em qualquer caixa. */
const exato = (s: string) => /\p{Lu}.*\p{Lu}/u.test(s);

const nomes = glossario
  .filter((t) => t.dica)
  .flatMap((t) => [t.termo, ...t.sinonimos].map((nome) => ({ nome, t })))
  // O mais longo primeiro: "lucro real" antes de "real", "ECF retificadora" antes de "ECF".
  .sort((a, b) => b.nome.length - a.nome.length);
const RE = new RegExp(`(?<![\\p{L}\\p{N}_-])(${nomes.map((n) => escapar(n.nome).replace(/ /g, "[ \\u00a0]")).join("|")})(?![\\p{L}\\p{N}_-])`, "giu");
const plano = (s: string) => s.replace(/ /g, " ");

/**
 * Marca a primeira vez que cada termo aparece. Passe o mesmo "vistos" a vários textos da tela
 * para não repetir a dica.
 */
export function comTermos(texto: string, vistos: Set<string> = new Set()): ReactNode {
  const saida: ReactNode[] = [];
  let fim = 0;
  for (const m of texto.matchAll(RE)) {
    const achado = plano(m[0]);
    const alvo = nomes.find((n) => (exato(n.nome) ? n.nome === achado : n.nome.toLowerCase() === achado.toLowerCase()));
    if (!alvo || vistos.has(alvo.t.id)) continue;
    vistos.add(alvo.t.id);
    saida.push(texto.slice(fim, m.index));
    const termo = (
      <Termo key={m.index} iniciante={alvo.t.iniciante} profissional={alvo.t.profissional}>
        {m[0]}
      </Termo>
    );
    // A pontuação logo depois do termo fica na mesma linha que ele.
    const pontuacao = /^[.,;:!?)»”]+/.exec(texto.slice(m.index + m[0].length))?.[0] ?? "";
    saida.push(
      pontuacao ? (
        <span key={m.index} className="whitespace-nowrap">
          {termo}
          {pontuacao}
        </span>
      ) : (
        termo
      ),
    );
    fim = m.index + m[0].length + pontuacao.length;
  }
  if (fim === 0) return texto;
  saida.push(texto.slice(fim));
  return saida;
}
