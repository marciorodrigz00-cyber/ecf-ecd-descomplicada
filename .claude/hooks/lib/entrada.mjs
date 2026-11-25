import path from "node:path";
import { fileURLToPath } from "node:url";

/** Raiz do projeto, a partir da posição deste arquivo: não depende da pasta em que o agente está. */
export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Lê o JSON que o Claude Code manda pelo stdin. */
export async function lerEntrada() {
  const partes = [];
  for await (const p of process.stdin) partes.push(p);
  const texto = Buffer.concat(partes).toString("utf8").replace(/^﻿/, "").trim();
  return texto === "" ? {} : JSON.parse(texto);
}

/** Bloqueia: o motivo vai para o agente. */
export function bloquear(mensagem) {
  process.stderr.write(`${mensagem}\n`);
  process.exitCode = 2;
}

/**
 * Avisa sem bloquear. Com saída 0 o stderr só aparece no log; por isso o aviso também
 * vai como additionalContext, que é o que chega ao agente.
 */
export function avisar(evento, mensagem) {
  process.stderr.write(`${mensagem}\n`);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: evento, additionalContext: mensagem } }));
}

/** Caminho relativo à raiz, com "/", ou null se estiver fora do projeto. */
export function relativo(arquivo, raiz = RAIZ) {
  const r = path.relative(raiz, path.resolve(raiz, arquivo));
  if (r === "" || r.startsWith("..") || path.isAbsolute(r)) return null;
  return r.split(path.sep).join("/");
}
