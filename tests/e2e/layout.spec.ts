import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const AXE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const CHAVE = "ecf:preferencias:v1";

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
async function prefs(page: Page, p: Record<string, unknown>) {
  await page.addInitScript(([c, v]) => localStorage.getItem(c!) ?? localStorage.setItem(c!, v!), [CHAVE, JSON.stringify(p)]);
}
const menu = (page: Page) => page.locator("[data-lateral]").getByRole("navigation", { name: "Principal", exact: true });
const sobraLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const DESTINOS: [string, RegExp][] = [
  ["inicio", /4173\/$/],
  ["o-que-e", /\/o-que-e$/],
  ["quem-deve-entregar", /\/quem-deve-entregar$/],
  ["glossario", /\/glossario$/],
  ["blocos", /\/blocos$/],
  ["preencher", /\/preencher$/],
  ["exemplos", /\/exemplos$/],
  ["simulador", /\/simulador$/],
  ["incentivos", /\/incentivos$/],
  ["novidades", /\/novidades$/],
  ["fontes", /\/fontes$/],
];

test("[CT-129] cada item do menu lateral leva à área certa e fica ativo nas páginas filhas", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/glossario");
  for (const [slug, url] of DESTINOS) {
    await menu(page).locator(`[data-item-menu="${slug}"]`).click();
    await expect(page).toHaveURL(url);
    await expect(menu(page).locator(`[data-item-menu="${slug}"]`)).toHaveAttribute("aria-current", "page");
    await expect(menu(page).locator("[data-item-menu][aria-current]")).toHaveCount(1);
  }
  for (const [url, item] of [
    ["/blocos/m", "blocos"],
    ["/blocos/0/0035", "blocos"],
    ["/importancia", "o-que-e"],
    ["/exemplos/lucro-real", "exemplos"],
    ["/ac/2024/blocos/m/m300", "blocos"],
  ] as const) {
    await abrir(page, url);
    await expect(menu(page).locator(`[data-item-menu="${item}"]`), url).toHaveAttribute("aria-current", "true");
  }
  // Os links do menu levam o ano junto.
  await expect(menu(page).locator('[data-item-menu="glossario"]')).toHaveAttribute("href", "/ac/2024/glossario");
});

test("[CT-130] subnível dos blocos só na área de blocos, com o bloco atual marcado", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/glossario");
  await expect(page.getByTestId("sub-blocos")).toHaveCount(0);
  await abrir(page, "/blocos");
  const sub = page.getByTestId("sub-blocos");
  await expect(sub.getByRole("link")).toHaveCount(17);
  await expect(sub.locator("[aria-current]")).toHaveCount(0);
  await sub.getByRole("link", { name: /^Bloco M:/ }).click();
  await expect(page).toHaveURL(/\/blocos\/m$/);
  await expect(sub.getByRole("link", { name: /^Bloco M:/ })).toHaveAttribute("aria-current", "page");
  await abrir(page, "/blocos/m/m300");
  await expect(page.getByTestId("sub-blocos").getByRole("link", { name: /^Bloco M:/ })).toHaveAttribute("aria-current", "page");
});

test("[CT-131] recolher o menu: escolha salva, sem piscar, e expansão temporária entre 1024 e 1279 px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/blocos");
  const lateral = page.locator("[data-lateral]");
  const botao = page.getByTestId("recolher-menu");
  await expect(botao).toHaveAccessibleName("Recolher menu");
  await expect(botao).toHaveAttribute("aria-expanded", "true");
  await botao.click();
  await expect(botao).toHaveAccessibleName("Expandir menu");
  await expect.poll(async () => (await lateral.boundingBox())?.width).toBeLessThan(80);
  // Ícone recolhido continua navegando, com o nome para o leitor de tela.
  await expect(menu(page).getByRole("link", { name: "Glossário" })).toBeVisible();
  // Depois do F5 a largura já vem certa antes da hidratação (prefs.js).
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.menu)).toBe("recolhido");
  expect((await lateral.boundingBox())?.width).toBeLessThan(80);
  await page.getByTestId("recolher-menu").click();
  await expect.poll(async () => (await lateral.boundingBox())?.width).toBeGreaterThan(200);
  expect(await page.evaluate((c) => JSON.parse(localStorage.getItem(c) ?? "{}").menu, CHAVE)).toBeNull();

  // Entre 1024 e 1279 px começa recolhido; abrir vale só até a próxima página e não é salvo.
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect.poll(async () => (await lateral.boundingBox())?.width).toBeLessThan(80);
  await page.getByTestId("recolher-menu").click();
  await expect.poll(async () => (await lateral.boundingBox())?.width).toBeGreaterThan(200);
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await lateral.boundingBox())?.width).toBeLessThan(80);
  await page.getByTestId("recolher-menu").click();
  await menu(page).getByRole("link", { name: "Novidades" }).click();
  await expect(page).toHaveURL(/\/novidades$/);
  await expect.poll(async () => (await lateral.boundingBox())?.width).toBeLessThan(80);
  expect(await page.evaluate((c) => JSON.parse(localStorage.getItem(c) ?? "{}").menu, CHAVE)).toBeNull();
});

