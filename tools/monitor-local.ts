/**
 * Roda o monitor neste computador, para a tarefa diária do Windows: o gov.br recusa os servidores do GitHub.
 * Grava monitor/execucao.log (fora do Git) e abre o relatório se houver rascunho novo. Não publica nada.
 */
import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const pasta = path.join(raiz, "monitor");
const relatorio = path.join(pasta, "ultimo.md");
const registro = path.join(pasta, "execucao.log");
const mudouEm = () => (existsSync(relatorio) ? statSync(relatorio).mtimeMs : 0);

const antes = mudouEm();
const r = spawnSync(process.execPath, [path.join(raiz, "tools", "monitor", "index.ts")], { cwd: raiz, encoding: "utf8", timeout: 15 * 60_000 });
// Não deixa o registro crescer para sempre.
if (existsSync(registro) && statSync(registro).size > 500_000) writeFileSync(registro, "");
appendFileSync(registro, `\n===== ${new Date().toISOString()} saída ${r.status}\n${r.stdout ?? ""}${r.stderr ?? ""}`);
if (mudouEm() > antes && process.platform === "win32") spawn("notepad.exe", [relatorio], { detached: true, stdio: "ignore" }).unref();
process.exitCode = r.status ?? 1;
