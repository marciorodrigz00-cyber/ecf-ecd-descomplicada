/** Tudo o que vem de fora vira texto simples antes de entrar em qualquer arquivo. */
const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ordm: "º", ordf: "ª", sect: "§", ndash: "–", mdash: "—",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", acirc: "â", ecirc: "ê", ocirc: "ô", atilde: "ã", otilde: "õ",
  agrave: "à", ccedil: "ç", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Acirc: "Â", Ecirc: "Ê", Ocirc: "Ô",
  Atilde: "Ã", Otilde: "Õ", Agrave: "À", Ccedil: "Ç", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", hellip: "…", bull: "•",
};

export function decodificar(s: string): string {
  return s.replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z]+));/gi, (tudo, dec, hex, nome) => {
    if (nome) return Object.hasOwn(ENTIDADES, nome) ? ENTIDADES[nome]! : tudo;
    const n = dec ? Number(dec) : parseInt(hex, 16);
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : "";
  });
}

/** HTML → linhas de texto. Remove blocos que não são conteúdo. */
export function htmlParaLinhas(html: string): string[] {
  const semBlocos = html
    // Quebra de linha no código não é quebra de linha no texto.
    .replace(/\s+/g, " ")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, " ")
    .replace(/<(script|style|noscript|template|svg|iframe|object)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, " ")
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/td|\/th|\/a)\b[^>]*>/gi, "\n");
  return decodificar(semBlocos.replace(/<[^>]*(?:>|$)/g, " "))
    .split("\n")
    .map((l) => limpar(l, Infinity))
    .filter(Boolean);
}

/**
 * Texto de uma linha, seguro para JSON, Markdown e terminal: sem marcação, sem caracteres de
 * controle, sem inversão de direção nem invisíveis, com tamanho limitado.
 */
export const MAX_LINHA = 400;

export function limpar(s: string, max: number = MAX_LINHA): string {
  const t = s
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    // Controles (inclui ANSI), largura zero, inversão de direção, marcas de ordem e etiquetas invisíveis.
    .replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/gu, " ")
    .replace(/[<>]/g, (c) => (c === "<" ? "‹" : "›"))
    .replace(/`/g, "ˋ")
    .replace(/\b(?:javascript|vbscript|data)\s*:/gi, (m) => m.replace(":", "："))
    // Expressões de modelo e de Actions.
    .replace(/\$\{/g, "$ {")
    .replace(/\{\{/g, "{ {")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Divide sem perder nada: uma mudança no fim de um artigo longo precisa aparecer. */
export function partir(s: string, max: number = MAX_LINHA): string[] {
  const t = limpar(s, Infinity);
  if (t.length <= max) return t ? [t] : [];
  const saida: string[] = [];
  let atual = "";
  for (const p of t.split(/(?<=[.;:,])\s/).flatMap((x) => x.match(new RegExp(`[\\s\\S]{1,${max}}`, "g")) ?? [])) {
    if (atual && atual.length + p.length + 1 > max) {
      saida.push(atual);
      atual = p;
    } else atual = atual ? `${atual} ${p}` : p;
  }
  return [...saida, atual];
}

/** Para Markdown: menções, links, imagens e comandos viram texto. */
export function paraMarkdown(s: string): string {
  return limpar(s)
    .replace(/([\\*_[\]()#!|~])/g, "\\$1")
    .replace(/@/g, "@​")
    .replace(/\b(https?|ftp):\/\//gi, "$1:∕∕");
}
