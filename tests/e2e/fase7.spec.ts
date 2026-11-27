import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mudarNivel } from "./apoio";

async function abrir(page: Page, url = "/") {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const caixa = (p: Page) => p.getByRole("dialog", { name: "Busca" });
const campo = (p: Page) => p.getByRole("combobox", { name: "Buscar" });
const opcoes = (p: Page) => caixa(p).getByRole("option");
const estado = (p: Page) => p.getByTestId("busca-estado");

test("[CT-095] busca: Ctrl+K, setas, Enter e foco", async ({ page }) => {
  await abrir(page);
  await page.keyboard.press("Control+k");
  await expect(campo(page)).toBeFocused();
  await expect(opcoes(page)).toHaveCount(17);
  await campo(page).fill("  M300 ");
  await expect(opcoes(page).first()).toContainText("M300");
  await expect(opcoes(page).first()).toHaveAttribute("aria-selected", "true");
  const ativo = async () => page.locator(`[id="${await campo(page).getAttribute("aria-activedescendant")}"]`);
  await expect(await ativo()).toContainText("M300");
  await page.keyboard.press("ArrowDown");
  await expect(opcoes(page).nth(1)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(opcoes(page).last()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/blocos\/m\/m300$/);
  await expect(caixa(page)).toBeHidden();
  await expect(page.locator("h1")).toBeFocused();
  // Abrir de novo, duas vezes seguidas, e fechar com Esc.
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+k");
  await expect(campo(page)).toBeFocused();
  await expect(campo(page)).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(caixa(page)).toBeHidden();
});

test("[CT-096] busca: acentos, vazio, sem resultado e campo", async ({ page }) => {
  await abrir(page);
  await page.getByRole("button", { name: /^Buscar/ }).filter({ visible: true }).first().click();
  await campo(page).fill("PREJUIZO fiscal");
  await expect(opcoes(page).first()).toContainText("prejuízo fiscal");
  await campo(page).fill("xyz123");
  await expect(estado(page)).toHaveText("Nenhum resultado para 'xyz123'");
  await expect(opcoes(page)).toHaveCount(0);
  await campo(page).fill("   ");
  await expect(opcoes(page)).toHaveCount(17);
  await expect(estado(page)).toContainText("Todos os blocos");
  await campo(page).fill("0010.forma_trib");
  await opcoes(page).first().click();
  await expect(page).toHaveURL(/\/blocos\/0\/0010#forma-trib$/);
  await expect(page.locator("#forma-trib")).toContainText("FORMA_TRIB");
  await page.keyboard.press("Control+k");
  await campo(page).fill("scp");
  await opcoes(page).filter({ hasText: "Glossário" }).first().click();
  await expect(page).toHaveURL(/\/glossario#scp$/);
  await expect(page.locator("#scp")).toBeInViewport();
});

test("[CT-097] busca respeita o ano e avisa quando falha", async ({ page }) => {
  await abrir(page, "/ac/2024/blocos");
  await page.keyboard.press("Control+k");
  await campo(page).fill("m300");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ac\/2024\/blocos\/m\/m300$/);
  let falhar = true;
  await page.route("**/dados/2025/busca.json", (r) => (falhar ? r.fulfill({ status: 500, body: "" }) : r.continue()));
  await abrir(page, "/blocos");
  await page.keyboard.press("Control+k");
  await expect(caixa(page).getByRole("alert")).toContainText("Não foi possível carregar a busca");
  falhar = false;
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(opcoes(page)).toHaveCount(17);
});

test("[SG-026] payloads na busca e no filtro do glossário não executam", async ({ page }) => {
  const dialogos: string[] = [];
  page.on("dialog", (d) => {
    dialogos.push(d.message());
    void d.dismiss();
  });
  const payloads = ["<img src=x onerror=alert(1)>", "<svg onload=alert(1)>", '"><b>x</b>', "javascript:alert(1)", "{{7*7}}", "${7*7}", "'-alert(1)-'"];
  await abrir(page);
  await page.keyboard.press("Control+k");
  for (const p of payloads) {
    await campo(page).fill(p);
    await expect(estado(page)).toHaveText(`Nenhum resultado para '${p}'`);
    expect(await caixa(page).locator("img, b, svg[onload]").count()).toBe(0);
  }
  await abrir(page, "/glossario");
  for (const p of payloads) {
    await page.getByLabel("Filtrar termos").fill(p);
    await expect(page.locator("main [role=status]")).toHaveText(`Nenhum resultado para '${p}'`);
  }
  await page.goto("/glossario#<img src=x onerror=alert(1)>");
  expect(dialogos).toEqual([]);
});

test("[CT-098] glossário: filtro, letras, nível, F5 e âncora", async ({ page }) => {
  await abrir(page, "/glossario");
  const total = await page.locator("main ul > li[id]").count();
  expect(total).toBe(41);
  const filtro = page.getByLabel("Filtrar termos");
  await filtro.fill("LIVRO  caixa");
  await expect(page.locator("#livro-caixa")).toBeVisible();
  await expect(page.locator("#scp")).toBeHidden();
  await filtro.fill("zzz");
  await expect(page.locator("main [role=status]")).toHaveText("Nenhum resultado para 'zzz'");
  await filtro.fill("  ");
  await expect(page.locator("main [role=status]")).toHaveText("Mostrando 41 de 41 termos");
  await page.getByRole("navigation", { name: "Letras do glossário" }).getByRole("link", { name: "L", exact: true }).click();
  await expect(page).toHaveURL(/#[a-z-]+$/);
  await page.reload();
  await expect(page.locator("li[id]:target")).toBeInViewport();
  await expect(page.locator("#ecf")).toContainText("O arquivo em que a empresa");
  await mudarNivel(page, "Já conheço");
  await expect(page.locator("#ecf")).toContainText("Escrituração Contábil Fiscal: informa");
});

test("[CT-099] dica do termo: mouse, foco, Esc, toque e leitor de tela", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/o-que-e");
  const termo = page.locator("main [data-termo]:visible").first();
  const id = (await termo.getAttribute("aria-describedby"))!;
  const dica = page.locator(`[id="${id}"]`);
  await expect(dica).toBeHidden();
  await expect(termo).toHaveAccessibleDescription(/\S{3,}/);
  await termo.hover();
  await expect(dica).toBeVisible();
  // O mouse pode ir até a dica sem ela sumir.
  await dica.hover();
  await page.waitForTimeout(300);
  await expect(dica).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dica).toBeHidden();
  await page.mouse.move(5, 5);
  await termo.focus();
  await expect(dica).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dica).toBeHidden();
  await termo.click();
  await expect(dica).toBeVisible();
  // Cabe na tela, em qualquer largura.
  for (const largura of [375, 768, 1440]) {
    await page.setViewportSize({ width: largura, height: 800 });
    for (const t of (await page.locator("main [data-termo]:visible").all()).slice(0, 8)) {
      await t.scrollIntoViewIfNeeded();
      await t.focus();
      const d = page.locator(`[id="${await t.getAttribute("aria-describedby")}"]`);
      await expect(d).toBeVisible();
      const r = (await d.boundingBox())!;
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width, String(largura)).toBeLessThanOrEqual(largura);
    }
  }
});

