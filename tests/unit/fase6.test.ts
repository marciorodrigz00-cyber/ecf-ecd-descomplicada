import { existsSync, readFileSync, readdirSync } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { fontes, leiautePorAno, novidades, programa } from "@/lib/conteudo";
import { registroDoAno } from "@/lib/conteudo/leiautes";
import { HOSTS_OFICIAIS, Novidade } from "@/schemas";
import { ALVOS, MANUAIS } from "../../tools/monitor/alvos.ts";
import { comparar, relatorio, resumo, type Estado } from "../../tools/monitor/comparar.ts";
import { diaBrasilia, extrair } from "../../tools/monitor/extrair.ts";
import { dentro, executar } from "../../tools/monitor/index.ts";
import { HOSTS, buscar, ipPublico, lookupSeguro, pedir, validarUrl, type Resposta } from "../../tools/monitor/rede.ts";
import { decodificar, htmlParaLinhas, limpar, paraMarkdown, partir } from "../../tools/monitor/sanitizar.ts";

const BARRA = String.fromCharCode(92);
const html = (corpo: string, extra: Partial<Resposta> = {}): Resposta => ({ status: 200, local: null, tipo: "text/html; charset=utf-8", corpo, ...extra });

describe("Monitor: rede", () => {
  test("[SG-011] só endereços exatos da lista", () => {
    for (const u of [
      "http://www.gov.br/sped", "https://gov.br/", "https://www.gov.br.evil.com/", "https://evil.com/www.gov.br", "https://xwww.gov.br/",
      "https://www.gov.br@evil.com/", "https://u:p@www.gov.br/", "https://www.gov.br:8443/", "https://www.gov.br:22/", "https://127.0.0.1/", "https://[::1]/",
      "https://2130706433/", "https://0x7f.1/", "https://169.254.169.254/latest/meta-data", "https://localhost/", "https://www.gov.br./", "file:///etc/passwd",
      "gopher://www.gov.br/", "ftp://www.gov.br/", "data:text/html,x", "javascript:alert(1)", "//www.gov.br/", "www.gov.br", "", "https://www.gov.br/../etc/passwd",
      "https://www.gov.br/a/%2e%2e/b", "https://www.gov.br/a/.%2E/b", "https://www.gov.br/a%2f..%2fb", "https://www.gov.br/%252e%252e/", `https://www.gov.br${BARRA}@evil.com/`,
      "https://www.gov.br/a%00b", "https://www.gov.br/ a", "https://www.gov.br/\n", `https://www.gov.br/${"a".repeat(600)}`, "https://normas.receita.fazenda.gov.br/",
      "https://constructor/", "https://__proto__/", "https://тwww.gov.br/",
    ]) expect(() => validarUrl(u), JSON.stringify(u)).toThrow();
    for (const a of ALVOS) expect(validarUrl(a.url).href, a.id).toBe(a.url);
    for (const h of Object.keys(HOSTS)) expect(HOSTS_OFICIAIS as readonly string[]).toContain(h);
    // Só o portal antigo pode ir sem HTTPS, e nunca como fonte primária.
    for (const a of ALVOS.filter((x) => x.url.startsWith("http:"))) expect([new URL(a.url).hostname, a.confianca]).toEqual(["sped.rfb.gov.br", "secundaria"]);
    expect(new Set(ALVOS.map((a) => a.id)).size).toBe(ALVOS.length);
  });

  test("[SG-012] endereço privado é recusado, mesmo vindo do DNS", async () => {
    for (const ip of [
      "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
      "192.0.2.1", "198.18.0.1", "::1", "::", "fe80::1", "fc00::1", "fd12::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:8.8.8.8", "64:ff9b::7f00:1", "2001:db8::1", "2002:7f00:1::", "xyz", "",
    ]) expect(ipPublico(ip), ip).toBe(false);
    for (const ip of ["161.148.164.31", "8.8.8.8", "172.32.0.1", "2804:294::1", "2606:4700::1111"]) expect(ipPublico(ip), ip).toBe(true);

    const tentar = (enderecos: { address: string; family: number }[], all = false) =>
      new Promise<string>((ok) => {
        lookupSeguro((_, cb) => cb(null, enderecos))("www.gov.br", { all }, (e, a) => ok(e ? `erro: ${e.message}` : JSON.stringify(a)));
      });
    expect(await tentar([{ address: "10.0.0.1", family: 4 }])).toMatch(/não público/);
    // Uma resposta boa não salva uma ruim.
    expect(await tentar([{ address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 }], true)).toMatch(/não público/);
    expect(await tentar([])).toMatch(/sem resposta/);
    expect(await tentar([{ address: "8.8.8.8", family: 4 }])).toBe('"8.8.8.8"');
    // De ponta a ponta: o nome é aceito, o endereço não, e nada é enviado.
    let recebidos = 0;
    const s = http.createServer((_, r) => { recebidos++; r.end("x"); }).listen(0, "127.0.0.1");
    await new Promise((ok) => s.once("listening", ok));
    const porta = (s.address() as AddressInfo).port;
    await expect(pedir(new URL(`http://sped.rfb.gov.br:${porta}/`), { lookup: lookupSeguro((_, cb) => cb(null, [{ address: "127.0.0.1", family: 4 }])) })).rejects.toThrow(/não público/);
    expect(recebidos).toBe(0);
    s.close();
  });

  test("[SG-013] redirecionamento é revalidado a cada passo", async () => {
    const ir = (destino: string | null) => async (u: URL) => (u.pathname === "/a" ? html("", { status: 302, local: destino }) : html(`fim ${u.href}`));
    expect(await buscar("https://www.gov.br/a", ir("/b"))).toBe("fim https://www.gov.br/b");
    for (const d of [
      "https://evil.com/", "//evil.com/", "http://www.gov.br/b", "http://sped.rfb.gov.br/b", "http://169.254.169.254/", "https://127.0.0.1/", "file:///etc/passwd",
      "javascript:alert(1)", "https://www.gov.br@evil.com/", "https://www.gov.br:8080/", null,
    ]) await expect(buscar("https://www.gov.br/a", ir(d)), String(d)).rejects.toThrow();
    let n = 0;
    await expect(buscar("https://www.gov.br/a", async () => { n++; return html("", { status: 301, local: "/a" }); })).rejects.toThrow(/demais/);
    expect(n).toBe(4);
  });

  test("[SG-014] limites de tamanho, tempo, tipo e situação", async () => {
    for (const [r, re] of [
      [html("x", { status: 500 }), /500/], [html("x", { status: 403 }), /403/], [html("x", { tipo: "application/octet-stream" }), /Tipo/], [html("x", { tipo: "" }), /Tipo/],
      [html("x", { tipo: "image/svg+xml" }), /Tipo/],
    ] as const) await expect(buscar("https://www.gov.br/", async () => r)).rejects.toThrow(re);

    const s = http.createServer((q, r) => {
      if (q.url === "/grande") { r.setHeader("content-type", "text/html"); for (let i = 0; i < 50; i++) r.write("a".repeat(1000)); r.end(); }
      else if (q.url === "/declarado") { r.setHeader("content-length", "999999999"); r.write("a"); }
      else if (q.url === "/gzip") { r.setHeader("content-encoding", "gzip"); r.end("x"); }
      else if (q.url === "/lento") r.write("a");
      else r.end(`${q.method} ${q.headers["user-agent"]} ${q.headers.cookie ?? "sem-cookie"}`);
    }).listen(0, "127.0.0.1");
    await new Promise((ok) => s.once("listening", ok));
    const u = (p: string) => new URL(`http://127.0.0.1:${(s.address() as AddressInfo).port}${p}`);
    await expect(pedir(u("/grande"), { bytes: 10_000 })).rejects.toThrow(/grande/);
    await expect(pedir(u("/declarado"))).rejects.toThrow(/grande/);
    await expect(pedir(u("/gzip"))).rejects.toThrow(/comprimida/);
    await expect(pedir(u("/lento"), { ms: 200 })).rejects.toThrow();
    // Só GET, sem cookie e sem dado pessoal na identificação.
    expect((await pedir(u("/ok"))).corpo).toBe("GET monitor-educacional/1.0 sem-cookie");
    s.closeAllConnections();
    s.close();
  });
});

