import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { request as httpRequest } from "node:http";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { abrirPerfil, mudarAno, mudarNivel } from "./apoio";

const SECOES = ["o-que-e", "importancia", "quem-deve-entregar", "blocos", "exemplos", "simulador", "novidades", "glossario"];
const AMOSTRA = ["/", "/blocos", "/blocos/m", "/fontes", "/simulador", "/o-que-e", "/importancia", "/quem-deve-entregar", "/ac/2024", "/ac/2024/importancia"];
const TODAS = ["", "/ac/2024"].flatMap((p) => [
  p || "/",
  ...SECOES.map((s) => `${p}/${s}`),
  `${p}/fontes`,
  `${p}/preencher`,
  ...["lucro-real", "lucro-presumido", "isenta"].map((s) => `${p}/exemplos/${s}`),
  ..."0cejklmnpqtuvwxy9".split("").map((l) => `${p}/blocos/${l}`),
]);
const CHAVE = "ecf:preferencias:v1";

async function pronta(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

/** Pedido cru, sem a normalização de caminho que o navegador faz. */
function cru(metodo: string, caminho: string): Promise<{ status: number; allow?: string }> {
  return new Promise((ok, erro) => {
    const r = httpRequest({ host: "127.0.0.1", port: 4173, method: metodo, path: caminho }, (res) => {
      res.resume();
      ok({ status: res.statusCode!, allow: res.headers.allow });
    });
    r.on("error", erro);
    r.end();
  });
}

test("[SM-001][SM-002][SM-003] todas as páginas carregam limpas, com selo e aviso", async ({ page }) => {
  test.setTimeout(240_000);
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(`${page.url()} ${e.message}`));
  page.on("console", (m) => m.type() === "error" && erros.push(`${page.url()} ${m.text()}`));
  for (const url of TODAS) {
    const r = await page.goto(url);
    expect(r?.status(), url).toBe(200);
    await expect(page.locator("h1"), url).toBeVisible();
    const leiaute = url.startsWith("/ac/2024") ? 11 : 12;
    await expect(page.getByTestId("selo"), url).toContainText(
      new RegExp(`Atualizado conforme leiaute ${leiaute}, verificado em \\d{2}/\\d{2}/\\d{4}`),
    );
    await expect(page.locator("footer"), url).toContainText("não substitui orientação de profissional contábil");
  }
  expect(erros).toEqual([]);
});

