import { expect, test, type Page } from "@playwright/test";

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const rolagem = (page: Page) => page.evaluate(() => Math.round(window.scrollY));
const ORIGENS = ["/o-que-e", "/importancia", "/quem-deve-entregar", "/blocos", "/blocos/m", "/blocos/m/m300", "/exemplos", "/exemplos/lucro-real", "/novidades", "/glossario", "/simulador"];

for (const largura of [375, 1440]) {
  test(`[CT-100] links do conteúdo abrem no topo, ${largura}px`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: largura, height: 900 });
    let testados = 0;
    for (const origem of ORIGENS) {
      await abrir(page, origem);
      const alvos = await page.evaluate(() =>
        [...new Set([...document.querySelectorAll('main a[href^="/"]')].filter((a) => a.getClientRects().length).map((a) => a.getAttribute("href")!))].filter((h) => !h.includes("#") && h !== location.pathname).slice(-3),
      );
      for (const alvo of alvos) {
        await abrir(page, origem);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.locator(`main a[href="${alvo}"]`).last().evaluate((e: HTMLElement) => e.click());
        await expect(page).toHaveURL((u) => u.pathname === alvo);
        await expect(page.locator("h1")).toBeFocused();
        expect(await rolagem(page), `${origem} → ${alvo}`).toBe(0);
        testados++;
      }
    }
    expect(testados).toBeGreaterThan(20);
  });
}

test("[CT-100] Voltar devolve a rolagem e âncora leva ao alvo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/novidades");
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  const antes = await rolagem(page);
  const ultima = page.locator('main a[href^="/novidades/"]').last();
  await ultima.evaluate((e: HTMLElement) => e.click());
  await expect(page.locator("h1")).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/novidades$/);
  await expect.poll(() => rolagem(page)).toBe(antes);
  // Depois de um Voltar, a ida seguinte por link volta a começar no topo.
  await ultima.evaluate((e: HTMLElement) => e.click());
  await expect(page).toHaveURL(/\/novidades\/.+/);
  await expect(page.locator("h1")).toBeFocused();
  expect(await rolagem(page)).toBe(0);
  await abrir(page, "/");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Buscar" }).fill("scp");
  await page.getByRole("option").filter({ hasText: "Glossário" }).first().click();
  await expect(page).toHaveURL(/\/glossario#scp$/);
  await expect(page.locator("#scp")).toBeInViewport();
});

