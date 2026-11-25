/** Resposta da fonte → linhas de texto comparáveis e já sanitizadas. */
import type { Alvo } from "./alvos.ts";
import { htmlParaLinhas, limpar, partir } from "./sanitizar.ts";

const MAX_LINHAS = 2000;
type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj => (x !== null && typeof x === "object" && !Array.isArray(x) ? (x as Obj) : {});
const lista = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const str = (x: unknown): string => (typeof x === "string" ? x : "");

function json(corpo: string): Obj {
  try {
    return obj(JSON.parse(corpo));
  } catch {
    throw new Error("A resposta não é JSON");
  }
}

/** Dia em Brasília: o portal grava em UTC, e 22h30 de um dia vira o dia seguinte. */
export function diaBrasilia(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 2000) return "sem data";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", dateStyle: "short" }).format(d);
}

/** Texto dos blocos do Plone, na ordem em que aparecem. */
function textos(x: unknown, saida: string[] = [], fundo = 0): string[] {
  if (fundo > 40 || saida.length > MAX_LINHAS) return saida;
  if (Array.isArray(x)) for (const y of x) textos(y, saida, fundo + 1);
  else if (x !== null && typeof x === "object") {
    const o = x as Obj;
    if (typeof o.plaintext === "string" && o.plaintext.trim()) saida.push(o.plaintext);
    else {
      if (typeof o.text === "string" && o.text.trim()) saida.push(o.text);
      for (const [k, v] of Object.entries(o)) if (!["text", "plaintext", "@components", "parent", "styles"].includes(k)) textos(v, saida, fundo + 1);
    }
  }
  return saida;
}

export function extrair(alvo: Pick<Alvo, "tipo" | "trechos">, corpo: string): string[] {
  const linhas = extrairBruto(alvo, corpo).flatMap((l) => partir(l));
  if (linhas.length === 0) throw new Error("Nada encontrado: a estrutura da página pode ter mudado");
  if (linhas.length > MAX_LINHAS) throw new Error("Linhas demais");
  return linhas;
}

function extrairBruto(alvo: Pick<Alvo, "tipo" | "trechos">, corpo: string): string[] {
  switch (alvo.tipo) {
    case "plone-lista": {
      const j = json(corpo);
      const itens = lista(j.items).map(obj);
      if (typeof j.items_total === "number" && j.items_total > itens.length) throw new Error("Lista incompleta: há mais páginas");
      // Ordem própria: a da página muda sem que o conteúdo mude.
      return itens.map((i) => `${str(i.title)} [${diaBrasilia(str(i.effective))}]`).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }
    case "plone-pagina": {
      const j = json(corpo);
      const blocos = obj(j.blocks);
      const ordem = lista(obj(j.blocks_layout).items).map(str);
      if (ordem.length === 0) throw new Error("Página sem blocos: a estrutura pode ter mudado");
      const corpoTexto = ordem.flatMap((k) => (Object.hasOwn(blocos, k) ? textos(blocos[k]) : []));
      return [str(j.title), ...corpoTexto.flatMap((t) => t.split(/\n|(?=\b\d{2}\/\d{2}\/\d{4}\b(?: - Altera|\s+\d+\.))/))];
    }
    case "norma": {
      const j = json(corpo);
      if (!str(j.epigrafeCompleta)) throw new Error("Ato sem epígrafe: a estrutura pode ter mudado");
      const seg = [...lista(j.ementas), ...lista(j.outrosSegmentos)].map(obj);
      return [
        str(j.epigrafeCompleta),
        str(j.dadosPublicacao),
        `Vigente: ${j.vigente === true ? "sim" : "não"}`,
        ...seg.flatMap((s) => htmlParaLinhas(str(s.textoIntegra)).map((l) => (s.tachado === true ? `[riscado] ${l}` : l))),
      ];
    }
    case "html": {
      const texto = `${htmlParaLinhas(corpo).join("\n")}\n${[...corpo.matchAll(/href="([^"]{1,300})"/gi)].map((m) => m[1]).join("\n")}`;
      return (alvo.trechos ?? []).flatMap((re) => {
        const achados = [...texto.matchAll(re)].map((m) => limpar(m[0], Infinity));
        if (achados.length === 0) throw new Error(`Trecho não encontrado (${re.source.slice(0, 40)}): a estrutura pode ter mudado`);
        return [...new Set(achados)];
      });
    }
  }
}