test("[CT-001][CT-002] menu, item ativo, breadcrumb, topo e foco", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await pronta(page, "/");
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const menu = page.locator("[data-lateral]").getByRole("navigation", { name: "Menu principal" });
  for (const [nome, slug, trilha] of [["Blocos e registros", "blocos", "Blocos"], ["Simulador", "simulador", "Simulador"], ["Glossário", "glossario", "Glossário"]] as const) {
    await menu.getByRole("link", { name: nome, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${slug}$`));
    await expect(menu.locator("[data-item-menu][aria-current=page]")).toHaveText(nome);
    await expect(page.getByRole("navigation", { name: "Você está em" }).locator("[aria-current=page]")).toHaveText(trilha);
    await expect(page.locator("h1")).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBe(0);
  }
});

test("[CT-003] F5 mantém a seção e Voltar retorna", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await pronta(page, "/blocos");
  await page.locator("[data-bloco=M] a").click();
  await expect(page).toHaveURL(/\/blocos\/m$/);
  await page.reload();
  await expect(page.locator("h1")).toContainText("Bloco M");
  await page.goBack();
  await expect(page).toHaveURL(/\/blocos$/);
  await expect(page.locator("h1")).toHaveText("Blocos e preenchimento");
});

test("[CT-004] nível muda o conteúdo e persiste", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await pronta(page, "/blocos");
  await expect(page.getByText("Pense na ECF como um dossiê")).toBeVisible();
  await mudarNivel(page, "Já conheço");
  await expect(page.getByText("Pense na ECF como um dossiê")).toBeHidden();
  await expect(page.getByText(/em consulta rápida/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/em consulta rápida/)).toBeVisible();
  await expect((await abrirPerfil(page)).getByRole("radio", { name: "Já conheço" })).toBeChecked();
  await page.keyboard.press("Escape");
  await pronta(page, "/simulador");
  await expect(page.getByText("memória de cálculo")).toBeVisible();
});

test("[CT-005] ano muda o conteúdo, vive na URL e persiste", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await pronta(page, "/blocos/m");
  await mudarAno(page, "2024");
  await expect(page).toHaveURL(/\/ac\/2024\/blocos\/m$/);
  await expect(page.getByTestId("selo")).toContainText("leiaute 11");
  await page.reload();
  const painel = await abrirPerfil(page);
  await expect(painel.getByRole("group", { name: "Ano da ECF no perfil" }).getByRole("link", { name: "2024" })).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("Escape");
  await pronta(page, "/");
  await expect(page).toHaveURL(/\/ac\/2024$/);
  await mudarAno(page, "2025");
  await expect(page).toHaveURL(/4173\/$/);
  await expect(page.getByTestId("selo")).toContainText("leiaute 12");
});

test("[CT-006][CT-007] progresso, tema e cliques repetidos", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await pronta(page, "/simulador");
  const botao = page.getByRole("button", { name: "Marcar como estudada" });
  await botao.dblclick();
  await expect(botao).toHaveAttribute("aria-pressed", "false");
  await botao.click();
  const tema = page.getByRole("button", { name: /Alternar entre tema/ }).first();
  const antes = await page.locator("html").getAttribute("data-theme");
  await tema.click();
  const depois = await page.locator("html").getAttribute("data-theme");
  expect(depois).not.toBe(antes);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", depois!);
  await expect(page.getByRole("button", { name: "Seção estudada" })).toHaveAttribute("aria-pressed", "true");
  await pronta(page, "/meu-progresso");
  await expect(page.getByRole("progressbar", { name: /seções estudadas/ })).toHaveAttribute("aria-valuenow", "1");
  const painel = await abrirPerfil(page);
  for (let i = 0; i < 6; i++) await painel.getByText(i % 2 ? "Estou começando" : "Já conheço", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-nivel", "iniciante");
});

test("[CT-008] Voltar para a home não prende", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await pronta(page, "/");
  await mudarAno(page, "2024");
  await expect(page).toHaveURL(/\/ac\/2024$/);
  await page.goBack();
  await expect(page).toHaveURL(/4173\/$/);
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/4173\/$/);
});

test("[CT-009] 404 própria", async ({ page }) => {
  for (const u of ["/nao-existe", "/blocos/s", "/ac/2019", "/ac/2024/blocos/s"]) {
    const r = await page.goto(u);
    expect(r?.status(), u).toBe(404);
    await expect(page.locator("h1")).toHaveText("Página não encontrada");
  }
});

for (const largura of [375, 768, 1050, 1440]) {
  test(`[RS-001] sem rolagem horizontal em ${largura}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: largura, height: 800 });
    for (const url of TODAS) {
      await page.goto(url);
      const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(d[0], `${url} ${d}`).toBeLessThanOrEqual(d[1]!);
    }
  });
}

test("[RS-002] alvos de toque de 24 px em 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const url of AMOSTRA) {
    await pronta(page, url);
    if (url === "/") await page.getByRole("button", { name: "Abrir menu" }).click();
    const pequenos = await page.evaluate(() =>
      [...document.querySelectorAll("a[href],button,select,label:has(input)")]
        .map((e) => ({ t: e.textContent?.trim().slice(0, 40), r: e.getBoundingClientRect(), s: e.className }))
        .filter((x) => x.r.width > 2 && x.r.height > 2 && (x.r.width < 24 || x.r.height < 24))
        .map((x) => `${x.t} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`),
    );
    expect(pequenos, url).toEqual([]);
  }
});

