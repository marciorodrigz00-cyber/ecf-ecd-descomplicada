/**
 * Depois do build: calcula o hash de cada script inline e grava uma CSP por página em <meta>.
 * Os scripts vivem só nesta política; frame-ancestors e afins vêm do vercel.json, porque <meta> não os aceita.
 * As duas políticas valem ao mesmo tempo.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const MARCA = /<meta http-equiv="Content-Security-Policy"[^>]*>/g;

export function politica(html: string): string {
  const hashes = new Set<string>();
  for (const [, atributos, corpo] of html.matchAll(SCRIPT)) {
    if (/\ssrc\s*=/i.test(atributos ?? "") || !corpo) continue;
    hashes.add(`'sha256-${createHash("sha256").update(corpo, "utf8").digest("base64")}'`);
  }
  return ["default-src 'self'", `script-src 'self' ${[...hashes].join(" ")}`.trim(), "style-src 'self'", "style-src-attr 'unsafe-inline'", "img-src 'self' data:", "object-src 'none'", "base-uri 'none'"].join("; ");
}

export function aplicar(html: string): string {
  const limpo = html.replace(MARCA, "");
  if (!/<head[^>]*>/.test(limpo)) throw new Error("HTML sem <head>");
  return limpo.replace(/<head[^>]*>/, (h) => `${h}<meta http-equiv="Content-Security-Policy" content="${politica(limpo)}">`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(path.sep).join("/"))) {
  const raiz = path.resolve("out");
  const paginas = readdirSync(raiz, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".html"));
  for (const p of paginas) {
    const arquivo = path.join(raiz, p);
    writeFileSync(arquivo, aplicar(readFileSync(arquivo, "utf8")));
  }
  if (paginas.length === 0) throw new Error("Nenhuma página em out/");
  console.log(`CSP aplicada em ${paginas.length} páginas`);
}
