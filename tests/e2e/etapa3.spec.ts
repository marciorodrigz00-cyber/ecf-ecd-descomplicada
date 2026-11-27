import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const AXE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const sobraLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("[CT-122] anterior e próximo na ordem do arquivo, atravessando blocos", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos/0/0000");
  await expect(page.getByText("Primeiro registro do arquivo").first()).toBeVisible();
  await expect(page.getByTestId("registro-proximo").first()).toContainText("0001");
  await expect(page.getByTestId("posicao-no-arquivo")).toHaveText(/Bloco 0, 1º de \d+ registros · bloco 1º de 17 no arquivo/);
  // Último registro do bloco 0: o próximo é o primeiro do bloco seguinte.
  await page.getByTestId("mapa-do-bloco").getByRole("link").filter({ hasText: /^0\d{3}/ }).last().click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("registro-proximo").first()).toContainText("bloco C");
  await page.getByTestId("registro-proximo").first().click();
  await expect(page).toHaveURL(/\/blocos\/c\/c\d{3}$/);
  await expect(page.getByTestId("registro-anterior").first()).toContainText("bloco 0");
  // No AC 2024, a ordem é a do leiaute 11.
  await abrir(page, "/ac/2024/blocos/0/0000");
  await expect(page.getByTestId("registro-proximo").first()).toHaveAttribute("href", /^\/ac\/2024\/blocos\/0\//);
});

test("[CT-123] mapa do bloco na tela larga; seletor nas menores", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos/0/0035");
  const mapa = page.getByTestId("mapa-do-bloco");
  await expect(mapa).toBeVisible();
  await expect(mapa.getByRole("link", { name: /^0035/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("Ir para o registro")).toBeHidden();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(mapa).toBeHidden();
  const seletor = page.getByLabel("Ir para o registro");
  await expect(seletor).toHaveValue("0035");
  await seletor.selectOption("0020");
  await expect(page).toHaveURL(/\/blocos\/0\/0020$/);
});

test("[CT-124] âncora pelo nome do campo, link antigo redirecionado e botões de copiar", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos/0/0035#cod-scp");
  await expect(page.locator("#cod-scp")).toHaveAttribute("data-campo", "COD_SCP");
  await expect(page.locator("#cod-scp")).toBeInViewport();
  // Link antigo.
  await abrir(page, "/blocos/0/0035#campo-2");
  await expect(page).toHaveURL(/\/blocos\/0\/0035#cod-scp$/);
  await expect(page.locator("#cod-scp")).toBeInViewport();
  // Copiar o link do campo.
  await page.getByRole("button", { name: "Copiar link do campo COD_SCP" }).click();
  await expect(page.locator("#cod-scp").getByRole("status")).toHaveText("Link copiado");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("http://127.0.0.1:4173/blocos/0/0035#cod-scp");
  // Copiar a linha do exemplo.
  const linha = page.getByTestId("linha-explicada").first();
  await linha.getByRole("button", { name: "Copiar linha" }).click();
  await expect(linha.getByRole("status")).toHaveText("Copiado");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("|0035|11111111000291|SCP TESTE 1|");
});

test("[CT-125] busca por nome de campo e por regra, com resultados agrupados", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/");
  await page.keyboard.press("Control+k");
  const campo = page.getByRole("combobox", { name: "Buscar" });
  await campo.fill("COD_SCP");
  const lista = page.getByRole("listbox", { name: "Resultados" });
  await expect(lista.getByRole("group", { name: "Campos" })).toBeVisible();
  await expect(lista.getByRole("group", { name: "Campos" }).getByRole("option").filter({ hasText: "0035.COD_SCP" })).toBeVisible();
  await expect(lista.getByRole("group", { name: "Regras de validação" })).toBeVisible();
  await campo.fill("REGRA_CNPJ_DIFERENTE_SCP");
  const regra = lista.getByRole("group", { name: "Regras de validação" }).getByRole("option").filter({ hasText: "0035.COD_SCP" });
  await regra.click();
  await expect(page).toHaveURL(/\/blocos\/0\/0035#regra-cod-scp-regra-cnpj-diferente-scp$/);
  // A seção de regras aparece também no nível “Estou começando”.
  await expect(page.locator("#regra-cod-scp-regra-cnpj-diferente-scp")).toBeVisible();
});

test("[CT-126] dicas do glossário em “Para que serve” e nas regras", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos/m/m300");
  await page.evaluate(() => document.documentElement.setAttribute("data-nivel", "profissional"));
  const para = page.getByTestId("para-que-serve");
  const termo = para.locator("[data-termo]:visible").first();
  await expect(termo).toBeVisible();
  await termo.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await expect(page.locator("section[aria-labelledby=t-regras] [data-termo]").first()).toBeAttached();
});

test("[AC-025] registro: cartões, mapa e botões de copiar pelo teclado, com axe nos dois temas", async ({ page }) => {
  for (const largura of [375, 1440]) {
    await page.setViewportSize({ width: largura, height: 900 });
    await abrir(page, "/blocos/0/0000");
    for (const tema of ["light", "dark"]) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);
      const r = await new AxeBuilder({ page }).withTags(AXE).analyze();
      expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`), `${largura} ${tema}`).toEqual([]);
    }
  }
  // Celular: cada campo é um cartão, com os rótulos das colunas.
  await page.setViewportSize({ width: 375, height: 900 });
  const cartao = page.locator("#cnpj");
  await expect(cartao.locator("td").first()).toHaveCSS("display", "flex");
  // Teclado chega ao botão de copiar do campo.
  await page.getByRole("button", { name: "Copiar link do campo CNPJ" }).focus();
  await expect(page.getByRole("button", { name: "Copiar link do campo CNPJ" })).toBeFocused();
});

for (const largura of [375, 768, 1050, 1440]) {
  test(`[RS-012] registros com muitos campos em ${largura} px sem rolagem lateral da página`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    for (const url of ["/blocos/0/0000", "/blocos/m/m300", "/blocos/y/y672"]) {
      await abrir(page, url);
      expect(await sobraLateral(page), url).toBeLessThanOrEqual(0);
    }
  });
}