test("[RS-003] tabela larga rola na própria caixa", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await pronta(page, "/fontes");
  await expect(page.getByText("Arraste a tabela para o lado")).toBeVisible();
  const caixa = page.getByRole("region", { name: "Tabela de fontes oficiais" });
  await caixa.focus();
  await expect(caixa).toBeFocused();
  expect(await caixa.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
});

test("[RS-004] breadcrumb e selo alinhados", async ({ page }) => {
  for (const largura of [375, 768, 1050, 1440]) {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto("/blocos");
    const x = async (s: string) => (await page.locator(s).first().boundingBox())!;
    const trilha = await x("nav[aria-label='Você está em'] ol");
    const titulo = await x("h1");
    expect(Math.abs(trilha.x - titulo.x), String(largura)).toBeLessThanOrEqual(1);
    const icone = await x("[data-testid=selo] svg");
    const texto = await x("[data-testid=selo] span");
    expect(texto.x, String(largura)).toBeGreaterThan(icone.x + icone.width);
  }
});

for (const tema of ["light", "dark"] as const) {
  for (const nivel of ["iniciante", "profissional"] as const) {
    test(`[AC-001] axe ${tema}/${nivel}`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.addInitScript(
        ([c, v]) => localStorage.setItem(c!, v!),
        [CHAVE, JSON.stringify({ nivel, tema, ano: null, estudadas: [] })],
      );
      for (const largura of [375, 1440]) {
        await page.setViewportSize({ width: largura, height: 900 });
        for (const url of [...AMOSTRA, "/nao-existe"]) {
          await pronta(page, url);
          const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
          expect(
            r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 160)}`),
            `${url} ${largura}`,
          ).toEqual([]);
        }
      }
    });
  }
}

test("[AC-002] pular para o conteúdo", async ({ page }) => {
  await pronta(page, "/");
  await page.keyboard.press("Tab");
  const link = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(link).toBeFocused();
  await expect(link).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("[AC-003] idioma, landmarks e títulos", async ({ page }) => {
  for (const url of AMOSTRA) {
    await pronta(page, url);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    for (const m of ["header", "main", "footer"]) await expect(page.locator(m), url).toHaveCount(1);
    const niveis = await page.evaluate(() =>
      [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1])),
    );
    expect(niveis.filter((n) => n === 1), url).toHaveLength(1);
    niveis.forEach((n, i) => i > 0 && expect(n - niveis[i - 1]!, `${url} ${niveis}`).toBeLessThanOrEqual(1));
  }
});

test("[AC-004] menu móvel por teclado", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await pronta(page, "/");
  const abrir = page.getByRole("button", { name: "Abrir menu" });
  await abrir.focus();
  await page.keyboard.press("Enter");
  const dialogo = page.getByRole("dialog", { name: "Menu" });
  await expect(dialogo).toBeVisible();
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const fora = await page.evaluate(() => {
      const a = document.activeElement;
      return a !== document.body && !a?.closest("dialog");
    });
    expect(fora).toBe(false);
  }
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(abrir).toBeFocused();
  await abrir.click();
  await dialogo.getByRole("link", { name: "Blocos e registros", exact: true }).click();
  await expect(page).toHaveURL(/\/blocos$/);
  await expect(dialogo).toBeHidden();
  await expect(page.locator("h1")).toBeFocused();
});

test("[AC-006] movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await pronta(page, "/blocos");
  const d = await page.locator(".bloco").first().evaluate((e) => getComputedStyle(e).transitionDuration);
  expect(parseFloat(d)).toBeLessThan(0.001);
});

test("[RD-001][RD-002] primeira carga", async ({ page }, info) => {
  const vistos: string[] = [];
  const tamanhos: Promise<number>[] = [];
  page.on("response", (r) => {
    vistos.push(r.url());
    // HEAD não tem corpo. Falha de leitura precisa derrubar o teste, não virar zero.
    if (r.request().method() !== "HEAD") tamanhos.push(r.body().then((b) => b.length));
  });
  await pronta(page, "/");
  const bytes = (await Promise.all(tamanhos)).reduce((a, b) => a + b, 0);
  expect(bytes).toBeGreaterThan(200_000); // sanidade: React sozinho passa disso
  expect(new Set(vistos).size, "duplicadas").toBe(vistos.length);
  expect(vistos.filter((u) => new URL(u).hostname !== "127.0.0.1")).toEqual([]);
  info.annotations.push({
    type: "medida",
    description: `${vistos.length} requisições; ${(bytes / 1e6).toFixed(2).replace(".", ",")} MB sem compressão`,
  });
  expect(bytes).toBeLessThan(2e6);
});

test("[SG-001] CSP em Report-Only sem violação", async ({ page }) => {
  test.setTimeout(120_000);
  const violacoes: string[] = [];
  page.on("console", (m) => /Content.Security.Policy/i.test(m.text()) && violacoes.push(m.text()));
  for (const u of AMOSTRA) {
    const r = await page.goto(`http://127.0.0.1:4174${u}`);
    expect(r?.headers()["content-security-policy-report-only"]).toContain("sha256-");
    await page.waitForLoadState("networkidle");
  }
  expect(violacoes).toEqual([]);
  // Controle negativo: o detector precisa enxergar uma violação de verdade.
  await page.evaluate(() => {
    const s = document.createElement("script");
    s.textContent = "1";
    document.body.append(s);
  });
  await expect.poll(() => violacoes.length).toBeGreaterThan(0);
});

test("[SG-002] CSP aplicada bloqueia script injetado", async ({ page }) => {
  await pronta(page, "/");
  await page.evaluate(() => {
    const s = document.createElement("script");
    s.textContent = "window.__invadiu = 1";
    document.body.append(s);
    const i = document.createElement("img");
    i.setAttribute("onerror", "window.__invadiu = 2");
    i.src = "/inexistente.png";
    document.body.append(i);
  });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { __invadiu?: number }).__invadiu)).toBeUndefined();
});

