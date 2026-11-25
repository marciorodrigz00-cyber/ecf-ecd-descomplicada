/**
 * No Windows, o export do Next grava out/x/__next.a/b/__PAGE__.txt, mas o cliente pede
 * out/x/__next.a.b.__PAGE__.txt. Este passo renomeia. No Linux não há o que mudar.
 */
import { readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

let movidos = 0;

function achatar(pasta: string, destino: string, prefixo: string) {
  for (const nome of readdirSync(pasta)) {
    const origem = path.join(pasta, nome);
    if (statSync(origem).isDirectory()) achatar(origem, destino, `${prefixo}.${nome}`);
    else {
      renameSync(origem, path.join(destino, `${prefixo}.${nome}`));
      movidos++;
    }
  }
}

function percorrer(pasta: string) {
  for (const nome of readdirSync(pasta)) {
    const cheio = path.join(pasta, nome);
    if (!statSync(cheio).isDirectory() || nome === "_next") continue;
    if (nome.startsWith("__next.")) {
      achatar(cheio, pasta, nome);
      rmSync(cheio, { recursive: true });
    } else percorrer(cheio);
  }
}

percorrer(path.resolve("out"));
console.log(`Segmentos renomeados: ${movidos}`);
