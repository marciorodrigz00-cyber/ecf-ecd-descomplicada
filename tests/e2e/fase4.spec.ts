import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { request as httpRequest } from "node:http";
import { readdirSync } from "node:fs";

const CHAVE = "ecf:preferencias:v1";
async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
async function nivel(page: Page, n: "iniciante" | "profissional", tema = "light") {
  await page.addInitScript(
    ([c, v]) => localStorage.getItem(c!) ?? localStorage.setItem(c!, v!),
    [CHAVE, JSON.stringify({ nivel: n, tema, ano: null, estudadas: [], roteiro: null })],
  );
}
const REGISTROS = readdirSync("out", { recursive: true, encoding: "utf8" })
  .map((f) => f.replace(/\\/g, "/"))
  .filter((f) => /blocos\/\w\/\w{4}\.html$/.test(f))
  .map((f) => `/${f.replace(".html", "")}`);
const DIFICEIS = ["/blocos/0/0000", "/blocos/0/0020", "/blocos/x/x280", "/blocos/m/m300", "/blocos/w/w100", "/blocos/y/y570", "/blocos/9/9999"];

test("[SM-004] todas as páginas de registro carregam limpas", async ({ page }) => {
  test.setTimeout(600_000);
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(`${page.url()} ${e.message}`));
  page.on("console", (m) => m.type() === "error" && erros.push(`${page.url()} ${m.text()}`));
  expect(REGISTROS.length).toBe(359);
  await page.setViewportSize({ width: 375, height: 800 });
  for (const url of REGISTROS) {
    const r = await page.goto(url);
    expect(r?.status(), url).toBe(200);
    await expect(page.locator("h1"), url).toContainText(url.slice(-4).toUpperCase());
    const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(d[0], `${url} ${d}`).toBeLessThanOrEqual(d[1]!);
  }
  expect(erros).toEqual([]);
});

test("[CT-041] filtro por regime mantém a posição original", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos");
  const itens = page.locator("[data-bloco]");
  await expect(itens).toHaveCount(17);
  const posU = page.locator("[data-bloco=U]").getByText("12º do arquivo");
  await expect(posU).toBeVisible();
  await page.getByLabel("Regime da empresa").selectOption("imune");
  await page.getByLabel("Esconder os não previstos").check();
  await expect(page.getByRole("status").filter({ hasText: "Mostrando" })).toHaveText("Mostrando 12 de 17 blocos");
  await expect(page.locator("[data-bloco=M]")).toHaveCount(0);
  await expect(posU).toBeVisible();
  await page.getByLabel("Regime da empresa").selectOption("real");
  await expect(page.locator("[data-bloco=M]").getByText("Previsto")).toBeVisible();
  await expect(page.locator("[data-bloco=U]")).toHaveCount(0);
  await page.getByLabel("Regime da empresa").selectOption("");
  await expect(itens).toHaveCount(17);
});

test("[CT-042] mapa de dados mostra entradas e saídas", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos");
  const painel = page.getByTestId("mapa-painel");
  await expect(painel).toContainText("Bloco M");
  await expect(painel).toContainText("Lucro líquido antes do IRPJ");
  const grupo = page.getByRole("group", { name: /Escolha um bloco/ });
  await grupo.getByRole("button", { name: "ECD do período" }).click();
  await expect(painel).toContainText("Não recebe dados de outro bloco.");
  await expect(painel).toContainText("Contas e saldos recuperados");
  const n = grupo.getByRole("button", { name: /^Bloco N/ });
  await n.dblclick();
  await expect(n).toHaveAttribute("aria-pressed", "true");
  await expect(painel).toContainText("Não envia dados para outro bloco.");
  await painel.getByRole("link", { name: /Y570/ }).click();
  await expect(page).toHaveURL(/\/blocos\/y\/y570$/);
});

test("[CT-043] bloco e registro: URL, breadcrumb, F5 e vizinhos", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos/m");
  await page.getByRole("link", { name: /^M300/ }).first().click();
  await expect(page).toHaveURL(/\/blocos\/m\/m300$/);
  await page.reload();
  await expect(page.locator("h1")).toContainText("M300: Demonstração do Lucro Real");
  const trilha = page.getByRole("navigation", { name: "Você está em" });
  await expect(trilha.locator("[aria-current=page]")).toHaveText("M300");
  await page.getByRole("navigation", { name: "Outros registros do bloco" }).getByRole("link", { name: "M305" }).click();
  await expect(page).toHaveURL(/m305$/);
  await page.goBack();
  await expect(page).toHaveURL(/m300$/);
  await trilha.getByRole("link", { name: "Bloco M" }).click();
  await expect(page).toHaveURL(/\/blocos\/m$/);
});