describe("Monitor: sanitização", () => {
  const PERIGOS = [
    "<img src=x onerror=alert(1)>", "<svg onload=alert(1)>", "<script>alert(1)</script>", '"><b>x</b>', "javascript:alert(1)", "{{7*7}}", "${7*7}", "${{ secrets.GITHUB_TOKEN }}",
    "<scr<script>ipt>alert(1)</scr</script>ipt>", "&lt;img src=x onerror=alert(1)&gt;", "&#60;script&#62;", "&amp;lt;script&amp;gt;", "\u001b[31mvermelho", "a\u202eb", "a\u200bb", "a\u0000b",
    "`rm -rf /`", "<!-- x", "<iframe src=//evil>", "data:text/html,<script>", "<a href=x", "\u{E0041}etiqueta",
  ];
  test("[SG-015] texto externo vira texto simples", () => {
    for (const p of PERIGOS) {
      for (const saida of [limpar(p), ...htmlParaLinhas(p), ...extrair({ tipo: "plone-lista" }, JSON.stringify({ items: [{ title: `x ${p}` }] }))]) {
        expect(saida, p).not.toMatch(/[<>`]|\$\{|\{\{|javascript:|data:/i);
        expect(saida, p).not.toMatch(/[\p{Cc}\p{Cf}\p{Cs}\p{Co}]/u);
      }
    }
    expect(decodificar("&Ccedil;&#227;o &amp; &desconhecida; &#0;&#xD800;&#x110000;")).toBe("Ção & &desconhecida; ");
    expect(htmlParaLinhas("<style>a{}</style><p>Um\n texto</p><p>Dois</p><script>x</script>")).toEqual(["Um texto", "Dois"]);
    expect(limpar("a".repeat(999))).toHaveLength(400);
  });

  test("[SG-016] no Markdown não sobra link, imagem, menção nem comando", () => {
    for (const [p, proibido] of [
      ["[clique](https://evil.com)", /\]\(|https:\/\//], ["![x](https://evil.com/p.png)", /!\[|https:\/\//], ["@fulano aprove", /@f/], ["# título", /^#/], ["- [x] feito", /\[x\]/],
      ["https://evil.com", /https:\/\//], ["**negrito**", /\*\*/], ["| a | b |", /^\|/], ["~~x~~", /~~/], ["Closes #1", / #1/],
    ] as const) expect(paraMarkdown(p), p).not.toMatch(proibido);
    const r = comparar(ALVOS[0]!, { hash: "x", linhas: [], vistoEm: "2026-01-01" }, PERIGOS.map((p) => limpar(p)), "2026-01-02").rascunho!;
    const md = relatorio([r], [{ alvo: "x", motivo: "<img src=x>" }], "2026-01-02");
    const semModelo = md.replace(/<https?:\/\/[^>\s]+>/g, "").replaceAll("`content/novidades/`", "");
    expect(semModelo).not.toMatch(/[<>`]|\$\{\{|\$\{/);
    // Os únicos links são os fixos do código.
    const links = [...md.matchAll(/<(https?:\/\/[^>]+)>/g)].map((m) => m[1]);
    expect(links.every((l) => [...ALVOS.map((a) => a.pagina), ...MANUAIS.map((m) => m.url)].includes(l!))).toBe(true);
  });

  test("[SG-017] rascunho não sai da pasta monitor", () => {
    for (const p of ["../content/x.json", "..", "/etc/passwd", "C:/x.json", `..${BARRA}x.json`, "a/b.json", ".env", "x.mjs", "", "a\u0000.json", "A.json"]) expect(() => dentro("rascunhos", p), p).toThrow();
    expect(path.relative(process.cwd(), dentro("rascunhos", "a-1.json")).split(path.sep)).toEqual(["monitor", "rascunhos", "a-1.json"]);
    // O site não lê o que o monitor grava, e o monitor não conhece a pasta de conteúdo.
    const fontesDoSite = readdirSync("src", { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx?$/.test(f));
    for (const f of fontesDoSite) expect(readFileSync(path.join("src", f), "utf8"), f).not.toMatch(/["'`/]monitor\//);
    for (const f of readdirSync("tools/monitor")) {
      const c = readFileSync(`tools/monitor/${f}`, "utf8");
      expect(c, f).not.toMatch(/\beval\(|new Function|child_process|innerHTML/);
      if (f !== "index.ts") expect(c, f).not.toMatch(/writeFile|mkdir|rmSync|unlink/);
    }
  });

  test("[SG-018] workflows com o mínimo de permissão", () => {
    for (const f of ["ci.yml", "monitor.yml"]) {
      const y = readFileSync(`.github/workflows/${f}`, "utf8");
      for (const [, acao] of y.matchAll(/uses:\s*(\S+)/g)) expect(acao, f).toMatch(/^actions\/[a-z-]+@[0-9a-f]{40}$/);
      expect(y, f).not.toMatch(/pull_request_target|secrets\.|write-all|gh pr merge|--auto|auto-merge|vercel/);
      // Nada que venha de fora entra direto em um comando.
      for (const bloco of y.split(/\n\s+run: /).slice(1)) expect(bloco.split(/\n\s+- |\n {2}[a-z]+:/)[0], f).not.toMatch(/\$\{\{/);
    }
    const m = readFileSync(".github/workflows/monitor.yml", "utf8");
    expect(m).toMatch(/^permissions: \{\}$/m);
    const [ler, propor] = m.split("\n  propor:");
    expect(ler).not.toMatch(/: write/);
    // O job que escreve não executa código do projeto nem acessa as fontes.
    expect(propor).not.toMatch(/node |npm /);
    expect(propor).toContain("--draft");
    expect(readFileSync(".github/workflows/ci.yml", "utf8")).not.toMatch(/: write/);
  });
});

describe("Monitor: leitura e comparação", () => {
  const item = (title: string, effective = "2026-10-20T01:30:00+00:00") => ({ title, effective });
  const listaJson = (...i: object[]) => JSON.stringify({ items: i, items_total: i.length });

  test("[CT-060] cada tipo de fonte", () => {
    // 01h30 em UTC ainda é o dia anterior em Brasília.
    expect(diaBrasilia("2026-10-20T01:30:00+00:00")).toBe("2026-10-19");
    expect(diaBrasilia("1969-12-31T00:00:00+00:00")).toBe("sem data");
    expect(diaBrasilia("x")).toBe("sem data");
    expect(extrair({ tipo: "plone-lista" }, listaJson(item("B"), item("A")))).toEqual(["A [2026-10-19]", "B [2026-10-19]"]);
    expect(extrair({ tipo: "plone-pagina" }, JSON.stringify({ title: "T", blocks: { a: { plaintext: "Um" }, b: { value: [{ children: [{ text: "Dois" }] }] } }, blocks_layout: { items: ["b", "a"] } }))).toEqual(["T", "Dois", "Um"]);
    expect(extrair({ tipo: "norma" }, JSON.stringify({ epigrafeCompleta: "IN 1", dadosPublicacao: "DOU", vigente: true, ementas: [{ textoIntegra: "Ementa" }], outrosSegmentos: [{ textoIntegra: "Art. <a href='x'>1º</a>" }, { textoIntegra: "Velho", tachado: true }] }))).toEqual(["IN 1", "DOU", "Vigente: sim", "Ementa", "Art. 1º", "[riscado] Velho"]);
    const prog = ALVOS.find((a) => a.id === "programa-ecf")!;
    expect(extrair(prog, '<h2>Programa ECF</h2>\n<p>Versão 12.2.9</p><a href="https://x/SpedEcf_w64-12.2.9.exe">Baixar</a>')).toEqual(["Programa ECF Versão 12.2.9", "SpedEcf_w64-12.2.9.exe"]);
  });

  test("[CT-061] estrutura que muda vira erro, não silêncio", () => {
    const prog = ALVOS.find((a) => a.id === "programa-ecf")!;
    expect(() => extrair(prog, "<p>Página em manutenção</p>")).toThrow(/estrutura/);
    expect(() => extrair({ tipo: "plone-lista" }, "<html>")).toThrow(/JSON/);
    expect(() => extrair({ tipo: "plone-lista" }, "{}")).toThrow(/estrutura/);
    expect(() => extrair({ tipo: "plone-lista" }, JSON.stringify({ items: [item("A")], items_total: 60 }))).toThrow(/incompleta/);
    expect(() => extrair({ tipo: "plone-pagina" }, '{"title":"x"}')).toThrow(/estrutura/);
    expect(() => extrair({ tipo: "norma" }, "{}")).toThrow(/estrutura/);
    expect(() => extrair({ tipo: "norma" }, "null")).toThrow();
    expect(() => extrair({ tipo: "plone-lista" }, listaJson(...Array.from({ length: 2500 }, (_, i) => item(`t${i}`))))).toThrow(/demais/);
  });

  test("[CT-062] mudança no fim de um artigo longo aparece", () => {
    const longo = `${"palavra, ".repeat(200)}fim`;
    const l = partir(longo);
    expect(l.length).toBeGreaterThan(3);
    expect(l.every((x) => x.length <= 400)).toBe(true);
    expect(l.join(" ")).toBe(limpar(longo, Infinity));
    expect(partir("x".repeat(1000)).join("").replaceAll(" ", "")).toHaveLength(1000);
    expect(resumo(partir(`${longo}.`))).not.toBe(resumo(l));
  });

  test("[CT-063] primeira leitura, sem mudança, com mudança e repetição", async () => {
    const alvo = ALVOS.find((a) => a.id === "comunicados-ecf")!;
    let corpo = listaJson(item("A"));
    const rodar = (e: Estado) => executar([alvo], e, "2026-11-25", async () => corpo, 0);
    const a = await rodar({});
    expect([a.rascunhos.length, a.falhas.length]).toEqual([0, 0]);
    const b = await rodar(a.estado);
    expect(b.rascunhos).toEqual([]);
    expect(b.estado).toEqual(a.estado);
    corpo = listaJson(item("C"), item("A"));
    const c = await rodar(b.estado);
    expect(c.rascunhos).toMatchObject([{ entrou: ["C [2026-10-19]"], saiu: [], status: "rascunho" }]);
    // Sem aceitar o rascunho, o mesmo arquivo é gerado de novo; depois de aceito, silêncio.
    expect((await rodar(b.estado)).rascunhos[0]!.id).toBe(c.rascunhos[0]!.id);
    expect((await rodar(c.estado)).rascunhos).toEqual([]);
  });

  test("[CT-064] falha de uma fonte não apaga o que se sabia nem para as outras", async () => {
    const dois = ALVOS.filter((a) => a.tipo === "plone-lista").slice(0, 2);
    const antes: Estado = { [dois[0]!.id]: { hash: "h", linhas: ["velha"], vistoEm: "2026-01-01" } };
    let tentativas = 0;
    const r = await executar(dois, antes, "2026-11-25", async (u) => {
      if (u === dois[0]!.url) { tentativas++; throw new Error("Resposta 503"); }
      return listaJson(item("ok"));
    }, 0);
    expect(tentativas).toBe(3);
    expect(r.falhas).toEqual([{ alvo: dois[0]!.nome, motivo: "Resposta 503" }]);
    expect(r.estado[dois[0]!.id]).toEqual(antes[dois[0]!.id]);
    expect(r.estado[dois[1]!.id]!.linhas).toEqual(["ok [2026-10-19]"]);
    expect(relatorio([], r.falhas, "2026-11-25")).toContain("503");
  });

  test("[CT-065] relatório cabe em um Pull Request e lembra as fontes manuais", () => {
    const muitas = (p: string) => Array.from({ length: 500 }, (_, i) => `${p} ${i} ${"(x) ".repeat(90)}`);
    const rs = ALVOS.map((a) => comparar(a, { hash: "", linhas: muitas("a"), vistoEm: "" }, muitas("b"), "2026-11-25").rascunho!);
    const md = relatorio(rs, [], "2026-11-25");
    expect(md.length).toBeLessThanOrEqual(60_000);
    for (const m of MANUAIS) expect(md).toContain(m.url);
    expect(rs[0]!.omitidas).toBe(920);
    for (const a of ALVOS) expect(md, a.id).toContain(`- ${paraMarkdown(a.nome)}`);
    expect(md).toContain("(fonte secundária)");
  });

  test("[CT-066] estado inicial cobre todas as fontes", () => {
    const e: Estado = JSON.parse(readFileSync("monitor/estado.json", "utf8"));
    expect(Object.keys(e).sort()).toEqual(ALVOS.map((a) => a.id).sort());
    for (const [k, v] of Object.entries(e)) {
      expect(v.hash, k).toBe(resumo(v.linhas));
      for (const l of v.linhas) expect(l, k).toBe(limpar(l));
    }
  });
});

describe("Novidades", () => {
  test("[CN-036] itens válidos, ordenados e com fonte", () => {
    expect(novidades.length).toBeGreaterThanOrEqual(15);
    expect(novidades.map((n) => n.data)).toEqual(novidades.map((n) => n.data).sort().reverse());
    expect(new Set(novidades.map((n) => n.slug)).size).toBe(novidades.length);
    for (const n of novidades) {
      expect(fontes.some((f) => f.id === n.fonte.id), n.slug).toBe(true);
      expect(n.data <= n.verificadoEm, n.slug).toBe(true);
      // Registro citado existe em algum ano coberto, e nenhum é do bloco fora do escopo.
      for (const r of n.registros) expect(registroDoAno(r, 2025) ?? registroDoAno(r, 2024), r).toBeTruthy();
      expect(JSON.stringify(n)).not.toMatch(/\bS\d{3}\b|Bloco S/);
    }
    // Modelo: a novidade conferida mais recente (a da LC 239 fica "a verificar" e aceita leiaute vazio).
    const base = novidades.find((n) => n.status === "conferido")!;
    for (const ruim of [{ ...base, fonte: { ...base.fonte, url: "https://evil.com/" } }, { ...base, leiautes: [] }, { ...base, slug: "../x" }, { ...base, status: "revisado" }, { ...base, data: "19/10/2026" }, { ...base, extra: 1 }]) {
      expect(Novidade.safeParse(ruim).success).toBe(false);
    }
  });

  test("[CN-037] valores digitados à mão a partir das fontes", () => {
    const n = (s: string) => novidades.find((x) => x.slug === s)!;
    expect(novidades.filter((x) => x.tipo === "programa").map((x) => [x.titulo.split(" ").at(-1), x.data])).toEqual([
      ["12.2.8", "2026-10-19"], ["12.2.7", "2026-09-18"], ["12.2.6", "2026-09-03"], ["12.2.5", "2026-08-31"], ["12.2.4", "2026-08-25"],
      ["12.2.3", "2026-08-02"], ["12.2.2", "2026-07-28"], ["12.2.1", "2026-07-24"], ["12.1.7", "2026-06-22"],
    ]);
    expect(n("outras-exclusoes").profissional).toMatch(/167\.01.*341\.01.*R\$ 20\.000\.000,00.*30%/);
    expect(n("in-2305-lucro-presumido").profissional).toMatch(/10%.*R\$ 5\.000\.000,00.*R\$ 1\.250\.000,00.*01\/01\/2026.*01\/04\/2026/);
    expect(n("in-2305-lucro-presumido").vigencia).toMatchObject({ acNormal: [], situacaoEspecial: [2026] });
    expect([n("ade-cofis-2-2026").data, n("ade-cofis-38-2024").data]).toEqual(["2026-01-29", "2024-12-18"]);
    for (const s of ["ade-cofis-2-2026", "ade-cofis-38-2024"]) expect(leiautePorAno.linhas.some((l) => l.ato === n(s).norma), s).toBe(true);
  });

  test("[CN-038] programa da home é o mais novo do feed", () => {
    const ultima = novidades.find((n) => n.tipo === "programa")!;
    expect(ultima.titulo).toContain(programa.versao);
    expect(ultima.data).toBe(programa.paginaAtualizadaEm);
  });

  test.skipIf(!existsSync("out"))("[SG-019] monitor e rascunhos não vão para o site", () => {
    const arquivos = readdirSync("out", { recursive: true, encoding: "utf8" });
    expect(arquivos.filter((f) => /(^|[\\/])(monitor|rascunhos|estado\.json)([\\/]|$)/.test(f))).toEqual([]);
  });
});