test("[CT-132] home: prazo pela data do dia, números dos dados e atalho do quiz", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-07-01T12:00:00-03:00"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/");
  // Card "Próxima entrega" (redesenho): qual ECF vem e quantos dias faltam.
  await expect(page.getByTestId("contagem-prazo")).toContainText("ECF 2026 · ano-calendário 2025");
  await expect(page.getByTestId("contagem-prazo")).toContainText("Prazo: 31/07/2026 · faltam 30 dias");
  const cartoes = page.getByTestId("cartao-numero");
  await expect(cartoes).toHaveCount(4);
  await expect(cartoes.nth(0)).toContainText("17");
  await expect(cartoes.nth(0)).toContainText("leiaute 12");
  await expect(cartoes.nth(1)).toContainText(/\d{3}/);
  await expect(page.getByTestId("widget-quiz")).toContainText("Minha empresa precisa entregar?");
  await page.getByTestId("widget-quiz").click();
  await expect(page).toHaveURL(/\/quem-deve-entregar$/);

  // Prazo já passado e sem regra para o ano seguinte: a confirmar, sem número.
  await page.clock.setFixedTime(new Date("2026-11-26T12:00:00-03:00"));
  await abrir(page, "/");
  await expect(page.getByTestId("contagem-prazo")).toContainText("ECF 2027 · ano-calendário 2026");
  await expect(page.getByTestId("contagem-prazo")).toContainText("a confirmar em norma");

  // Card "Sua trilha": sem progresso, "Começar"; com progresso, "Continuar" no próximo tema.
  await expect(page.getByTestId("trilha-home").getByRole("link")).toHaveText(/Começar/);
  await page.evaluate((c) => localStorage.setItem(c, JSON.stringify({ estudadas: ["o-que-e"] })), CHAVE);
  await abrir(page, "/");
  await expect(page.getByTestId("trilha-home")).toContainText("Continue de onde parou");
  await expect(page.getByTestId("trilha-home")).toContainText("Por que a ECF importa");
  await expect(page.getByTestId("trilha-home").getByRole("link")).toHaveAttribute("href", "/importancia");
  // Saíram da home: cartão de perfil, mapa de fluxo e conquistas.
  await expect(page.getByTestId("cartao-perfil")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Como os dados percorrem a ECF" })).toHaveCount(0);
});

test("[CT-133] nenhum controle repetido: ano, nível e tema uma vez só, no perfil e na coluna", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const url of ["/", "/blocos", "/blocos/m/m300", "/glossario"]) {
    await abrir(page, url);
    await expect(page.getByRole("group", { name: /^Ano-calendário$|^Ano da ECF no perfil$/ }), url).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Nível do conteúdo" }), url).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Alternar entre tema claro e escuro" }), url).toHaveCount(1);
  }
  // O perfil reúne ano e nível, e trocar o ano leva à mesma página no outro ano.
  await page.getByTestId("indicador-perfil").first().click();
  const painel = page.getByTestId("dialogo-perfil");
  await painel.getByText("Já conheço").click();
  await expect(page.locator("html")).toHaveAttribute("data-nivel", "profissional");
  await painel.getByRole("group", { name: "Ano da ECF no perfil" }).getByRole("link", { name: "2024" }).click();
  await expect(page).toHaveURL(/\/ac\/2024\/glossario$/);
  await expect(page.getByTestId("indicador-perfil").first()).toContainText("AC 2024");
  await expect(page.getByTestId("indicador-perfil").first()).toContainText("Leiaute 11");
});

