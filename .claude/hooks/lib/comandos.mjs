import path from "node:path";
import { RAIZ } from "./entrada.mjs";

/** Pastas geradas: podem ser apagadas sem perguntar. */
const GERADAS = new Set([
  "node_modules", ".next", "out", "dist", "build", "coverage", "test-results", "playwright-report", ".turbo", ".lighthouseci",
]);

const ARQUIVO_SENSIVEL =
  /(^|[\\/])(\.env([.\w-]*)?|\.npmrc|\.netrc|\.pypirc|\.git-credentials|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|credentials?(\.\w+)?|secrets?(\.\w+)?|service-?account[\w.-]*\.json|[\w.-]+\.(pem|key|pfx|p12|keystore|jks))$/i;

const CONTEUDO_SECRETO = [
  /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{30,}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/,
  /\bnpm_[A-Za-z0-9]{30,}\b/,
  /\bvc[a-z]_[A-Za-z0-9]{24,}\b/,
];

export function arquivoSensivel(arquivo) {
  return ARQUIVO_SENSIVEL.test(arquivo.replace(/["']/g, "").trim());
}

export function conteudoSecreto(texto) {
  return CONTEUDO_SECRETO.some((re) => re.test(texto));
}

const EXE = "(?:\\.cmd|\\.exe|\\.ps1)?";
const PROIBIDOS = [
  [new RegExp(`\\bgit${EXE}\\b(?:\\s+(?:-c\\s+\\S+|-C\\s+(?:"[^"]*"|'[^']*'|\\S+)|--?[\\w-]+(?:=\\S+)?))*\\s+push\\b`, "i"), "git push"],
  [new RegExp(`\\bvercel${EXE}\\b(?=[^;&|\\n]*(?:--prod\\b|\\bdeploy\\b))`, "i"), "publicação na Vercel"],
  [new RegExp(`(?:^|[;&|\\n]|\\bnpx${EXE}(?:\\s+-{1,2}\\w+)*)\\s*vercel${EXE}\\s*(?:$|[;&|\\n]|-)`, "i"), "publicação na Vercel"],
  [new RegExp(`\\b(?:npm|pnpm|yarn)${EXE}\\s+(?:-{1,2}\\S+\\s+)*publish\\b`, "i"), "publicação de pacote"],
  [new RegExp(`\\b(?:npm|pnpm)${EXE}\\b(?=[^;&|\\n]*\\s(?:i|in|ins|inst|install|add|update|up|link)\\b)(?=[^;&|\\n]*\\s(?:-g|--global|--location[= ]global)\\b)`, "i"), "instalação global"],
  [new RegExp(`\\byarn${EXE}\\s+global\\s+add\\b`, "i"), "instalação global"],
  [/\b(?:winget|choco|scoop)(?:\.exe)?\s+(?:install|add|upgrade)\b/i, "instalação global"],
  [new RegExp(`\\b(?:npm|pnpm|yarn)${EXE}\\s+(?:login|adduser|add-user)\\b`, "i"), "login em serviço externo"],
  // Qualquer ferramenta seguida direto de "login", ou um CLI conhecido com "login" mais adiante.
  [/(?:^|[;&|\n]|\bnpx(?:\.cmd)?\s+(?:-{1,2}\w+\s+)*)\s*&?\s*(?!(?:grep|rg|echo|cat|find|findstr|select-string|ls|dir|cd)\b)[\w.@/-]+\s+(?:auth\s+)?(?:login|signin|sign-in)\b/i, "login em serviço externo"],
  [/\b(?:vercel|gh|docker|az|gcloud|aws|netlify|firebase|heroku|supabase|railway|wrangler|flyctl?|npm|pnpm|yarn|claude|doctl)(?:\.cmd|\.exe)?\s(?:[^;&|\n]*\s)?(?:login|signin)\b/i, "login em serviço externo"],
  [/\baws(?:\.exe)?\s+(?:configure|sso\s+login)\b/i, "login em serviço externo"],
  [/\bConnect-(?:AzAccount|MgGraph|ExchangeOnline)\b/i, "login em serviço externo"],
];

/** Divide em comandos simples. Não é um shell: na dúvida, o resultado é bloquear. */
const separar = (cmd) => cmd.split(/&&|\|\||[;|\n\r]|(?<![<>&])&(?![&>])/).map((s) => s.trim()).filter(Boolean);
const palavras = (s) => [...s.matchAll(/"([^"]*)"|'([^']*)'|[^\s"']+/g)].map((m) => m[1] ?? m[2] ?? m[0]);

const VERBO_POSIX = /^(?:rm|rmdir)(?:\.exe)?$/i;
const VERBO_WINDOWS = /^(?:remove-item|ri|rd|rmdir|del|erase|rm)$/i;
const EMBRULHO = /^(?:sudo|command|env|bash|sh|cmd|cmd\.exe|powershell|powershell\.exe|pwsh|pwsh\.exe|-c|-command|-noprofile|\/c|&|\{|\()$/i;

function alvosPermitidos(alvos) {
  if (alvos.length === 0) return false;
  return alvos.every((bruto) => {
    const a = bruto.replace(/[,)}]+$/g, "").replace(/^[({]+/g, "");
    // Variável, subcomando ou curinga na primeira parte: não dá para saber o que seria apagado.
    if (a === "" || /[$`%]/.test(a) || /^[*?~]/.test(a)) return false;
    const posix = process.platform === "win32" ? /^\/([a-z])\//i.exec(a) : null;
    const cheio = path.resolve(RAIZ, posix ? `${posix[1]}:/${a.slice(3)}` : a);
    const rel = path.relative(RAIZ, cheio);
    if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return false;
    return rel.split(/[\\/]/).some((p) => GERADAS.has(p.toLowerCase()));
  });
}

/** Alvo de uma remoção recursiva fora das pastas geradas, ou null. */
export function remocaoRecursiva(cmd) {
  for (const simples of separar(cmd)) {
    const ps = palavras(simples).flatMap((p) => (/\s/.test(p) && /\b(?:rm|rd|rmdir|del|ri|Remove-Item)\b/i.test(p) ? palavras(p) : [p]));
    let i = 0;
    while (i < ps.length && EMBRULHO.test(ps[i])) i++;
    const resto = ps.slice(i);
    const k = resto.findIndex((p) => VERBO_POSIX.test(p) || VERBO_WINDOWS.test(p.replace(/^[({&]+/, "")));
    if (k < 0) {
      if (/\bgit\b.*\bclean\b.*\s-\w*[dx]/i.test(simples)) return "git clean";
      if (/\brimraf\b/i.test(simples) && !alvosPermitidos(resto.slice(resto.findIndex((p) => /rimraf/i.test(p)) + 1))) return "rimraf";
      if (/\b(?:rmSync|rmdirSync|fs\.rm|fs\.rmdir|shutil\.rmtree)\b/.test(simples)) return "remoção por script";
      if (/\bfind\b.*\s-delete\b/i.test(simples)) return "find -delete";
      if (/\[(?:System\.)?IO\.Directory\]::Delete/i.test(simples)) return "IO.Directory.Delete";
      if (/\brobocopy\b.*\s\/(?:mir|purge)\b/i.test(simples)) return "robocopy /MIR";
      continue;
    }
    // "rm" no meio de outra frase (ex.: grep rm arquivo) só conta se abrir o comando ou vier de um pipe.
    if (k > 0 && !/^(?:foreach-object|%|xargs|\{)$/i.test(resto[0]) && !/[{&(]$/.test(resto[k - 1])) continue;
    const args = resto.slice(k + 1);
    const recursiva = args.some((a) => /^-[a-z]*r[a-z]*$/i.test(a) && !/^-(?:whatif|credential|force|filter|erroraction|literalpath|path)$/i.test(a)) || args.some((a) => /^(?:--recursive|-r(?:e(?:c(?:u(?:r(?:se?)?)?)?)?)?|\/s)(?::\$true)?$/i.test(a));
    if (!recursiva) continue;
    const alvos = [];
    for (let n = 0; n < args.length; n++) {
      if (/^-(?:erroraction|ea|filter|include|exclude|credential)$/i.test(args[n])) n++;
      else if (/^-(?:literalpath|path|lp)$/i.test(args[n])) alvos.push(...(args[++n] ?? "").split(","));
      else if (!/^(?:-|\/[a-z]$)/i.test(args[n])) alvos.push(...args[n].split(",").filter(Boolean));
    }
    if (!alvosPermitidos(alvos)) return simples;
  }
  return null;
}

/** Comando de shell que grava em arquivo sensível. Ler também conta: expõe o segredo no histórico. */
function tocaSensivel(cmd) {
  return palavras(cmd)
    .flatMap((p) => p.split(/[=,;()]|>{1,2}/))
    .filter(Boolean)
    .find((p) => arquivoSensivel(p) && !/^(?:credentials?|secrets?)$/i.test(p));
}

/** Motivo do bloqueio, ou null. */
export function motivoComando(cmd) {
  const plano = cmd.replace(/[`^](?=\w)/g, "");
  for (const [re, nome] of PROIBIDOS) if (re.test(plano)) return nome;
  const rem = remocaoRecursiva(plano);
  if (rem) return `remoção recursiva fora de pastas geradas (${rem.slice(0, 80)})`;
  const sens = tocaSensivel(plano);
  if (sens) return `acesso a arquivo com segredos (${sens})`;
  if (conteudoSecreto(cmd)) return "segredo escrito no comando";
  return null;
}
