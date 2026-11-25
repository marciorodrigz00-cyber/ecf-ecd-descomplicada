/** Hook 3 (Stop): typecheck, lint e testes unitários, em sequência, antes de encerrar. */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { RAIZ, bloquear, lerEntrada } from "./lib/entrada.mjs";

const MAX = 40;
const local = (...p) => path.join(RAIZ, "node_modules", ...p);
const ETAPAS = [
  ["typecheck", local("typescript", "bin", "tsc"), ["--noEmit"]],
  ["lint", local("oxlint", "bin", "oxlint"), ["--deny-warnings", "--format=unix"]],
  ["testes unitários", local("vitest", "vitest.mjs"), ["run", "--reporter=dot"]],
];

/** Tira cores e linhas sem informação. */
function resumir(texto) {
  return texto
    // eslint-disable-next-line no-control-regex
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "" && !/^\s*(RUN|Start at|Duration|Test Files|JSON report)/.test(l) && !/^[·.x\s⎯]+$/.test(l));
}

const entrada = await lerEntrada().catch(() => ({}));
if (entrada.stop_hook_active !== true) {
  const falhas = [];
  for (const [nome, bin, args] of ETAPAS) {
    if (!existsSync(bin)) {
      falhas.push([nome, [`ferramenta ausente (${path.relative(RAIZ, bin)}). Rode npm install.`]]);
      continue;
    }
    const r = spawnSync(process.execPath, [bin, ...args], {
      cwd: RAIZ,
      encoding: "utf8",
      timeout: 180_000,
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CI: "1" },
    });
    if (r.error) falhas.push([nome, [r.error.message]]);
    else if (r.status !== 0) falhas.push([nome, resumir(`${r.stdout}\n${r.stderr}`)]);
  }
  if (falhas.length) {
    const cabecalho = `Não encerre ainda: falhou ${falhas.map(([n]) => n).join(", ")}. Corrija e tente de novo.`;
    // Divide as linhas entre as etapas que falharam, sem passar do limite total.
    const cota = Math.floor((MAX - 1 - falhas.length) / falhas.length);
    const corpo = falhas.flatMap(([n, l]) => [`== ${n}`, ...(l.length > cota ? [...l.slice(0, cota - 1), `… e mais ${l.length - cota + 1} linhas`] : l)]);
    bloquear([cabecalho, ...corpo].slice(0, MAX).join("\n"));
  }
}