test("[CT-044] nível muda a profundidade do registro", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos/m/m300");
  await expect(page.getByRole("heading", { name: "Regras de validação" })).toBeHidden();
  await page.getByText("Já conheço", { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Regras de validação" })).toBeVisible();
  await expect(page.getByText("REGRA_VALOR_DETALHADO").first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Regras de validação" })).toBeVisible();
});

test("[CT-045] ano muda o registro e o que mudou aparece", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos/0/0000");
  await expect(page.getByText("Campo novo: EVENTO_SCP")).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "EVENTO_SCP" })).toBeVisible();
  await page.getByRole("group", { name: "Ano-calendário" }).getByRole("link", { name: "2024" }).click();
  await expect(page).toHaveURL(/\/ac\/2024\/blocos\/0\/0000$/);
  await expect(page.getByRole("rowheader", { name: "EVENTO_SCP" })).toHaveCount(0);
  await abrir(page, "/blocos/y/y730");
  await expect(page.getByText("Não existe no leiaute 11")).toBeVisible();
  expect((await page.goto("/ac/2024/blocos/y/y730"))?.status()).toBe(404);
});

test("[CT-046] roteiro: regime, etapas, limites e persistência", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/preencher");
  await expect(page.getByText("Escolha o regime para montar")).toBeVisible();
  const sel = page.getByLabel("Qual é o regime da empresa?");
  await sel.selectOption("presumido");
  const cartao = page.getByTestId("roteiro");
  await expect(cartao).toContainText("Etapa 1 de 12");
  await expect(cartao.getByRole("button", { name: "Anterior" })).toBeDisabled();
  await cartao.getByRole("button", { name: "Próximo" }).dblclick();
  await expect(cartao).toContainText("Etapa 3 de 12");
  await expect(cartao.getByRole("heading", { level: 2 })).toBeFocused();
  await page.reload();
  await expect(cartao).toContainText("Etapa 3 de 12");
  await expect(sel).toHaveValue("presumido");
  await page.getByRole("navigation", { name: "Etapas do preenchimento" }).getByRole("button").last().click();
  await expect(cartao.getByRole("button", { name: "Próximo" })).toBeDisabled();
  await expect(cartao).toContainText("Bloco 9");
  await sel.selectOption("real");
  await expect(cartao).toContainText("Etapa 1 de 13");
});

test("[SG-009] /ac/2025 redireciona só para dentro do site", async ({ page }) => {
  await page.goto("/ac/2025/blocos/m");
  await expect(page).toHaveURL(/4173\/blocos\/m$/);
  await page.goto("/ac/2025");
  await expect(page).toHaveURL(/4173\/$/);
  for (const c of ["/ac/2025//exemplo.com", "/ac/2025/%2fexemplo.com", "/ac/2025/.exemplo.com", "/ac/2025/https:%2f%2fexemplo.com"]) {
    const loc = await new Promise<string | undefined>((ok, erro) => {
      const r = httpRequest({ host: "127.0.0.1", port: 4173, path: c }, (res) => {
        res.resume();
        ok(res.headers.location);
      });
      r.on("error", erro);
      r.end();
    });
    expect(loc, c).toBeUndefined();
  }
});

for (const tema of ["light", "dark"] as const) {
  test(`[AC-009] axe em blocos, registros e roteiro, ${tema}`, async ({ page }) => {
    test.setTimeout(400_000);
    await nivel(page, "profissional", tema);
    for (const largura of [375, 1440]) {
      await page.setViewportSize({ width: largura, height: 900 });
      for (const url of ["/blocos", "/blocos/m", "/blocos/w", "/preencher", ...DIFICEIS]) {
        await abrir(page, url);
        if (url === "/preencher") await page.getByLabel("Qual é o regime da empresa?").selectOption("imune");
        if (url === "/blocos") await page.getByLabel("Regime da empresa").selectOption("presumido");
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 160)}`), `${url} ${largura}`).toEqual([]);
      }
    }
  });
}

for (const largura of [375, 768, 1050, 1440]) {
  test(`[RS-005] telas da fase 4 sem rolagem horizontal e com alvos de 24 px, ${largura}`, async ({ page }) => {
    test.setTimeout(180_000);
    await nivel(page, "profissional");
    await page.setViewportSize({ width: largura, height: 800 });
    for (const url of ["/blocos", "/blocos/m", "/blocos/w", "/preencher", ...DIFICEIS]) {
      await abrir(page, url);
      if (url === "/preencher") await page.getByLabel("Qual é o regime da empresa?").selectOption("real");
      const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(d[0], `${url} ${d}`).toBeLessThanOrEqual(d[1]!);
      const pequenos = await page.evaluate(() =>
        [...document.querySelectorAll("main a[href],main button,main select,main summary,main label:has(input)")]
          .map((e) => ({ t: e.textContent?.trim().slice(0, 40), r: e.getBoundingClientRect() }))
          .filter((x) => x.r.width > 2 && x.r.height > 2 && (x.r.width < 24 || x.r.height < 24))
          .map((x) => `${x.t} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`),
      );
      expect(pequenos, url).toEqual([]);
    }
  });
}
