import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mudarNivel } from "./apoio";

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const BLOCOS = ["0", "c", "e", "j", "k", "l", "m", "n", "p", "q", "t", "u", "v", "w", "x", "y", "9"];

test("[CT-110] mapa de fluxo (em /blocos) diz o regime e quantos blocos mostra", async ({ page }) => {
  await abrir(page, "/blocos");
  const contagem = page.getByTestId("mapa-contagem");
  await expect(contagem).toHaveText(/Regime escolhido: Lucro real\. Mostrando 13 de 17 blocos/);
  await expect(page.locator("[data-no]").filter({ hasText: /^Bloco/ })).toHaveCount(13);
  await page.getByRole("button", { name: "Lucro presumido", exact: true }).click();
  const n = await page.locator("button[data-no]").evaluateAll((b) => b.filter((x) => /Bloco/.test(x.textContent ?? "")).length);
  await expect(contagem).toHaveText(new RegExp(`Regime escolhido: Lucro presumido\\. Mostrando ${n} de 17 blocos`));
  // A conquista que fala dos 17 blocos foi para “Meu progresso” (CT-119).
});

test("[CN-072] página de bloco: nome oficial uma vez, ECD sinalizada e mapa com nome curto", async ({ page }) => {
  test.setTimeout(120_000);
  for (const b of BLOCOS) {
    await abrir(page, `/blocos/${b}`);
    const h1 = await page.locator("h1").innerText();
    const nome = h1.replace(/^Bloco \w: /, "");
    const main = await page.locator("main").innerText();
    // “Bloco X: nome oficial” só no título; nomes longos não se repetem nem sozinhos.
    expect(main.split(h1).length - 1, `bloco ${b}`).toBe(1);
    if (nome.length > 40) expect(main.split(nome).length - 1, `bloco ${b}`).toBe(1);
    await expect(page.getByTestId("aviso-ecd"), `bloco ${b}`).toHaveCount(["c", "e", "j", "k"].includes(b) ? 1 : 0);
  }
  await abrir(page, "/blocos/e");
  await expect(page.getByTestId("mapa-painel").locator("h3")).toHaveText("Bloco E: Dados recuperados");
});

test("[CN-072] registro: texto do Manual em “Para que serve” e o do bloco separado", async ({ page }) => {
  await abrir(page, "/blocos/0/0035");
  await expect(page.getByText("Este registro faz parte do bloco")).toHaveCount(0);
  await expect(page.getByTestId("sobre-o-bloco")).toContainText("Sobre o bloco 0:");
  await mudarNivel(page, "Já conheço");
  await expect(page.getByTestId("sobre-o-bloco")).toBeHidden();
});

test("[AC-020] logo, selo da ECD, legendas e abreviações com texto", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/");
  await expect(page.getByRole("link", { name: /descomplicada\s*, página inicial$/ }).first()).toBeVisible();
  await expect(page.getByTestId("ecd-em-breve")).toHaveText("ECD em breve");
  await expect(page).toHaveTitle(/ECD em breve/);
  await abrir(page, "/blocos");
  await expect(page.getByTestId("legenda-situacao")).toHaveCount(0);
  await page.getByLabel("Regime da empresa").selectOption({ label: "Lucro real" });
  const legenda = page.getByTestId("legenda-situacao");
  for (const t of ["Previsto para o seu regime", "Depende de uma condição", "Não se aplica ao seu regime"]) await expect(legenda.getByText(t, { exact: true })).toBeVisible();
  await expect(legenda).toContainText("só existe se uma condição do Manual for atendida");
  await expect(page.locator("[data-bloco=M]")).toContainText("Apuração");
  await expect(page.locator("[data-bloco=C]")).toContainText("dados da ECD");
  for (const tema of ["light", "dark"]) {
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`), tema).toEqual([]);
  }
  // O mapa simples, com a legenda das abreviações, ficou nas páginas de bloco.
  await abrir(page, "/blocos/k");
  await expect(page.getByTestId("legenda-mapa").locator("abbr[title='ECF anterior']")).toHaveText("ECF ant.");
  await expect(page.getByTestId("legenda-mapa")).toContainText("(ECF anterior)");
  await expect(page.getByTestId("legenda-situacao")).toBeVisible();
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`)).toEqual([]);
});
