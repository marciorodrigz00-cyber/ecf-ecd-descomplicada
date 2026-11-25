import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "vitest";
import { leiautePorAno, leiautes, leiautesDaVigencia, rastreaveis } from "@/lib/conteudo";

const HOOKS = path.resolve(".claude/hooks");
const { motivoComando, arquivoSensivel, conteudoSecreto } = await import(
  /* @vite-ignore */ pathToFileURL(path.join(HOOKS, "lib/comandos.mjs")).href
);
const { camposAusentes, eConteudo, todosOsArquivos, validarArquivo } = await import(
  /* @vite-ignore */ pathToFileURL(path.join(HOOKS, "lib/conteudo.mjs")).href
);
const rodar = (hook: string, entrada: unknown) => {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], {
    input: typeof entrada === "string" ? entrada : JSON.stringify(entrada),
    encoding: "utf8",
  });
  return { saida: r.status, erro: r.stderr, out: r.stdout };
};

describe("Hooks do projeto", () => {
  test("[SG-020] comandos sensíveis são bloqueados", () => {
    const bloqueados = [
      "git push",
      "git push origin main --force",
      'git -C "C:\\dev\\ecf descomplicada" push',
      "git -c user.name=x push",
      "git.exe push",
      "npm run build && git push",
      "vercel",
      "vercel --prod",
      "npx vercel --prod",
      "npx -y vercel",
      "npx vercel@latest --prod",
      "vercel deploy",
      "vercel.cmd --yes",
      "npm publish",
      "npm.cmd publish --access public",
      "pnpm publish",
      "npm i -g vercel",
      "npm install --global vercel",
      "npm.cmd i vercel -g",
      "npm install --location=global x",
      "yarn global add x",
      "winget install Git.Git",
      "npm login",
      "npm adduser",
      "vercel login",
      "gh auth login",
      "docker login",
      "gcloud auth login",
      "az login",
      "aws configure",
      "rm -rf src",
      "rm -fr ./content",
      "rm -r -f src",
      "rm --recursive src",
      "rm -rf /",
      "rm -rf ~",
      "rm -rf .",
      "rm -rf *",
      "rm -rf $DIR",
      "rm -rf node_modules/../src",
      "rm -rf node_modules src",
      "rm -rf /c/Users/x/node_modules",
      "cd src && rm -rf components",
      "bash -c 'rm -rf src'",
      "sudo rm -rf src",
      "Remove-Item -Recurse -Force src",
      "Remove-Item src -Recurse",
      "Remove-Item -Path src -Rec -Force",
      `Remove-Item -LiteralPath '${path.resolve("content")}' -Recurse`,
      "ri src -r -fo",
      "rd /s /q src",
      "cmd /c rd /s /q src",
      "rmdir /s src",
      "del /s /q src",
      "powershell -Command \"Remove-Item -Recurse src\"",
      "Get-ChildItem src | Remove-Item -Recurse",
      "Get-ChildItem | ForEach-Object { Remove-Item $_ -Recurse }",
      "if ($true) { Remove-Item -Recurse src }",
      "git clean -fdx",
      "npx rimraf src",
      "find src -delete",
      "node -e \"fs.rmSync('src',{recursive:true})\"",
      "echo A=1 > .env",
      "cat .env.local",
      "cp x .env.example",
      "npx vercel login",
      "vercel --token abc login",
      "netlify.cmd login",
      "& vercel login",
      "Set-Content -Path .env -Value x",
      "cp modelo .env.production",
    ];
    for (const c of bloqueados) expect(motivoComando(c), c).toBeTruthy();
  });

  test("[SG-021] comandos normais passam", () => {
    const livres = [
      "git status",
      "git log --oneline",
      "git commit -m \"corrige o push do menu\"",
      "git stash list",
      "npm run build",
      "npm.cmd run e2e",
      "npm install --save-exact -D oxlint",
      "npm ci",
      "npx playwright test -g login",
      "node .claude/hooks/validar-conteudo.mjs --todos",
      "node tools/servidor-local.ts",
      "rm arquivo.txt",
      "rm -f test-results/vitest.json",
      "rm -rf node_modules",
      "rm -rf .next out",
      "rm -rf ./out/assets",
      "rm -rf test-results playwright-report",
      "Remove-Item -Recurse -Force node_modules",
      "Remove-Item -Recurse -Force .next, out",
      "Remove-Item -Path 'out' -Recurse -Force -ErrorAction SilentlyContinue",
      `Remove-Item -LiteralPath '${path.resolve(".next")}' -Recurse`,
      "rd /s /q .next",
      "npx rimraf out",
      "grep -rn login src",
      "grep -rn 'rm -rf' docs/leia.md",
      "cat vercel.json",
      "ls src/components",
    ];
    for (const c of livres) expect(motivoComando(c), c).toBeNull();
  });

  test("[SG-022] arquivos e textos com segredos", () => {
    for (const f of [".env", "C:\\dev\\x\\.env.local", ".env.example", "/c/x/.env.production", "chave.pem", "id_rsa", ".npmrc", "secrets.json", "credentials.json"]) {
      expect(arquivoSensivel(f), f).toBe(true);
    }
    for (const f of ["src/env.ts", "README.md", "src/lib/secretaria.ts", "tests/unit/hooks.test.ts"]) {
      expect(arquivoSensivel(f), f).toBe(false);
    }
    // Montado em partes para que este arquivo não pareça conter um segredo.
    expect(conteudoSecreto(["-----BEGIN", "PRIVATE KEY-----"].join(" "))).toBe(true);
    expect(conteudoSecreto(`gh${"p_"}${"a".repeat(36)}`)).toBe(true);
    expect(conteudoSecreto("content/leiautes/12/registros/M.json")).toBe(false);

    const edicao = rodar("bloquear-sensivel.mjs", { tool_name: "Write", tool_input: { file_path: path.resolve(".env"), content: "A=1" } });
    expect(edicao.saida).toBe(2);
    expect(edicao.erro).toMatch(/aprovação manual/);
    expect(rodar("bloquear-sensivel.mjs", { tool_name: "PowerShell", tool_input: { command: "git push" } }).saida).toBe(2);
    expect(rodar("bloquear-sensivel.mjs", { tool_name: "Edit", tool_input: { file_path: "README.md", new_string: "x" } }).saida).toBe(0);
    // Entrada ilegível: fecha em vez de liberar.
    expect(rodar("bloquear-sensivel.mjs", "{quebrado").saida).toBe(2);
  });

  test("[CN-030] todo o conteúdo passa pelo hook", async () => {
    const arquivos: string[] = todosOsArquivos();
    expect(arquivos.length).toBeGreaterThan(50);
    for (const a of arquivos) expect((await validarArquivo(a)).erros, a).toEqual([]);
  });

  test("[CN-031] campos ausentes são apontados um a um", () => {
    const item = JSON.parse(readFileSync("content/regras/prazos.json", "utf8"))[0];
    expect(camposAusentes(item)).toEqual([]);
    expect(camposAusentes({ ...item, fonte: undefined })).toEqual(["fonte oficial (fonte.url)"]);
    expect(camposAusentes({ ...item, norma: " " })).toEqual(["norma"]);
    expect(camposAusentes({ ...item, leiautes: [] })).toEqual(["versão do leiaute (leiautes)"]);
    expect(camposAusentes({ ...item, vigencia: { acNormal: [], situacaoEspecial: [] } })).toEqual(["ano-calendário (vigencia.acNormal)"]);
    expect(camposAusentes({ ...item, verificadoEm: undefined })).toEqual(["data da última verificação (verificadoEm)"]);
    expect(eConteudo("content/novo.mdx")).toBe(true);
    expect(eConteudo("src/schemas/index.ts")).toBe(false);
    expect(eConteudo(null)).toBe(false);
  });

  test("[CN-032] arquivo fora do conteúdo não é validado", () => {
    expect(rodar("validar-conteudo.mjs", { tool_name: "Write", tool_input: { file_path: path.resolve("package.json") } })).toEqual({ saida: 0, erro: "", out: "" });
    const r = rodar("validar-conteudo.mjs", { tool_name: "Write", tool_input: { file_path: path.resolve("content/inexistente/x.mdx") } });
    expect(r.saida).toBe(2);
    expect(r.erro).toMatch(/não há schema/);
  });

  test("[CN-033] leiaute de cada item sai da tabela oficial", () => {
    expect(leiautePorAno.linhas).toHaveLength(12);
    expect(leiautesDaVigencia({ acNormal: [2024, 2025], situacaoEspecial: [] })).toEqual(["11", "12"]);
    expect(leiautesDaVigencia({ acNormal: [2025], situacaoEspecial: [2025] })).toEqual(["11", "12"]);
    expect(leiautesDaVigencia({ acNormal: [2014], situacaoEspecial: [] })).toEqual(["1"]);
    for (const l of leiautes) {
      const linha = leiautePorAno.linhas.find((x) => x.leiaute === l.numero)!;
      expect([linha.anoCalendario, linha.ato], l.numero).toEqual([l.anoCalendario, l.norma]);
    }
    for (const x of rastreaveis) expect(x.leiautes, x.id).toEqual(leiautesDaVigencia(x.vigencia));
  });

  test("[SG-023] hook Stop não entra em laço", () => {
    expect(rodar("exigir-testes.mjs", { hook_event_name: "Stop", stop_hook_active: true })).toEqual({ saida: 0, erro: "", out: "" });
  });
});
