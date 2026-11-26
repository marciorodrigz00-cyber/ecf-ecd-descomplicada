/** Fase 8: auditoria do que será publicado, sobre a pasta out/ e sobre os arquivos do repositório. */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { AVISO_ECD } from "@/lib/seo";
import { HOSTS_OFICIAIS } from "@/schemas";

const temBuild = existsSync("out");
const arquivos = temBuild ? readdirSync("out", { recursive: true, encoding: "utf8" }).map((f) => f.split(path.sep).join("/")) : [];
const paginas = arquivos.filter((f) => f.endsWith(".html"));
const html = new Map(paginas.map((f) => [f, readFileSync(path.join("out", f), "utf8")]));
/** Só o que a pessoa vê: sem scripts e sem o texto serializado do React. */
const corpo = (h: string) => h.replace(/<script\b[\s\S]*?<\/script>/g, " ");
const decodificar = (s: string) => s.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");

describe.skipIf(!temBuild)("Auditoria do site gerado", () => {
  test("[SM-005] nenhum link interno ou âncora quebrados", () => {
    const ids = new Map([...html].map(([f, h]) => [f, new Set([...corpo(h).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!))]));
    const resolver = (p: string) => (p === "/" ? "index.html" : [`${p.slice(1)}.html`, p.slice(1)].find((x) => arquivos.includes(x)));
    const quebrados = new Set<string>();
    let total = 0;
    for (const [f, h] of html) {
      for (const [, bruto] of corpo(h).matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
        const href = decodificar(bruto!);
        if (/^https?:/.test(href)) continue;
        total++;
        const [p, ancora] = href.split("#");
        const alvo = p === "" ? f : resolver(p!);
        if (!alvo || (ancora && !ids.get(alvo)?.has(ancora))) quebrados.add(`${f} → ${href}`);
      }
    }
    expect([...quebrados].slice(0, 20)).toEqual([]);
    expect(total).toBeGreaterThan(10_000);
    // O índice da busca também leva a lugares que existem.
    for (const ano of readdirSync("out/dados")) {
      for (const [, , , href] of JSON.parse(readFileSync(`out/dados/${ano}/busca.json`, "utf8")) as string[][]) {
        const [p, ancora] = href!.split("#");
        const alvo = resolver(p!);
        expect(alvo, href).toBeTruthy();
        if (ancora) expect(ids.get(alvo!)!.has(ancora), href).toBe(true);
      }
    }
  });

  test("[AC-015] um h1, hierarquia de títulos, ids únicos e idioma", () => {
    const problemas: string[] = [];
    for (const [f, h] of html) {
      const c = corpo(h);
      if (!/<html[^>]*lang="pt-BR"/.test(h)) problemas.push(`${f}: idioma`);
      const niveis = [...c.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
      if (niveis.filter((n) => n === 1).length !== 1) problemas.push(`${f}: ${niveis.filter((n) => n === 1).length} h1`);
      niveis.forEach((n, i) => {
        if (i > 0 && n > niveis[i - 1]! + 1) problemas.push(`${f}: h${niveis[i - 1]} seguido de h${n}`);
      });
      const ids = [...c.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
      const repetidos = ids.filter((x, i) => ids.indexOf(x) !== i);
      if (repetidos.length) problemas.push(`${f}: id repetido ${[...new Set(repetidos)].slice(0, 3)}`);
      for (const marco of ["<main", "<header", "<footer", "<nav"]) if (!c.includes(marco)) problemas.push(`${f}: sem ${marco}`);
      for (const [img] of c.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(img)) problemas.push(`${f}: img sem alt`);
    }
    expect(problemas.slice(0, 25)).toEqual([]);
  });

  test("[CN-060] nada em inglês nem valor técnico cru na interface", () => {
    const ingles = /\b(?:loading|click here|read more|search|submit|not found|error occurred|undefined|\[object Object\]|NaN|lorem ipsum|coming soon|home page|next page|previous)\b/i;
    const achados: string[] = [];
    for (const [f, h] of html) {
      // Textos do Manual (registros) citam nomes técnicos; a regra vale para o resto do site.
      if (/blocos\/\w\/\w{4}\.html$/.test(f)) continue;
      const texto = corpo(h).replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
      const m = ingles.exec(texto);
      if (m) achados.push(`${f}: ${texto.slice(Math.max(0, m.index - 30), m.index + 40).replace(/\s+/g, " ")}`);
      if (/\b(?:null|true|false)\b/.test(texto)) achados.push(`${f}: valor cru`);
      if (/R\$\s?\d+\.\d{2}(?!\d)/.test(texto) || /\b\d{4}-\d{2}-\d{2}\b/.test(texto)) achados.push(`${f}: formato fora do padrão`);
    }
    expect(achados.slice(0, 15)).toEqual([]);
  });

  test("[CN-061] avisos em todas as páginas", () => {
    for (const [f, h] of html) {
      expect(h.includes("Conteúdo educacional; não substitui orientação de profissional contábil nem a legislação oficial."), f).toBe(true);
      expect(h.includes(AVISO_ECD), f).toBe(true);
    }
  });

  // Lê o site inteiro: em disco lento passa dos 5 s do limite padrão.
  test("[SG-027] nada sensível no pacote publicado", { timeout: 60_000 }, () => {
    expect(arquivos.filter((f) => /\.(?:map|env|tsx?|ya?ml|lock|pem|key)$|(^|\/)(?:package(?:-lock)?\.json|\.git|node_modules|vercel\.json|CLAUDE\.md|\.claude)(\/|$)/.test(f))).toEqual([]);
    const ruins: [string, RegExp][] = [
      ["segredo", /-----BEGIN [A-Z ]*PRIVATE KEY|\bgh[pousr]_\w{30,}|\bAKIA[0-9A-Z]{16}\b|\bsk-[A-Za-z0-9]{30,}|\bnpm_\w{30,}/],
      ["caminho interno", /[A-Z]:\\\\?(?:Users|dev)\\|\/home\/runner|\/vercel\/path0/],
      ["mapa de código", /sourceMappingURL=/],
      ["dado pessoal", /@gmail\.com|OneDrive/i],
    ];
    const achados: string[] = [];
    for (const f of arquivos.filter((x) => /\.(?:html|js|css|json|txt|xml|svg)$/.test(x))) {
      const t = readFileSync(path.join("out", f), "utf8");
      for (const [nome, re] of ruins) if (re.test(t)) achados.push(`${f}: ${nome} (${re.exec(t)![0].slice(0, 40)})`);
      if (f.endsWith(".html") && /\son(?:click|error|load|mouseover)=/i.test(corpo(t))) achados.push(`${f}: manipulador inline`);
    }
    expect(achados.slice(0, 10)).toEqual([]);
  });

  test("[SG-028] links externos só para fontes oficiais, com rel seguro", () => {
    const fora = new Set<string>();
    for (const [f, h] of html) {
      for (const [tag, href] of corpo(h).matchAll(/<a\b[^>]*\shref="(https?:[^"]*)"[^>]*>/g)) {
        const { hostname, protocol } = new URL(decodificar(href!));
        if (!(HOSTS_OFICIAIS as readonly string[]).includes(hostname)) fora.add(`${f} → ${hostname}`);
        if (protocol !== "https:" && hostname !== "sped.rfb.gov.br") fora.add(`${f} → ${href}`);
        if (!/rel="noopener noreferrer"/.test(tag)) fora.add(`${f}: sem rel ${href}`);
      }
      for (const [, src] of h.matchAll(/<(?:script|link|img|iframe)\b[^>]*\s(?:src|href)="(https?:[^"]*)"/g)) {
        if (!/rel="canonical"|127\.0\.0\.1/.test(src!) && !h.includes(`rel="canonical" href="${src}"`)) fora.add(`${f}: recurso externo ${src}`);
      }
    }
    expect([...fora].slice(0, 10)).toEqual([]);
  });
});

