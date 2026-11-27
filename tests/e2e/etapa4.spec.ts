import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const AXE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const CHAVE = "ecf:preferencias:v1";

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const status = (page: Page) => page.getByRole("status").filter({ hasText: /incentivos$/ });
const sobraLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("[CT-136] hub de incentivos: filtros no endereço, F5 e cartões com selo de texto", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/incentivos");
  await expect(page.locator("h1")).toHaveText("Incentivos fiscais");
  await expect(page.getByTestId("aviso-lc224")).toContainText("O que muda a partir do AC 2026");
  await expect(status(page)).toHaveText("Mostrando 15 de 15 incentivos");
  await page.getByLabel("Situação na LC 224").selectOption({ label: "Fora da redução" });
  await expect(page).toHaveURL(/situacao=excetuado/);
  await expect(status(page)).toHaveText("Mostrando 5 de 15 incentivos");
  await page.reload();
  await expect(page.getByLabel("Situação na LC 224")).toHaveValue("excetuado");
  await expect(page.locator("[data-incentivo]")).toHaveCount(5);
  for (const c of await page.locator("[data-incentivo] [data-situacao]").all()) await expect(c).toHaveText("Fora da redução");
  await page.getByLabel("Situação na LC 224").selectOption("");
  await page.getByLabel("Regime").selectOption("presumido");
  await expect(page.locator("[data-incentivo]")).toHaveCount(1);
  await page.locator("[data-incentivo=lucro-presumido] a").click();
  await expect(page).toHaveURL(/\/incentivos\/lucro-presumido$/);
  await expect(page.getByRole("navigation", { name: "Você está em" })).toContainText("Incentivos fiscais");
  // O item do menu fica ativo também na ficha.
  await expect(page.locator('[data-lateral] [data-item-menu="incentivos"]')).toHaveAttribute("aria-current", "true");
});

test("[CT-137] ficha: situação por ano, exemplo calculado, registros da ECF e situação judicial", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/incentivos/lucro-presumido");
  await expect(page.locator("[data-ac='2026']")).toContainText("Conferido com a fonte");
  await expect(page.locator("[data-ac='2027']")).toContainText("A verificar");
  // P&R 14: 80.000 + 38.720 + 80.000 + 38.720
  await expect(page.getByTestId("exemplo-depois")).toHaveText("R$ 237.440,00");
  await expect(page.getByRole("heading", { name: "Situação judicial" })).toBeVisible();
  await page.getByRole("link", { name: /^P200/ }).click();
  await expect(page).toHaveURL(/\/blocos\/p\/p200$/);
  await abrir(page, "/incentivos/pat");
  // P&R 21: limite de 400 vira 360; doação de 200 continua inteira.
  const tabela = page.getByRole("table", { name: "Dedução antes e depois da redução" });
  await expect(tabela.getByRole("row").nth(1)).toContainText("R$ 360,00");
  await expect(tabela.getByRole("row").nth(2)).toContainText("R$ 200,00");
  await abrir(page, "/incentivos/sudam-sudene");
  await expect(page.getByTestId("falta")).toContainText("Falta conferir");
  // No AC 2024, os links da ficha levam o ano junto.
  await abrir(page, "/ac/2024/incentivos/pat");
  await expect(page.getByRole("link", { name: /^N630/ })).toHaveAttribute("href", "/ac/2024/blocos/n/n630");
});

test("[CT-138] simulador: lucro presumido com as regras do AC 2026", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/simulador");
  await page.getByText("Lucro presumido", { exact: true }).click();
  await page.getByText("AC 2026, com a LC 224").click();
  await expect(page.getByTestId("sim-lc224")).toBeVisible();
  const campo = (r: string) => page.getByLabel(`${r} (R$)`, { exact: true });
  await campo("Receita de comércio, indústria ou transporte de carga").fill("1.440.000,00");
  await campo("Receita de serviços em geral").fill("360.000,00");
  await campo("Rendimentos de aplicações financeiras").fill("0");
  // P&R 14, 1º trimestre: IRPJ com acréscimo; CSLL ainda sem.
  await expect(page.locator("[data-passo='irpj-presumido'] [data-valor]")).toHaveText("R$ 237.440,00");
  await expect(page.locator("[data-passo='irpj-geral-acrescimo'] [data-valor]")).toHaveText("R$ 38.720,00");
  await expect(page.locator("[data-passo='csll-geral-acrescimo']")).toHaveCount(0);
  await page.getByLabel("Trimestre de 2026").selectOption("2");
  await expect(page.locator("[data-passo='csll-geral-acrescimo'] [data-valor]")).toHaveText("R$ 58.080,00");
  // De volta às regras do ano da página: nada de acréscimo.
  await page.getByText("AC 2025", { exact: true }).click();
  await expect(page.locator("[data-passo='irpj-geral-acrescimo']")).toHaveCount(0);
  await expect(page.locator("[data-passo='irpj-presumido'] [data-valor]")).toHaveText("R$ 230.400,00");
});