test("[AC-026] menu lateral e gaveta pelo teclado: dicas, foco preso e Esc", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await abrir(page, "/blocos");
  // Recolhido: a dica aparece também com o foco do teclado.
  const glossario = menu(page).getByRole("link", { name: "Glossário" });
  await glossario.focus();
  await expect(page.getByTestId("dica-menu")).toHaveText("Glossário");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/glossario$/);

  await page.setViewportSize({ width: 375, height: 800 });
  await abrir(page, "/blocos/m");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const gaveta = page.getByTestId("gaveta");
  await expect(gaveta).toBeVisible();
  await expect(gaveta.getByRole("navigation", { name: "Principal", exact: true })).toBeVisible();
  // Foco preso: andar com Tab nunca sai da gaveta.
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[data-testid=gaveta]") || document.activeElement === document.body)).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(gaveta).toBeHidden();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await gaveta.getByRole("link", { name: "Novidades" }).click();
  await expect(page).toHaveURL(/\/novidades$/);
  await expect(gaveta).toBeHidden();
});

for (const tema of ["dark", "light"] as const) {
  test(`[AC-027] axe com o layout novo, menu aberto e recolhido, ${tema}`, async ({ page }) => {
    test.setTimeout(240_000);
    for (const [largura, menuPref] of [[375, null], [1100, null], [1440, null], [1440, "recolhido"]] as const) {
      const ctx = await page.context().browser()!.newContext({ viewport: { width: largura, height: 900 } });
      const p = await ctx.newPage();
      await prefs(p, { tema, perfil: "pulado", menu: menuPref });
      for (const url of ["/", "/blocos", "/blocos/m/m300", "/fontes"]) {
        await p.goto(url);
        await p.waitForLoadState("networkidle");
        const r = await new AxeBuilder({ page: p }).withTags(AXE).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 160)}`), `${url} ${largura} ${menuPref}`).toEqual([]);
      }
      await ctx.close();
    }
  });
}

for (const largura of [375, 768, 1024, 1050, 1280, 1440]) {
  test(`[RS-013] layout com menu lateral sem rolagem lateral e com alvos de 44 px no menu, ${largura}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: largura, height: 900 });
    for (const url of ["/", "/blocos", "/blocos/m/m300", "/fontes"]) {
      await abrir(page, url);
      expect(await sobraLateral(page), url).toBeLessThanOrEqual(0);
    }
    await abrir(page, "/");
    // Cartões de número: 1 coluna em 375, 2 abaixo de 1024, 4 a partir de 1024.
    const tops = await page.getByTestId("cartao-numero").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    const porLinha = tops.filter((t) => t === tops[0]).length;
    expect(porLinha).toBe(largura < 640 ? 1 : largura < 1024 ? 2 : 4);
    if (largura >= 1024) {
      const pequenos = await page.locator("[data-lateral] nav a").evaluateAll((els) =>
        els.filter((e) => !e.closest("[data-testid=sub-blocos]")).map((e) => e.getBoundingClientRect()).filter((r) => r.height < 44 || r.width < 44).length,
      );
      expect(pequenos).toBe(0);
    }
  });
}

for (const largura of [375, 1024, 1440]) {
  test(`[RS-015] coluna fixa ao rolar, busca centralizada e nada sobreposto, ${largura}`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    await abrir(page, "/");
    await page.evaluate(() => window.scrollTo(0, 1500));
    const busca = (await page.getByRole("button", { name: /^Buscar registro/ }).boundingBox())!;
    // A barra superior é fixa: a busca continua no topo.
    expect(busca.y).toBeLessThan(20);
    if (largura >= 1024) {
      const lateral = (await page.locator("[data-lateral]").boundingBox())!;
      expect(lateral.y).toBe(0);
      expect(lateral.height).toBeGreaterThanOrEqual(899);
      // Logo, itens e perfil continuam visíveis com a página rolada.
      await expect(page.locator("[data-lateral] [data-item-menu=blocos]")).toBeInViewport();
      await expect(page.locator("[data-lateral] [data-testid=indicador-perfil]:visible").first()).toBeInViewport();
      const main = (await page.locator("main").boundingBox())!;
      expect(Math.abs(busca.x + busca.width / 2 - (main.x + main.width / 2))).toBeLessThanOrEqual(2);
      // A coluna não cobre o conteúdo.
      expect(main.x).toBeGreaterThanOrEqual(lateral.x + lateral.width);
    } else {
      await expect(page.getByRole("button", { name: "Abrir menu" })).toBeInViewport();
    }
    expect(await sobraLateral(page)).toBeLessThanOrEqual(0);
  });
}