describe("Auditoria do repositório", () => {
  test("[SG-030] nada pessoal, secreto ou indevido entre os arquivos versionáveis", () => {
    const lista = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
    expect(lista.length).toBeGreaterThan(150);
    expect(lista.filter((f) => /(^|\/)(?:\.env|node_modules|\.next|out|test-results)(\/|$|\.)|settings\.local|\.(?:pem|key|pfx|docx|xlsx|pdf)$/.test(f))).toEqual([]);
    const usuario = /[A-Z]:[\\/]+Users[\\/]|\/c\/Users\/(?!x\/)|OneDrive|@gmail\.com|@hotmail|@outlook/i;
    const achados = lista
      // Este arquivo traz os padrões procurados; os testes dos hooks, as amostras.
      .filter((f) => existsSync(f) && !/auditoria\.test\.ts$|\.(?:png|woff2|ico)$|package-lock\.json$/.test(f))
      .filter((f) => usuario.test(readFileSync(f, "utf8")));
    expect(achados).toEqual([]);
  });

  test("[PF-001] Lighthouse nas páginas principais", () => {
    const l = JSON.parse(readFileSync("tests/lighthouse.json", "utf8")) as { em: string; paginas: Record<string, Record<string, number>> };
    expect(l.em).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(l.paginas).length).toBeGreaterThanOrEqual(6);
    for (const [p, n] of Object.entries(l.paginas)) {
      expect(n.accessibility, `${p} acessibilidade`).toBeGreaterThanOrEqual(95);
      expect(n["best-practices"], `${p} boas práticas`).toBeGreaterThanOrEqual(95);
      expect(n.performance, `${p} desempenho`).toBeGreaterThanOrEqual(80);
    }
  });
});