test("[SE-005] robots, sitemap e imagem de compartilhamento servidos", async ({ page }) => {
  const robots = await page.request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");
  const mapa = await (await page.request.get("/sitemap.xml")).text();
  expect((mapa.match(/<loc>/g) ?? []).length).toBeGreaterThan(400);
  const og = await page.request.get("/og.png");
  expect([og.status(), og.headers()["content-type"]]).toEqual([200, "image/png"]);
  // Uma amostra do sitemap responde de verdade.
  const urls = [...mapa.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
  for (const u of urls.filter((_, i) => i % 40 === 0)) expect((await page.request.get(u)).status(), u).toBe(200);
  expect((await page.request.get("/.well-known/security.txt")).status()).toBe(404);
  await abrir(page);
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", "noindex, nofollow");
});

for (const tema of ["light", "dark"] as const) {
  for (const largura of [375, 768, 1050, 1440]) {
    test(`[AC-014][RS-009] busca, glossário e dica: axe e rolagem, ${tema} ${largura}`, async ({ page }) => {
      test.setTimeout(90_000);
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(e.message));
      page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
      await page.addInitScript((v) => localStorage.setItem("ecf:preferencias:v1", v), JSON.stringify({ tema }));
      await page.setViewportSize({ width: largura, height: 800 });
      const checar = async (onde: string) => {
        const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(d[0], onde).toBeLessThanOrEqual(d[1]!);
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        expect(r.violations.map((v) => [v.id, v.nodes.map((n) => [n.target, n.any[0]?.message])]), onde).toEqual([]);
      };
      await abrir(page, "/glossario");
      await checar("glossário");
      await page.getByRole("button", { name: /^Buscar/ }).filter({ visible: true }).first().click();
      await campo(page).fill("lucro");
      await expect(opcoes(page).first()).toBeVisible();
      await checar("busca");
      const c = (await caixa(page).boundingBox())!;
      expect(c.x >= 0 && c.x + c.width <= largura && c.y + c.height <= 800).toBe(true);
      await page.keyboard.press("Escape");
      await abrir(page, "/importancia");
      await page.locator("main [data-termo]:visible").first().focus();
      await expect(page.locator("[role=tooltip]:visible")).toHaveCount(1);
      await checar("dica");
      expect(erros).toEqual([]);
    });
  }
}