test("[CT-139] aviso do lucro presumido na home só para quem tem esse regime no perfil", async ({ page }) => {
  await abrir(page, "/");
  await expect(page.getByTestId("aviso-regime")).toHaveCount(0);
  await page.evaluate((c) => localStorage.setItem(c, JSON.stringify({ regime: "presumido", perfil: "respondido" })), CHAVE);
  await page.reload();
  const aviso = page.getByTestId("aviso-regime");
  await expect(aviso).toContainText("Lucro presumido a partir de 2026");
  await aviso.getByRole("link", { name: "Veja como calcular" }).click();
  await expect(page).toHaveURL(/\/incentivos\/lucro-presumido$/);
});

test("[CT-140] selo “Incentivos neste registro” nos registros e blocos ligados", async ({ page }) => {
  await abrir(page, "/blocos/p/p200");
  const selo = page.getByTestId("incentivos-no-registro");
  await expect(selo).toContainText("Lucro presumido");
  await expect(selo).toContainText("Reduzido pela LC 224");
  await abrir(page, "/blocos/x/x460");
  await expect(page.getByTestId("incentivos-no-registro")).toContainText("Lei do Bem");
  await abrir(page, "/blocos/n");
  await expect(page.getByTestId("incentivos-no-registro")).toContainText("PAT");
  await abrir(page, "/blocos/0/0000");
  await expect(page.getByTestId("incentivos-no-registro")).toHaveCount(0);
});

test("[CT-141] página da lei: o que muda na ECF por ano e linha do tempo com fonte", async ({ page }) => {
  await abrir(page, "/novidades/lc-224-2025");
  await expect(page.getByTestId("lc224-na-ecf").locator("li")).toHaveCount(4);
  const linha = page.getByTestId("lc224-linha").locator("li");
  await expect(linha.first()).toContainText("26/12/2025");
  await expect(linha.last()).toContainText("A verificar");
  for (const l of await linha.all()) await expect(l.getByRole("link", { name: "Fonte oficial" })).toHaveCount(1);
  await abrir(page, "/novidades/lc-239-2026");
  await expect(page.getByText("Leiaute a definir").first()).toBeVisible();
  // A busca acha o hub e as fichas.
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Buscar" }).fill("Lei do Bem");
  await expect(page.getByRole("option").first()).toContainText("Lei do Bem");
});

test("[SG-034] filtros do hub só aceitam valores da lista e nunca executam", async ({ page }) => {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  for (const r of ['"><img src=x onerror=window.__pwn=1>', "javascript:window.__pwn=1", "__proto__", "x".repeat(3000)]) {
    const v = encodeURIComponent(r);
    await abrir(page, `/incentivos?tributo=${v}&regime=${v}&situacao=${v}`);
    await expect(status(page)).toHaveText("Mostrando 15 de 15 incentivos");
    expect(await page.evaluate(() => (window as unknown as { __pwn?: number }).__pwn ?? 0)).toBe(0);
  }
  expect(erros).toEqual([]);
});

for (const tema of ["light", "dark"] as const) {
  test(`[AC-028] incentivos e página da lei: axe e teclado, ${tema}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(([c, v]) => localStorage.setItem(c!, v!), [CHAVE, JSON.stringify({ tema, perfil: "pulado", regime: "presumido" })]);
    for (const largura of [375, 1440]) {
      await page.setViewportSize({ width: largura, height: 900 });
      for (const url of ["/incentivos", "/incentivos/lucro-presumido", "/incentivos/sudam-sudene", "/novidades/lc-224-2025", "/", "/blocos/p/p200"]) {
        await abrir(page, url);
        const r = await new AxeBuilder({ page }).withTags(AXE).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 160)}`), `${url} ${largura}`).toEqual([]);
      }
    }
    // Filtro pelo teclado.
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrir(page, "/incentivos");
    await page.getByLabel("Tributo").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByLabel("Tributo")).not.toHaveValue("");
  });
}

for (const largura of [375, 768, 1050, 1440]) {
  test(`[RS-014] incentivos sem rolagem lateral, ${largura}`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    for (const url of ["/incentivos", "/incentivos/lucro-presumido", "/incentivos/pat", "/novidades/lc-224-2025"]) {
      await abrir(page, url);
      expect(await sobraLateral(page), url).toBeLessThanOrEqual(0);
    }
  });
}
