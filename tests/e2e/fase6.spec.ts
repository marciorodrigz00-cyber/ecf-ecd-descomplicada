import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const itens = (page: Page) => page.locator("main ol > li h2");

test("[CT-067] feed: filtros, detalhe, F5 e Voltar", async ({ page }) => {
  await abrir(page, "/novidades");
  await expect(itens(page)).toHaveCount(15);
  await expect(itens(page).first()).toHaveText("Programa da ECF: versão 12.2.8");
  const norma = page.getByRole("button", { name: "Norma", exact: true });
  await norma.dblclick();
  await expect(norma).toHaveAttribute("aria-pressed", "true");
  await expect(itens(page)).toHaveCount(3);
  await expect(page.locator("main [role=status]")).toHaveText("Mostrando 3 de 15.");
  await page.getByLabel("Só as que valem para o leiaute 12").check();
  await expect(itens(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Tudo" }).click();
  await expect(itens(page)).toHaveCount(14);
  await page.getByRole("link", { name: "Programa da ECF: versão 12.2.2" }).click();
  await expect(page).toHaveURL(/\/novidades\/programa-12-2-2$/);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Programa da ECF: versão 12.2.2");
  await expect(page.locator("time")).toHaveText("28/07/2026");
  await expect(page.getByRole("link", { name: /Comunicados da ECF no portal do Sped/ })).toHaveAttribute("href", /^https:\/\/www\.gov\.br\/sped\//);
  await page.locator("main").getByRole("link", { name: "W100", exact: true }).click();
  await expect(page).toHaveURL(/\/blocos\/w\/w100$/);
  await page.goBack();
  await expect(page).toHaveURL(/programa-12-2-2$/);
  await page.goBack();
  // O filtro de leiaute continua no endereço.
  await expect(itens(page)).toHaveCount(14);
});

test("[CT-068] novidades nos dois anos, com endereço canônico único", async ({ page }) => {
  await abrir(page, "/ac/2024/novidades");
  await page.getByLabel("Só as que valem para o leiaute 11").check();
  // Oito versões do programa que citam os leiautes anteriores e o ato do Manual 11.
  await expect(itens(page)).toHaveCount(9);
  await page.getByRole("link", { name: "Aprovado o Manual do leiaute 11" }).click();
  await expect(page).toHaveURL(/\/ac\/2024\/novidades\/ade-cofis-38-2024$/);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", /\/novidades\/ade-cofis-38-2024$/);
  expect((await page.locator("link[rel=canonical]").getAttribute("href"))!).not.toContain("/ac/");
  expect((await page.request.get("/novidades/inexistente")).status()).toBe(404);
  expect((await page.request.get("/monitor/estado.json")).status()).toBe(404);
});

test("[AC-012] filtros só por teclado", async ({ page }) => {
  await abrir(page, "/novidades");
  await page.getByRole("button", { name: "Tudo" }).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Programa", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(itens(page)).toHaveCount(9);
});

for (const tema of ["light", "dark"] as const) {
  for (const largura of [375, 768, 1050, 1440]) {
    test(`[AC-012][RS-007] novidades: axe, rolagem e alvos, ${tema} ${largura}`, async ({ page }) => {
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(e.message));
      page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
      await page.addInitScript(
        (v) => localStorage.setItem("ecf:preferencias:v1", v),
        JSON.stringify({ nivel: largura < 1000 ? "iniciante" : "profissional", tema, ano: null, estudadas: [], roteiro: null }),
      );
      await page.setViewportSize({ width: largura, height: 900 });
      for (const url of ["/novidades", "/novidades/outras-exclusoes", "/ac/2024/novidades/in-2305-lucro-presumido"]) {
        await abrir(page, url);
        const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(d[0], url).toBeLessThanOrEqual(d[1]!);
        const pequenos = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("main a, main button, main input")]
            .filter((e) => e.offsetParent !== null)
            .map((e) => ({ t: e.textContent, r: e.getBoundingClientRect() }))
            .filter((x) => x.r.height > 0 && x.r.height < 20)
            .map((x) => x.t),
        );
        expect(pequenos, url).toEqual([]);
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        expect(r.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]), url).toEqual([]);
      }
      expect(erros).toEqual([]);
    });
  }
}
