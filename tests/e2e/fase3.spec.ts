import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
async function responder(page: Page, ...opcoes: string[]) {
  for (const o of opcoes) {
    await page.getByRole("radio", { name: o, exact: true }).check();
    await page.getByRole("button", { name: "Continuar" }).click();
  }
}
const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map(
    (v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 160)}`,
  );

test("[CT-033] quiz: resultado explicado, voltar e refazer", async ({ page }) => {
  await abrir(page, "/quem-deve-entregar");
  await responder(page, "Empresa ou entidade com CNPJ", "Sim, durante o ano", "Saiu do Simples durante o ano", "Sim", "Lucro real");
  const r = page.getByTestId("quiz-resultado");
  await expect(r).toHaveAttribute("data-resultado", "obrigada-real");
  await expect(r.getByRole("heading", { level: 2 })).toHaveText("Sim, precisa entregar");
  await expect(r.locator("[data-complemento]")).toHaveCount(2);
  await r.getByText("Ver a base legal").first().click();
  await expect(r.getByText(/IN RFB nº\s2\.004\/2021, art\.\s1º, caput/).first()).toBeVisible();
  await r.getByRole("button", { name: "Voltar uma pergunta" }).click();
  await expect(page.getByText("Pergunta 5")).toBeVisible();
  await responder(page, "Imune");
  await expect(r).toHaveAttribute("data-resultado", "obrigada-imune");
  await r.getByRole("button", { name: "Refazer" }).click();
  await expect(page.getByText("Pergunta 1")).toBeVisible();
  await responder(page, "Órgão público, autarquia ou fundação pública");
  await expect(r).toHaveAttribute("data-resultado", "dispensada-publico");
  await expect(r.locator("[data-complemento]")).toHaveCount(0);
});

test("[CT-034] quiz: duplo clique e envio vazio", async ({ page }) => {
  await abrir(page, "/quem-deve-entregar");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Escolha uma opção" })).toBeVisible();
  await expect(page.getByText("Pergunta 1")).toBeVisible();
  await page.getByRole("radio", { name: "Empresa ou entidade com CNPJ" }).check();
  await page.getByRole("button", { name: "Continuar" }).dblclick();
  await expect(page.getByText("Pergunta 2")).toBeVisible();
  await expect(page.getByText("Escolha uma opção")).toHaveCount(0);
  await page.getByRole("radio", { name: "Sim, durante o ano" }).dblclick();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 3")).toBeVisible();
});

test("[CT-035] linha do tempo", async ({ page }) => {
  await abrir(page, "/o-que-e");
  const painel = page.getByTestId("tempo-painel");
  const anterior = page.getByRole("button", { name: "Anterior" });
  const proximo = page.getByRole("button", { name: "Próximo" });
  await expect(painel).toContainText("22/01/2007");
  await expect(anterior).toBeDisabled();
  await proximo.dblclick();
  await expect(painel).toContainText("AC 2014");
  await page.getByRole("list", { name: "Linha do tempo" }).getByRole("button").last().click();
  await expect(painel).toContainText("29/01/2026");
  await expect(proximo).toBeDisabled();
  await anterior.click();
  await expect(painel).toContainText("Leiaute 11");
});

test("[AC-007] quiz só por teclado", async ({ page }) => {
  await abrir(page, "/quem-deve-entregar");
  await page.getByRole("button", { name: "Continuar" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("radiogroup").getByRole("radio").first().focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /Órgão público/ })).toBeChecked();
  await page.keyboard.press("Enter");
  const titulo = page.getByTestId("quiz-resultado").getByRole("heading", { level: 2 });
  await expect(titulo).toBeFocused();
  await expect(page.locator("h1")).toHaveText("Quem deve entregar");
});

for (const tema of ["light", "dark"] as const) {
  for (const largura of [375, 1440]) {
    test(`[AC-008] axe nos estados do quiz, ${tema} ${largura}`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.addInitScript(
        (t) => localStorage.setItem("ecf:preferencias:v1", JSON.stringify({ nivel: "iniciante", tema: t, ano: null, estudadas: [] })),
        tema,
      );
      await abrir(page, "/quem-deve-entregar");
      await page.getByRole("button", { name: "Continuar" }).click();
      expect(await axe(page)).toEqual([]);
      await responder(page, "Empresa ou entidade com CNPJ", "Só em parte do ano", "Não", "Sim", "Lucro presumido");
      for (const s of await page.getByText("Ver a base legal").all()) await s.click();
      expect(await axe(page)).toEqual([]);
      const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(d[0]).toBeLessThanOrEqual(d[1]!);
      await abrir(page, "/importancia");
      for (const s of await page.getByText("Ver a base legal").all()) await s.click();
      expect(await axe(page)).toEqual([]);
    });
  }
}
