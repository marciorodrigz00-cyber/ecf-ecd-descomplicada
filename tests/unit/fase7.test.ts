import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { isValidElement, type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { comTermos } from "@/components/ecf/com-termos";
import { buscar, normalizar, preparar, type LinhaIndice } from "@/lib/busca";
import { montarIndice } from "@/lib/busca/indice";
import { ANO_PADRAO, anos, glossario, regra } from "@/lib/conteudo";
import { registroDoAno, registrosDoAno } from "@/lib/conteudo/leiautes";
import { Termo } from "@/schemas";
import { securityTxt } from "../../tools/security-txt.ts";

const indice = preparar(montarIndice(2025));
const achar = (q: string) => buscar(indice, q);

describe("Busca", () => {
  test("[CT-090] caixa, acentos, espaços e código", () => {
    for (const q of ["M300", "m300", "  m300  ", "M300 "]) expect(achar(q)[0], JSON.stringify(q)).toMatchObject({ tipo: "registro", codigo: "M300", href: "/blocos/m/m300" });
    const alvo = achar("prejuízo fiscal")[0];
    expect(alvo).toMatchObject({ tipo: "termo", titulo: "prejuízo fiscal" });
    for (const q of ["PREJUÍZO FISCAL", "prejuizo fiscal", "  Prejuizo   FISCAL "]) expect(achar(q)[0], q).toEqual(alvo);
    expect(normalizar("  Ação\t ÀÇÃO  ")).toBe("acao acao");
    expect(achar("m")[0]).toMatchObject({ tipo: "bloco", codigo: "M" });
    expect(achar("9")[0]).toMatchObject({ tipo: "bloco", codigo: "9" });
    // Campo pelo nome completo, pelo nome solto e por palavras fora de ordem.
    expect(achar("0010.FORMA_TRIB")[0]).toMatchObject({ tipo: "campo", href: "/blocos/0/0010#forma-trib" });
    expect(achar("forma_trib").map((r) => r.codigo)).toContain("0010.FORMA_TRIB");
    expect(achar("caixa livro").map((r) => r.titulo)).toEqual(expect.arrayContaining(["livro caixa"]));
    expect(achar("12.2.8")[0]).toMatchObject({ tipo: "novidade" });
    expect(achar("simulador")[0]).toMatchObject({ tipo: "secao", href: "/simulador" });
  });

  test("[CT-091] vazio, sem resultado, entrada estranha e limite", () => {
    for (const q of ["", "   ", "\t\n"]) expect(achar(q)).toEqual([]);
    for (const q of ["xyzxyz", "<img src=x onerror=alert(1)>", "{{7*7}}", "${7*7}", "javascript:alert(1)", "(((", "[a-", "\\", "*", "S100"]) expect(achar(q), q).toEqual([]);
    expect(achar("a".repeat(5000))).toEqual([]);
    expect(achar("valor").length).toBe(40);
  });

  test("[CT-092] ordem original preservada entre iguais", () => {
    const linhas: LinhaIndice[] = ["B", "A", "C"].map((x) => [1, x, "igual", `/${x}`, ""]);
    expect(buscar(preparar(linhas), "igual").map((r) => r.codigo)).toEqual(["B", "A", "C"]);
    expect(linhas.map((l) => l[1])).toEqual(["B", "A", "C"]);
    expect(achar("m300").slice(1).filter((r) => r.tipo !== "regra").every((r) => r.codigo.startsWith("M300."))).toBe(true);
  });

  test("[CT-093] índice cobre tudo, por ano, sem o que está fora do escopo", () => {
    for (const ano of anos) {
      const l = montarIndice(ano);
      const regs = registrosDoAno(ano);
      const porTipo = (n: number) => l.filter((x) => x[0] === n).length;
      expect([porTipo(0), porTipo(1), porTipo(3)]).toEqual([17, regs.length, glossario.length]);
      expect(porTipo(2)).toBe(regs.reduce((s, r) => s + r.campos.length - 1, 0));
      expect(l.filter((x) => x[0] === 1 || x[0] === 2).filter((x) => x[1].startsWith("S"))).toEqual([]);
      for (const x of l) expect(x[3], x[2]).toMatch(ano === ANO_PADRAO ? /^\/(?!ac\/)/ : new RegExp(`^/ac/${ano}/`));
      expect(new Set(l.map((x) => x[3])).size).toBe(l.length);
    }
    // Só no leiaute 12.
    const so12 = registrosDoAno(2025).find((r) => !registroDoAno(r.codigo, 2024))!;
    expect(buscar(preparar(montarIndice(2024)), so12.codigo).some((r) => r.codigo === so12.codigo)).toBe(false);
  });

  test("[RD-005] busca rápida e índice leve", () => {
    const t = performance.now();
    for (const q of ["m300", "valor", "lucro", "a", "prejuizo fiscal", "xyz"]) achar(q);
    expect(performance.now() - t).toBeLessThan(400);
    expect(Buffer.byteLength(JSON.stringify(montarIndice(2025)))).toBeLessThan(600_000);
  });
});

describe("Glossário", () => {
  test("[CN-050] termos com fonte, referências vivas e sem nome repetido", () => {
    expect(glossario.length).toBeGreaterThanOrEqual(40);
    for (const t of glossario) {
      for (const r of t.regras) for (const a of anos) expect(() => regra(r, a), `${t.id} ${r}`).not.toThrow();
      for (const r of t.registros) expect(registroDoAno(r, 2025), `${t.id} ${r}`).toBeTruthy();
      expect(t.status, t.id).toBe("conferido");
      expect(`${t.termo} ${t.iniciante} ${t.profissional}`, t.id).not.toMatch(/\bBloco S\b|\d\s?%|R\$/);
    }
    expect(new Set(glossario.map((t) => t.id)).size).toBe(glossario.length);
    const base = glossario[0]!;
    for (const ruim of [{ ...base, fonte: undefined }, { ...base, id: "A b" }, { ...base, leiautes: [] }, { ...base, registros: ["x"] }]) expect(Termo.safeParse(ruim).success).toBe(false);
  });

  test("[CN-051] termos do Manual e da IN conferidos à mão", () => {
    const t = (id: string) => glossario.find((x) => x.id === id)!;
    expect(t("ecf").norma).toMatch(/2\.004\/2021, art\. 2º/);
    expect(t("dipj").profissional).toContain("1º de janeiro de 2014");
    expect(t("retificadora").profissional).toContain("substitui-a integralmente");
    expect(t("adicional").regras).toContain("irpj-adicional-limite");
    expect(t("situacao-especial").profissional).toMatch(/Extinção, fusão, incorporação e cisão/);
  });

  // O termo seguido de pontuação vem dentro de um <span> que impede a quebra de linha entre eles.
  const itens = (n: ReactNode): ReactNode[] =>
    (Array.isArray(n) ? n : [n]).flatMap((x) => (isValidElement(x) && x.type === "span" ? itens((x as { props: { children: ReactNode } }).props.children) : [x]));
  const marcas = (n: ReactNode) => itens(n).filter((x) => isValidElement(x)).map((x) => (x as { props: { children: string } }).props.children);
  const plano = (n: ReactNode) => itens(n).map((x) => (isValidElement(x) ? (x as { props: { children: string } }).props.children : x)).join("");
  test("[CT-094] dica: o termo mais longo, uma vez, em palavra inteira e sem mudar o texto", () => {
    expect(marcas(comTermos("A ECF usa o plano de contas referencial."))).toEqual(["ECF", "plano de contas referencial"]);
    expect(marcas(comTermos("ECF e ECF e ECF."))).toEqual(["ECF"]);
    expect(marcas(comTermos("ECF retificadora substitui a ECF."))).toEqual(["ECF retificadora", "ECF"]);
    // Sigla vale só como escrita; pedaço de palavra e código não contam.
    expect(marcas(comTermos("ecf SPEDECF ECFX SCPs X_ECF ECF-2"))).toEqual([]);
    expect(marcas(comTermos("Lucro Real e lucro presumido"))).toEqual(["Lucro Real", "lucro presumido"]);
    // Palavras comuns ficam só no glossário.
    expect(marcas(comTermos("o registro e o campo do leiaute"))).toEqual([]);
    const vistos = new Set<string>();
    comTermos("A CSLL", vistos);
    expect(marcas(comTermos("outra CSLL", vistos))).toEqual([]);
    for (const s of ["", "sem termo", "ECF", "x ECF", "ECF e CSLL, <b>e-Lalur</b> {{7*7}}", "IRPJ", "o plano referencial.", "ECF), CSLL;"]) expect(plano(comTermos(s))).toBe(s);
    // Pontuação colada ao termo não fica sozinha na linha seguinte.
    const n = comTermos("o plano referencial.");
    const grupo = (Array.isArray(n) ? n : [n]).find((x) => isValidElement(x) && x.type === "span");
    expect(grupo && (grupo as { props: { className: string } }).props.className).toBe("whitespace-nowrap");
  });
});

describe("SEO e publicação", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  const carregar = async (env: Record<string, string>) => {
    vi.resetModules();
    for (const k of ["SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_ENV", "OCULTAR_DE_BUSCADORES"]) vi.stubEnv(k, env[k]);
    return import("@/lib/seo");
  };

  test("[SE-001] endereço e indexação por ambiente", async () => {
    expect(await carregar({})).toMatchObject({ SITE: "http://127.0.0.1:4173", INDEXAR: false });
    expect(await carregar({ VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app", VERCEL_ENV: "production" })).toMatchObject({ SITE: "https://x.vercel.app", INDEXAR: true });
    expect(await carregar({ VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app", VERCEL_ENV: "preview" })).toMatchObject({ INDEXAR: false });
    expect(await carregar({ VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app", VERCEL_ENV: "production", OCULTAR_DE_BUSCADORES: "1" })).toMatchObject({ INDEXAR: false, OCULTO: true });
    expect(await carregar({ SITE_URL: "https://exemplo.com.br/" })).toMatchObject({ SITE: "https://exemplo.com.br", INDEXAR: true });
    for (const ruim of ["http://exemplo.com.br", "https://u:p@exemplo.com.br", "https://exemplo.com.br:8443", "lixo"]) await expect(carregar({ SITE_URL: ruim }), ruim).rejects.toThrow();
  });

  test("[SE-002] robots e sitemap por ambiente", async () => {
    await carregar({ SITE_URL: "https://exemplo.com.br" });
    const robots = (await import("@/app/robots")).default();
    expect(robots).toEqual({ rules: { userAgent: "*", allow: "/", disallow: "/dados/" }, sitemap: "https://exemplo.com.br/sitemap.xml" });
    const mapa = (await import("@/app/sitemap")).default();
    const urls = mapa.map((x) => x.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) expect(u).toMatch(/^https:\/\/exemplo\.com\.br\//);
    expect(urls).toEqual(expect.arrayContaining(["https://exemplo.com.br/", "https://exemplo.com.br/blocos/m/m300", "https://exemplo.com.br/ac/2024", "https://exemplo.com.br/glossario"]));
    // A novidade tem um endereço só.
    expect(urls.filter((u) => u.includes("/ac/") && u.includes("/novidades/"))).toEqual([]);
    for (const x of mapa) expect(String(x.lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await carregar({});
    expect((await import("@/app/robots")).default()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    // Oculto: sem mapa, mas legível, para o robô encontrar o noindex.
    await carregar({ SITE_URL: "https://exemplo.com.br", OCULTAR_DE_BUSCADORES: "1" });
    expect((await import("@/app/robots")).default()).toEqual({ rules: { userAgent: "*", allow: "/" } });
  });

  test("[SE-003] descrição cabe no resultado de busca e o ano entra no título", async () => {
    const { meta } = await carregar({});
    const m = meta({ titulo: "T", descricao: "palavra ".repeat(60), base: "/x", ano: 2024 });
    expect(String(m.description).length).toBeLessThanOrEqual(160);
    expect(m.title).toBe("T, ano-calendário 2024");
    expect(m.alternates?.canonical).toBe("/ac/2024/x");
    expect(meta({ titulo: "T", descricao: "d", base: "/x" }).alternates?.canonical).toBe("/x");
  });

  test("[SG-024] security.txt só com contato válido e validade menor que um ano", () => {
    const agora = new Date("2026-11-25T12:00:00Z");
    const t = securityTxt("https://exemplo.com.br/contato", "https://exemplo.com.br/", agora);
    expect(t).toContain("Contact: https://exemplo.com.br/contato");
    expect(t).toContain("Canonical: https://exemplo.com.br/.well-known/security.txt");
    const expira = new Date(/Expires: (.+)/.exec(t)![1]!);
    expect(expira.getTime() - agora.getTime()).toBeLessThan(366 * 864e5);
    expect(expira > agora).toBe(true);
    for (const ruim of ["", "fulano", "mailto:x", "javascript:alert(1)", "http://x.com", "https://x\nContact: y", "mailto:a@b.c <script>"]) expect(() => securityTxt(ruim, undefined, agora), ruim).toThrow();
  });

  test("[SG-025] cabeçalhos finais no vercel.json", () => {
    const { headers } = JSON.parse(readFileSync("vercel.json", "utf8"));
    const h = Object.fromEntries(headers.find((x: { source: string }) => x.source === "/(.*)").headers.map((x: { key: string; value: string }) => [x.key, x.value]));
    expect(h).toMatchObject({
      "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Resource-Policy": "same-origin", "Origin-Agent-Cluster": "?1",
      "X-Permitted-Cross-Domain-Policies": "none", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY",
    });
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d{8}/);
    expect(h["Content-Security-Policy"]).not.toMatch(/unsafe-eval|\*|http:/);
    // Nada inseguro no código da busca e das dicas.
    for (const f of ["src/components/busca/index.tsx", "src/components/ecf/termo.tsx", "src/components/ecf/com-termos.tsx", "src/components/ecf/filtro-glossario.tsx"]) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/dangerouslySetInnerHTML|innerHTML|\beval\(|new Function/);
    }
  });

  test.skipIf(!existsSync("out"))("[SE-004] toda página tem título, descrição, canônico e imagem próprios", () => {
    const paginas = readdirSync("out", { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".html") && !/(^|[\\/])(404|_not-found)\.html$/.test(f));
    const titulos = new Map<string, string>();
    for (const f of paginas) {
      const h = readFileSync(path.join("out", f), "utf8");
      const um = (re: RegExp) => [...h.matchAll(re)].map((m) => m[1]!);
      const titulo = um(/<title>([^<]+)<\/title>/g);
      expect(titulo.length, f).toBe(1);
      expect(um(/<meta name="description" content="([^"]+)"/g).length, f).toBe(1);
      const canonico = um(/<link rel="canonical" href="([^"]+)"/g);
      expect(canonico.length, f).toBe(1);
      expect(um(/<meta property="og:image" content="([^"]+)"/g)[0], f).toMatch(/\/og\.png$/);
      expect(h, f).toMatch(/<meta property="og:locale" content="pt_BR"/);
      // Título repetido só entre páginas de mesmo canônico.
      const antes = titulos.get(titulo[0]!);
      if (antes) expect(canonico[0], `${f} ${titulo[0]}`).toBe(antes);
      titulos.set(titulo[0]!, canonico[0]!);
    }
    expect(paginas.length).toBeGreaterThan(400);
    expect(existsSync("out/og.png")).toBe(true);
  });
});