test("[CT-101] mapa: bloco, regime e aba no endereço, com F5, link e início limpo", async ({ page }) => {
  await abrir(page, "/");
  await page.locator('[data-no="K"]').click();
  await expect(page).toHaveURL(/\/\?bloco=K$/);
  await page.getByRole("button", { name: /^Registros \(/ }).click();
  await expect(page).toHaveURL(/\/\?bloco=K&aba=registros$/);
  await page.reload();
  await expect(page.locator('[data-no="K"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-registro]").first()).toBeVisible();
  // Link recebido de outra pessoa.
  await abrir(page, "/?regime=presumido&bloco=Q&aba=erros");
  await expect(page.locator('[data-no="Q"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Lucro presumido", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /^Erros comuns/ })).toHaveAttribute("aria-pressed", "true");
  // Voltar para o mapa depois de abrir um bloco.
  await page.getByRole("link", { name: "Abrir o bloco Q" }).click();
  await expect(page).toHaveURL(/\/blocos\/q$/);
  await page.goBack();
  await expect(page.locator('[data-no="Q"]')).toHaveAttribute("aria-pressed", "true");
  // A marca no cabeçalho leva ao início limpo: endereço e tela iguais.
  await page.locator("header a").first().click();
  await expect(page).toHaveURL(/4173\/$/);
  await expect(page.locator('[data-no="M"]')).toHaveAttribute("aria-pressed", "true");
});

test("[CT-101] filtros de novidades, blocos e glossário no endereço", async ({ page }) => {
  await abrir(page, "/novidades");
  await page.getByRole("button", { name: "Norma", exact: true }).click();
  await page.getByLabel("Só as que valem para o leiaute 12").check();
  await expect(page).toHaveURL(/\/novidades\?tipo=[a-z-]+&so=leiaute$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Norma", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main [role=status]")).toHaveText("Mostrando 2 de 15.");
  await page.getByRole("button", { name: "Tudo" }).click();
  await page.getByLabel("Só as que valem para o leiaute 12").uncheck();
  await expect(page).toHaveURL(/\/novidades$/);

  await abrir(page, "/blocos");
  await page.getByLabel("Regime da empresa").selectOption({ label: "Lucro presumido" });
  await page.getByLabel("Esconder os não previstos").check();
  const texto = await page.locator("main [role=status]").first().innerText();
  await page.reload();
  await expect(page.locator("main [role=status]").first()).toHaveText(texto);
  await expect(page.getByLabel("Esconder os não previstos")).toBeChecked();

  await abrir(page, "/glossario");
  await page.getByLabel("Filtrar termos").pressSequentially("lalur", { delay: 20 });
  await expect(page).toHaveURL(/\/glossario\?termo=lalur$/);
  await page.reload();
  await expect(page.getByLabel("Filtrar termos")).toHaveValue("lalur");
  // Sair antes da espera não grava o filtro na página seguinte.
  await page.getByLabel("Filtrar termos").fill("scp");
  await page.locator('header nav a[href="/simulador"]').first().evaluate((e: HTMLElement) => e.click());
  await expect(page).toHaveURL(/\/simulador$/);
  await page.waitForTimeout(600);
  await expect(page).toHaveURL(/\/simulador$/);
});

test("[CT-101] link do mapa vale para quem prefere outro ano", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ecf:preferencias:v1", JSON.stringify({ ano: 2024 })));
  await abrir(page, "/?bloco=K");
  await expect(page).toHaveURL(/\/ac\/2024\?bloco=K$/);
  await expect(page.locator('[data-no="K"]')).toHaveAttribute("aria-pressed", "true");
});

test("[SG-031] parâmetros do endereço só aceitam valores da lista e nunca executam", async ({ page }) => {
  test.setTimeout(180_000);
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  const ruins = ['"><img src=x onerror=window.__pwn=1>', "<svg onload=window.__pwn=1>", "javascript:window.__pwn=1", "{{7*7}}", "__proto__", "constructor", "S", "x".repeat(3000)];
  for (const r of ruins) {
    const v = encodeURIComponent(r);
    await abrir(page, `/?regime=${v}&bloco=${v}&aba=${v}`);
    await expect(page.locator('[data-no="M"]')).toHaveAttribute("aria-pressed", "true");
    await abrir(page, `/novidades?tipo=${v}&so=${v}`);
    await expect(page.locator("main [role=status]")).toHaveText("Mostrando 15 de 15.");
    await abrir(page, `/blocos?regime=${v}&so=${v}`);
    await expect(page.locator("main [role=status]").first()).toHaveText("Mostrando 17 de 17 blocos");
    await abrir(page, `/glossario?termo=${v}`);
    await expect(page.getByLabel("Filtrar termos")).toHaveValue(r.slice(0, 60));
    expect(await page.evaluate(() => (window as unknown as { __pwn?: number }).__pwn ?? 0), r).toBe(0);
  }
  expect(erros).toEqual([]);
  // Bloco que não existe no regime do link não deixa a tela sem seleção.
  await abrir(page, "/?regime=presumido&bloco=M");
  await expect(page.locator('[data-no="P"]')).toHaveAttribute("aria-pressed", "true");
  // O redirecionamento de ano leva a seleção, mas nunca para fora do domínio.
  await page.addInitScript(() => localStorage.setItem("ecf:preferencias:v1", JSON.stringify({ ano: 2024 })));
  await abrir(page, "/?bloco=//example.com&x=https://example.com");
  await expect(page).toHaveURL((u) => u.hostname === "127.0.0.1" && u.pathname === "/ac/2024");
});

test("[RD-008] arquivos com hash ficam no navegador; páginas e dados são reconferidos", async ({ page }) => {
  await page.goto("/");
  const js = await page.locator('script[src^="/_next/static/"]').first().getAttribute("src");
  expect((await page.request.get(js!)).headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  for (const u of ["/", "/blocos/m", "/dados/2025/busca.json", "/prefs.js"]) {
    const r = await page.request.get(u);
    expect(r.status(), u).toBe(200);
    expect(r.headers()["cache-control"], u).toBe("public, max-age=0, must-revalidate");
  }
});