test("[SG-003] cabeçalhos", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["cross-origin-opener-policy"]).toBe("same-origin");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["permissions-policy"]).toBeTruthy();
  expect(h["x-powered-by"]).toBeUndefined();
});

test("[SG-004] arquivos sensíveis respondem 404", async ({ request }) => {
  for (const u of ["/.env", "/.git/config", "/package.json", "/next.config.ts", "/vercel.json", "/content/fontes.json", "/src/app/layout.tsx"]) {
    expect((await request.get(u)).status(), u).toBe(404);
  }
  const mapas = readdirSync("out", { recursive: true, encoding: "utf8" }).filter(
    (f) => f.endsWith(".map") && statSync(path.join("out", f)).isFile(),
  );
  expect(mapas).toEqual([]);
});

test("[SG-005] métodos e caminhos inválidos", async () => {
  for (const m of ["POST", "PUT", "DELETE"]) {
    expect(await cru(m, "/")).toEqual({ status: 405, allow: "GET, HEAD" });
  }
  for (const c of ["/../package.json", "/%2e%2e/package.json", "/..%5cpackage.json", "/%0d%0aX:1", "/%zz"]) {
    expect((await cru("GET", c)).status, c).toBe(400);
  }
});

test("[SG-007] payloads inofensivos não executam", async ({ page }) => {
  const dialogos: string[] = [];
  page.on("dialog", (d) => {
    dialogos.push(d.message());
    void d.dismiss();
  });
  const p = `"><img src=x onerror=alert(1)><svg onload=alert(2)>{{7*7}}\${7*7}javascript:alert(3)`;
  await page.addInitScript(
    ([c, v]) => localStorage.setItem(c!, JSON.stringify({ nivel: v, tema: v, ano: v, estudadas: [v] })),
    [CHAVE, p],
  );
  for (const u of ["/", `/?q=${encodeURIComponent(p)}`, `/simulador#${encodeURIComponent(p)}`]) {
    await pronta(page, u);
    await expect(page.locator("html")).toHaveAttribute("data-nivel", "iniciante");
    await expect(page.locator("body")).not.toContainText("{{7*7}}");
  }
  expect(dialogos).toEqual([]);
});
