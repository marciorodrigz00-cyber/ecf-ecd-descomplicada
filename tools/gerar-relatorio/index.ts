/** Junta Vitest + Playwright + tests/casos.json + tests/relatorio.json em relatorio-testes-ecf.html. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

type Caso = { id: string; modulo: string; caso: string; severidade: string };
type Bug = {
  id: string; titulo: string; severidade: string; modulos: string[]; casos: string[]; situacao: string;
  passos: string; esperado: string; obtido: string; tecnico: string; evidencia: string;
};
type Extra = {
  versao: string; bugs: Bug[]; aprovados: string[]; acoes: string[]; fora: string[]; reaproveitados: string[]; risco: string;
};
type Resultado = { ok: boolean; nota: string };

const ler = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const casos: Caso[] = ler("tests/casos.json");
const extra: Extra = ler("tests/relatorio.json");
const obtidos = new Map<string, Resultado[]>();
const registrar = (titulo: string, ok: boolean, nota: string) => {
  for (const [, id] of titulo.matchAll(/\[([A-Z]{2}-\d{3})\]/g)) obtidos.set(id!, [...(obtidos.get(id!) ?? []), { ok, nota }]);
};

const vt = ler("test-results/vitest.json");
for (const f of vt.testResults) for (const t of f.assertionResults) registrar(t.title, t.status === "passed", "teste unitário");

const pw = ler("test-results/playwright.json");
const visitar = (s: any) => {
  for (const spec of s.specs ?? []) {
    const nota = spec.tests.flatMap((t: any) => t.annotations.filter((a: any) => a.type === "medida").map((a: any) => a.description));
    registrar(spec.title, spec.ok, ["navegador", ...nota].join("; "));
  }
  for (const x of s.suites ?? []) visitar(x);
};
pw.suites.forEach(visitar);

const desconhecidos = [...obtidos.keys()].filter((id) => !casos.some((c) => c.id === id));
if (desconhecidos.length) throw new Error(`IDs fora do catálogo: ${desconhecidos}`);

const linhas = casos.map((c) => {
  const r = obtidos.get(c.id);
  const bugs = extra.bugs.filter((b) => b.casos.includes(c.id));
  const status = !r ? "Bloqueado" : r.every((x) => x.ok) ? "Passou" : "Falhou";
  const notas = r ? [...new Set(r.map((x) => x.nota))].join("; ") : "Não executado";
  return { ...c, status, notas: r ? `${r.filter((x) => x.ok).length} de ${r.length} verificações; ${notas}` : notas, bugs };
});
const conta = (s: string) => linhas.filter((l) => l.status === s).length;
const abertos = extra.bugs.filter((b) => b.situacao !== "Corrigido");
const falhasSemBug = linhas.filter((l) => l.status === "Falhou" && !l.bugs.some((b) => b.situacao !== "Corrigido"));
const sev = (s: string) => abertos.filter((b) => b.severidade === s).length + falhasSemBug.filter((l) => l.severidade === s).length;
const veredicto =
  sev("Crítica") + sev("Alta") > 0 ? "Reprovado" : sev("Média") > 0 || conta("Bloqueado") > 0 ? "Aprovado com ressalvas" : "Aprovado";

const e = (s: unknown) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const lista = (xs: string[]) => (xs.length ? `<ul>${xs.map((x) => `<li>${e(x)}</li>`).join("")}</ul>` : "<p>—</p>");
const quando = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(pw.stats.startTime));
const ordem = ["Crítica", "Alta", "Média", "Baixa"];
const seg = extra.bugs.filter((b) => b.modulos.includes("SG"));

const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relatório de testes: ECF e ECD Descomplicada</title><style>
body{font:16px/1.6 system-ui,sans-serif;max-width:72rem;margin:0 auto;padding:1.5rem;color:#10201f;background:#f5f7f6}
h1,h2,h3{line-height:1.2}section{background:#fff;border:1px solid #d3dcda;border-radius:12px;padding:1.25rem;margin:1.25rem 0}
.rolar{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:44rem}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #d3dcda;vertical-align:top}
.v{font-size:1.4rem;font-weight:700}.Passou{color:#1c6138}.Falhou{color:#a01c1c}.Bloqueado{color:#8a4b00}dt{font-weight:700}dd{margin:0 0 .5rem}</style></head><body>
<h1>Relatório de testes: ECF e ECD Descomplicada (${e(extra.versao)})</h1>
<section><h2>Cabeçalho</h2><dl><dt>Execução</dt><dd>${e(quando)} (horário de Brasília)</dd><dt>Ambiente</dt><dd>http://127.0.0.1:4173, build estático servido localmente com os cabeçalhos do vercel.json</dd>
<dt>Navegador</dt><dd>Google Chrome instalado na máquina, via Playwright ${e(pw.config.version)}</dd><dt>Larguras</dt><dd>375, 768, 1050 e 1440 px</dd>
<dt>Escopo autorizado</dt><dd>Somente o próprio projeto, em servidor local; provas inofensivas</dd><dt>Módulos</dt><dd>${e([...new Set(casos.map((c) => c.modulo))].join(", "))}</dd></dl></section>
<section><h2>Resumo executivo</h2><p class="v">Veredicto: ${veredicto}</p><p>${casos.length} casos: ${conta("Passou")} passaram, ${conta("Falhou")} falharam, ${conta("Bloqueado")} bloqueados.
Defeitos abertos: ${ordem.map((s) => `${sev(s)} ${s}`).join(", ")}. Encontrados e corrigidos ao longo do projeto: ${extra.bugs.length - abertos.length}. De segurança: ${seg.filter((b) => b.situacao !== "Corrigido").length} abertos, ${seg.filter((b) => b.situacao === "Corrigido").length} corrigidos.</p><p>${e(extra.risco)}</p></section>
<section><h2>Defeitos encontrados</h2>${[...extra.bugs].sort((a, b) => ordem.indexOf(a.severidade) - ordem.indexOf(b.severidade)).map((b) => `<h3>${e(b.id)}: ${e(b.titulo)}</h3><p>${e(b.severidade)} · ${e(b.modulos.join(", "))} · casos ${e(b.casos.join(", "))} · <strong>${e(b.situacao)}</strong></p><dl><dt>Passos</dt><dd>${e(b.passos)}</dd><dt>Esperado</dt><dd>${e(b.esperado)}</dd><dt>Obtido</dt><dd>${e(b.obtido)}</dd><dt>Observações técnicas</dt><dd>${e(b.tecnico)}</dd><dt>Evidência</dt><dd>${e(b.evidencia)}</dd></dl>`).join("") || "<p>Nenhum.</p>"}${falhasSemBug.length ? `<p class="Falhou">Falhas ainda sem registro: ${e(falhasSemBug.map((l) => l.id).join(", "))}</p>` : ""}</section>
<section><h2>Casos de teste executados</h2><div class="rolar" tabindex="0" role="region" aria-label="Casos de teste"><table><thead><tr><th scope="col">ID</th><th scope="col">Módulo</th><th scope="col">Caso de teste</th><th scope="col">Resultado obtido</th><th scope="col">Status</th></tr></thead><tbody>
${linhas.map((l) => `<tr><td>${e(l.id)}</td><td>${e(l.modulo)}</td><td>${e(l.caso)}</td><td>${e(l.notas)}${l.bugs.length ? ` (${e(l.bugs.map((b) => `${b.id}, ${b.situacao.toLowerCase()}`).join("; "))})` : ""}</td><td class="${l.status}">${l.status}</td></tr>`).join("\n")}
</tbody></table></div></section>
<section><h2>Recomendações</h2><h3>Controles aprovados</h3>${lista(extra.aprovados)}<h3>Ações por prioridade</h3>${lista(extra.acoes)}</section>
<section><h2>Fora do escopo verificado</h2>${lista(extra.fora)}<h3>Reaproveitado de execuções anteriores</h3>${lista(extra.reaproveitados)}</section>
</body></html>`;
writeFileSync("relatorio-testes-ecf.html", html);
console.log(`${veredicto}: ${conta("Passou")}/${casos.length} passaram, ${conta("Falhou")} falharam, ${conta("Bloqueado")} bloqueados`);
if (!existsSync("relatorio-testes-ecf.html") || veredicto === "Reprovado") process.exitCode = 1;
