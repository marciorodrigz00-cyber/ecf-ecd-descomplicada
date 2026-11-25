/** Comparação com o que já foi visto e montagem do rascunho. Nada aqui escreve em content/. */
import { createHash } from "node:crypto";
import { MANUAIS, type Alvo } from "./alvos.ts";
import { limpar, paraMarkdown } from "./sanitizar.ts";

export type Visto = { hash: string; linhas: string[]; vistoEm: string };
export type Estado = Record<string, Visto>;
export type Rascunho = {
  id: string;
  fonte: string;
  nome: string;
  pagina: string;
  confianca: Alvo["confianca"];
  detectadoEm: string;
  entrou: string[];
  saiu: string[];
  omitidas: number;
  status: "rascunho";
};
export type Falha = { alvo: string; motivo: string };

const MAX = 40;
const MAX_TEXTO = 60_000;
export const resumo = (linhas: readonly string[]) => createHash("sha256").update(linhas.join("\n"), "utf8").digest("hex");

/** null: nada mudou. Primeira leitura de uma fonte só registra, não gera rascunho. */
export function comparar(alvo: Alvo, antes: Visto | undefined, linhas: string[], hoje: string): { visto: Visto; rascunho: Rascunho | null } {
  const hash = resumo(linhas);
  if (antes?.hash === hash) return { visto: antes, rascunho: null };
  const visto: Visto = { hash, linhas, vistoEm: hoje };
  if (!antes) return { visto, rascunho: null };
  const [a, b] = [new Set(antes.linhas), new Set(linhas)];
  const entrou = linhas.filter((l) => !a.has(l));
  const saiu = antes.linhas.filter((l) => !b.has(l));
  return {
    visto,
    rascunho: {
      id: `${alvo.id}-${hash.slice(0, 10)}`,
      fonte: alvo.id,
      nome: alvo.nome,
      pagina: alvo.pagina,
      confianca: alvo.confianca,
      detectadoEm: hoje,
      entrou: entrou.slice(0, MAX).map((l) => limpar(l)),
      saiu: saiu.slice(0, MAX).map((l) => limpar(l)),
      omitidas: Math.max(0, entrou.length - MAX) + Math.max(0, saiu.length - MAX),
      status: "rascunho",
    },
  };
}

/** Texto do Pull Request e do resumo do job. */
export function relatorio(rascunhos: readonly Rascunho[], falhas: readonly Falha[], hoje: string): string {
  const L: string[] = [`# Monitor de fontes oficiais, ${hoje}`, ""];
  L.push(
    rascunhos.length
      ? `${rascunhos.length} fonte(s) com mudança. Isto é um **rascunho**: nada aparece no site até uma pessoa conferir na fonte e escrever o item em \`content/novidades/\`.`
      : "Nenhuma mudança nas fontes lidas.",
    "",
  );
  // Índice no topo: mesmo com o texto cortado, nenhuma fonte some do aviso.
  if (rascunhos.length) L.push(...rascunhos.map((r) => `- ${paraMarkdown(r.nome)}${r.confianca === "secundaria" ? " (fonte secundária)" : ""}`), "");
  for (const r of rascunhos) {
    L.push(`## ${paraMarkdown(r.nome)}`, "", `Conferir em: <${r.pagina}>`, "");
    if (r.confianca === "secundaria") L.push("Fonte secundária, sem conexão segura. Só vale depois de confirmada em fonte primária.", "");
    if (r.entrou.length === 0 && r.saiu.length === 0) L.push("A ordem do texto mudou, sem linha nova.", "");
    if (r.entrou.length) L.push("Entrou:", "", ...r.entrou.map((l) => `- ${paraMarkdown(l)}`), "");
    if (r.saiu.length) L.push("Saiu:", "", ...r.saiu.map((l) => `- ${paraMarkdown(l)}`), "");
    if (r.omitidas) L.push(`Mais ${r.omitidas} linha(s) não mostradas.`, "");
    L.push("- [ ] Li a fonte oficial", "- [ ] Conferi se alguma regra, leiaute ou exemplo do site muda", "- [ ] Escrevi ou descartei a novidade", "");
  }
  // O GitHub recusa texto acima de 65.536 caracteres.
  const corpo = L.join("\n");
  const fim: string[] = [];
  if (falhas.length) fim.push("## Fontes que não foram lidas", "", ...falhas.map((f) => `- ${paraMarkdown(f.alvo)}: ${paraMarkdown(f.motivo)}`), "");
  fim.push("## Conferir à mão", "", ...MANUAIS.map((m) => `- ${m.nome}: <${m.url}>. ${m.motivo}`), "");
  const rodape = fim.join("\n");
  const espaco = MAX_TEXTO - rodape.length - 80;
  return corpo.length > espaco ? `${corpo.slice(0, espaco).replace(/\n[^\n]*$/, "")}\n\nTexto cortado. O restante está em \`monitor/rascunhos/\`.\n\n${rodape}` : `${corpo}\n${rodape}`;
}
