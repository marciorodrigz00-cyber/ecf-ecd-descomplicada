import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const CHAVE = "ecf:preferencias:v1";
const AXE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const erros = (page: Page) => {
  const lista: string[] = [];
  page.on("pageerror", (e) => lista.push(e.message));
  page.on("console", (m) => m.type() === "error" && lista.push(m.text()));
  return lista;
};
const sobraLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("[CT-116] perfil respondido ajusta blocos e roteiro, e sobrevive ao F5", async ({ page }) => {
  const e = erros(page);
  await abrir(page, "/");
  const cartao = page.getByTestId("cartao-perfil");
  await expect(cartao).toBeVisible();
  await cartao.getByText("Lucro presumido", { exact: true }).click();
  await cartao.getByText("Já conheço", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-nivel", "profissional");
  await cartao.getByRole("button", { name: "Pronto" }).click();
  await expect(cartao).toBeHidden();
  // F5: o cartão não volta, nem por um instante (some antes da pintura).
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-perfil", "ok");
  await expect(page.getByTestId("cartao-perfil")).toBeHidden();
  // Blocos: o filtro já vem no regime do perfil.
  await abrir(page, "/blocos");
  await expect(page.getByLabel("Regime da empresa")).toHaveValue("presumido");
  await expect(page.getByTestId("regime-do-perfil")).toBeVisible();
  // O endereço vence o perfil; “todos” é escolha explícita.
  await abrir(page, "/blocos?regime=real");
  await expect(page.getByLabel("Regime da empresa")).toHaveValue("real");
  await expect(page.getByTestId("regime-do-perfil")).toHaveCount(0);
  await page.getByLabel("Regime da empresa").selectOption("todos");
  await expect(page).toHaveURL(/regime=todos/);
  await expect(page.getByTestId("legenda-situacao")).toHaveCount(0);
  // Roteiro de preenchimento abre no regime do perfil.
  await abrir(page, "/preencher");
  await expect(page.getByLabel("Qual é o regime da empresa?")).toHaveValue("presumido");
  // Mapa da home também.
  await abrir(page, "/");
  await expect(page.getByTestId("mapa-contagem")).toHaveText(/Regime escolhido: Lucro presumido/);
  expect(e).toEqual([]);
});

test("[CT-117] perfil pulado e alterado depois por “Meu perfil”", async ({ page }) => {
  await abrir(page, "/");
  await page.getByTestId("cartao-perfil").getByRole("button", { name: "Pular por agora" }).click();
  await expect(page.getByTestId("cartao-perfil")).toBeHidden();
  await abrir(page, "/blocos/m");
  const botao = page.getByRole("button", { name: "Meu perfil" });
  await botao.click();
  const dialogo = page.getByTestId("dialogo-perfil");
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByRole("heading", { name: "Meu perfil" })).toBeVisible();
  await dialogo.getByText("Imune", { exact: true }).click();
  await dialogo.getByRole("button", { name: "Pronto" }).click();
  await expect(dialogo).toBeHidden();
  await expect(botao).toBeFocused();
  await abrir(page, "/blocos");
  await expect(page.getByLabel("Regime da empresa")).toHaveValue("imune");
  // Escape fecha; “Ainda não sei” apaga o regime.
  await page.getByRole("button", { name: "Meu perfil" }).click();
  await page.getByTestId("dialogo-perfil").getByText("Ainda não sei", { exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("dialogo-perfil")).toBeHidden();
  await expect(page.getByLabel("Regime da empresa")).toHaveValue("todos");
});

test("[CT-118] home: dois caminhos no topo, depois prazo, novidades e mapa", async ({ page }) => {
  await abrir(page, "/");
  await expect(page.locator("h1")).toHaveText("Entenda e prepare a ECF");
  await expect(page.getByTestId("caminho-aprender")).toHaveAttribute("href", "/o-que-e");
  await expect(page.getByTestId("caminho-preencher")).toHaveAttribute("href", "/preencher");
  const titulos = await page.locator("main h2").allInnerTexts();
  const pos = (t: string) => titulos.findIndex((x) => x.startsWith(t));
  expect(pos("Monte seu perfil")).toBe(0);
  expect(pos("O que vale para o ano-calendário")).toBeLessThan(pos("Novidades conferidas"));
  expect(pos("Novidades conferidas")).toBeLessThan(pos("Como os dados percorrem a ECF"));
  // Conquistas e atalhos saíram da home.
  await expect(page.getByRole("heading", { name: "Conquistas" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Atalhos" })).toHaveCount(0);
  // Estudada a primeira seção, o caminho continua na seguinte.
  await page.evaluate((c) => localStorage.setItem(c, JSON.stringify({ estudadas: ["o-que-e"], perfil: "pulado" })), CHAVE);
  await page.reload();
  await expect(page.getByTestId("caminho-aprender")).toHaveAttribute("href", "/importancia");
  await expect(page.getByTestId("caminho-aprender")).toContainText("Continuar");
});

test("[CT-119] Meu progresso: convite para quem chega, contadores depois do primeiro passo", async ({ page }) => {
  await abrir(page, "/meu-progresso");
  await expect(page.locator("h1")).toHaveText("Meu progresso");
  await expect(page.getByTestId("sem-progresso")).toBeVisible();
  await expect(page.getByText(/de \d+ conquistas/)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Trilha de estudo" })).toBeVisible();
  await abrir(page, "/blocos/k");
  await abrir(page, "/meu-progresso");
  await expect(page.getByTestId("sem-progresso")).toHaveCount(0);
  await expect(page.getByText(/1 de \d+ conquistas|0 de \d+ conquistas/)).toBeVisible();
  await expect(page.getByText(`Abra os 17 blocos cobertos, em qualquer regime`)).toBeVisible();
  // Link no cabeçalho marca a página atual.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("link", { name: "Meu progresso" }).first()).toHaveAttribute("aria-current", "page");
});

test("[CT-120] menu na ordem nova; Importância dentro de O que é", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/");
  const itens = await page.getByRole("navigation", { name: "Principal", exact: true }).getByRole("link").allInnerTexts();
  expect(itens.map((t) => t.trim())).toEqual(["O que é", "Quem entrega", "Blocos", "Exemplos", "Simulador", "Novidades", "Glossário", "Fontes"]);
  await abrir(page, "/o-que-e");
  await page.getByTestId("link-importancia").click();
  await expect(page).toHaveURL(/\/importancia$/);
  await expect(page.getByRole("navigation", { name: "Principal", exact: true }).getByRole("link", { name: "O que é" })).toHaveAttribute("aria-current", "page");
});

test("[CT-121] cartões de bloco: registros, regimes e situação para o regime do perfil", async ({ page }) => {
  await abrir(page, "/blocos");
  const m = page.locator("[data-bloco=M]");
  await expect(m.getByTestId("registros-do-bloco")).toHaveText(/^\d+ registros$/);
  await expect(m.getByRole("list", { name: "Situação em cada regime" }).getByRole("listitem")).toHaveCount(5);
  await expect(m.locator("[data-regime=real]")).toHaveAttribute("data-situacao", "sim");
  await page.evaluate((c) => localStorage.setItem(c, JSON.stringify({ regime: "presumido", perfil: "respondido" })), CHAVE);
  await page.reload();
  await page.waitForLoadState("networkidle");
  const situacao = await page.locator("[data-bloco=M]").locator("[data-regime=presumido]").getAttribute("data-situacao");
  const frase = { sim: "Previsto para o seu regime", depende: "Depende de uma condição", nao: "Não se aplica ao seu regime" }[situacao as "sim"];
  await expect(page.locator("[data-bloco=M]")).toContainText(frase);
  await expect(page.getByTestId("legenda-situacao")).toContainText("Não se aplica ao seu regime");
});

test("[SG-033] perfil corrompido no navegador volta ao padrão, sem erro e sem executar nada", async ({ page }) => {
  const e = erros(page);
  await abrir(page, "/");
  await page.evaluate((c) => localStorage.setItem(c, JSON.stringify({ regime: "<img src=x onerror=alert(1)>", perfil: "talvez", nivel: 7 })), CHAVE);
  let alerta = false;
  page.on("dialog", async (d) => {
    alerta = true;
    await d.dismiss();
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("cartao-perfil")).toBeVisible();
  await abrir(page, "/blocos");
  await expect(page.getByLabel("Regime da empresa")).toHaveValue("todos");
  expect(alerta).toBe(false);
  expect(e).toEqual([]);
});

test("[AC-024] perfil e home pelo teclado, com axe nos dois temas", async ({ page }) => {
  await abrir(page, "/");
  for (const tema of ["light", "dark"]) {
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);
    const r = await new AxeBuilder({ page }).withTags(AXE).analyze();
    expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`), `home ${tema}`).toEqual([]);
  }
  // Janela do perfil: abre pelo teclado, prende o foco e fecha com Escape.
  await page.getByRole("button", { name: "Meu perfil" }).focus();
  await page.keyboard.press("Enter");
  const dialogo = page.getByTestId("dialogo-perfil");
  await expect(dialogo).toBeVisible();
  await expect(dialogo.locator(":focus")).toHaveCount(1);
  for (const tema of ["light", "dark"]) {
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);
    const r = await new AxeBuilder({ page }).include("[data-testid=dialogo-perfil]").withTags(AXE).analyze();
    expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`), `diálogo ${tema}`).toEqual([]);
  }
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(page.getByRole("button", { name: "Meu perfil" })).toBeFocused();
  await abrir(page, "/meu-progresso");
  const r = await new AxeBuilder({ page }).withTags(AXE).analyze();
  expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`), "meu progresso").toEqual([]);
});

for (const largura of [375, 768, 1050, 1440]) {
  test(`[RS-011] home, perfil e Meu progresso em ${largura} px sem rolagem lateral`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    for (const url of ["/", "/meu-progresso", "/blocos"]) {
      await abrir(page, url);
      expect(await sobraLateral(page), url).toBeLessThanOrEqual(0);
    }
    await page.getByRole("button", { name: "Meu perfil" }).click();
    await expect(page.getByTestId("dialogo-perfil")).toBeVisible();
    expect(await sobraLateral(page), "diálogo").toBeLessThanOrEqual(0);
  });
}
