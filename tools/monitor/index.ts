/**
 * Lê as fontes oficiais, compara com monitor/estado.json e grava rascunhos em monitor/rascunhos/.
 * Nunca escreve fora de monitor/. Uso: node tools/monitor/index.ts [--seco]
 * Saída 1 se alguma fonte não foi lida: falha não pode passar despercebida.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ALVOS, type Alvo } from "./alvos.ts";
import { comparar, relatorio, type Estado, type Falha, type Rascunho } from "./comparar.ts";
import { diaBrasilia, extrair } from "./extrair.ts";
import { buscar } from "./rede.ts";
import { limpar } from "./sanitizar.ts";

export const PASTA = path.resolve(import.meta.dirname, "..", "..", "monitor");

/** Caminho dentro de monitor/, só com nome simples. */
export function dentro(...partes: string[]): string {
  if (partes.some((p) => !/^[a-z0-9][a-z0-9-]*(?:\.(?:json|md))?$/.test(p))) throw new Error("Nome de arquivo recusado");
  const alvo = path.resolve(PASTA, ...partes);
  if (path.relative(PASTA, alvo).startsWith("..")) throw new Error("Caminho fora de monitor/");
  return alvo;
}

type Busca = (url: string) => Promise<string>;
const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export async function executar(alvos: readonly Alvo[], estado: Estado, hoje: string, ler: Busca = buscar, pausa = 5000) {
  const novo: Estado = { ...estado };
  const rascunhos: Rascunho[] = [];
  const falhas: Falha[] = [];
  // Em série e com pausa: uma leitura por fonte por dia, sem pressionar os portais.
  for (const alvo of alvos) {
    for (let tentativa = 1; ; tentativa++) {
      try {
        const { visto, rascunho } = comparar(alvo, estado[alvo.id], extrair(alvo, await ler(alvo.url)), hoje);
        novo[alvo.id] = visto;
        if (rascunho) rascunhos.push(rascunho);
        break;
      } catch (e) {
        if (tentativa >= 3) {
          falhas.push({ alvo: alvo.nome, motivo: limpar(e instanceof Error ? e.message : String(e), 160) });
          break;
        }
        await esperar(pausa * tentativa);
      }
    }
    await esperar(pausa / 2);
  }
  return { estado: novo, rascunhos, falhas };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const hoje = diaBrasilia(new Date().toISOString());
  const arquivo = dentro("estado.json");
  const antes: Estado = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, "utf8")) : {};
  const { estado, rascunhos, falhas } = await executar(ALVOS, antes, hoje);
  const texto = relatorio(rascunhos, falhas, hoje);
  console.log(texto);
  if (!process.argv.includes("--seco")) {
    mkdirSync(dentro("rascunhos"), { recursive: true });
    writeFileSync(arquivo, `${JSON.stringify(estado, null, 2)}\n`);
    for (const r of rascunhos) writeFileSync(dentro("rascunhos", `${r.id}.json`), `${JSON.stringify(r, null, 2)}\n`);
    if (rascunhos.length) writeFileSync(dentro("ultimo.md"), texto);
  }
  process.exitCode = falhas.length ? 1 : 0;
}
