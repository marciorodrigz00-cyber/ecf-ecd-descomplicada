import AxeBuilder from "@axe-core/playwright";
import { request as httpRequest } from "node:http";
import { expect, test, type Page } from "@playwright/test";

const SECOES = ["o-que-e", "importancia", "quem-deve-entregar", "blocos", "exemplos", "simulador", "novidades", "glossario"];
const CHAVE = "ecf:preferencias:v1";
async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

test("[RD-006] armazenamento cheio ou bloqueado não quebra o site", async ({ page }) => {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  // Cheio: ler funciona, gravar falha.
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("cheio", "QuotaExceededError");
    };
  });
  await abrir(page, "/simulador");
  await page.getByRole("button", { name: "Marcar como estudada" }).click();
  await expect(page.getByRole("button", { name: "Seção estudada" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Alternar entre tema/ }).first().click();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("combobox", { name: "Buscar" })).toBeFocused();
  // Bloqueado: até ler falha.
  const outra = await page.context().newPage();
  outra.on("pageerror", (e) => erros.push(e.message));
  await outra.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("bloqueado", "SecurityError"); } });
  });
  await abrir(outra, "/blocos");
  await outra.locator('[data-no="K"]').click();
  await expect(outra.locator('[data-no="K"]')).toHaveAttribute("aria-pressed", "true");
  await expect(outra.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(erros).toEqual([]);
});

test("[RD-006] preferências ocupam pouco, mesmo com tudo visitado", async ({ page }) => {
  await abrir(page, "/");
  await page.evaluate((k) => {
    const registros = Array.from({ length: 1000 }, (_, i) => `M${String(i).padStart(3, "0")}`);
    localStorage.setItem(k, JSON.stringify({ registros, blocos: [..."0CEJKLMNPQTUVWXY9"], estudadas: ["blocos"], feitos: ["quiz"] }));
  }, CHAVE);
  await abrir(page, "/blocos");
  await page.locator('[data-no="K"]').click();
  const bytes = await page.evaluate((k) => localStorage.getItem(k)!.length, CHAVE);
  expect(bytes).toBeLessThan(10_000);
});

test("[RD-007] nenhum recurso pedido duas vezes nas páginas principais", async ({ page, browser }, info) => {
  test.setTimeout(120_000);
  void page;
  const medidas: string[] = [];
  for (const url of ["/", ...SECOES.map((s) => `/${s}`), "/blocos/m", "/blocos/m/m300", "/exemplos/lucro-real"]) {
    const c = await browser.newContext();
    const p = await c.newPage();
    const pedidos: string[] = [];
    const corpos: Promise<number>[] = [];
    p.on("response", (r) => {
      pedidos.push(`${r.request().method()} ${r.url()}`);
      corpos.push(r.body().then((b) => b.length, () => 0));
    });
    await abrir(p, url);
    expect(pedidos.filter((x, i) => pedidos.indexOf(x) !== i), url).toEqual([]);
    expect(pedidos.filter((x) => !x.includes("127.0.0.1")), url).toEqual([]);
    medidas.push(`${url}: ${pedidos.length} req, ${((await Promise.all(corpos)).reduce((a, b) => a + b, 0) / 1e6).toFixed(2).replace(".", ",")} MB`);
    await c.close();
  }
  info.annotations.push({ type: "medida", description: medidas.join("; ") });
});

test("[SG-029] rajada de 20 leituras e caminhos malformados", async () => {
  const pedir = (caminho: string, metodo = "GET") =>
    new Promise<number>((ok, erro) => {
      const r = httpRequest({ host: "127.0.0.1", port: 4173, path: caminho, method: metodo }, (res) => {
        res.resume();
        ok(res.statusCode!);
      });
      r.on("error", erro);
      r.end();
    });
  expect(await Promise.all(Array.from({ length: 20 }, () => pedir("/dados/2025/busca.json", "HEAD")))).toEqual(Array(20).fill(200));
  for (const c of ["/dados/2025/../../package.json", "/dados/%2e%2e/%2e%2e/package.json", "/dados/2025/..%2f..%2fpackage.json", "/%0d%0aSet-Cookie:x=1", "/dados/2025/m.json%00.html"]) expect([400, 404], c).toContain(await pedir(c));
  for (const c of ["/dados/2025/s.json", "/dados/2019/m.json", "/dados/2025/", "/monitor/estado.json", "/.claude/settings.json", "/CLAUDE.md", "/content/fontes.json", "/.git/config", "/.env"]) expect(await pedir(c), c).toBe(404);
  for (const m of ["POST", "PUT", "DELETE", "PATCH"]) expect(await pedir("/dados/2025/m.json", m), m).toBe(405);
});

test("[AC-016] foco visível em todo controle, por teclado", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const url of ["/", "/simulador", "/glossario", "/novidades", "/quem-deve-entregar", "/blocos/m/m300"]) {
    await abrir(page, url);
    const sem: string[] = [];
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement | null;
        if (!e || e === document.body) return null;
        const temAnel = (x: Element | null) => {
          if (!x) return false;
          const s = getComputedStyle(x);
          return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
        };
        // Em rádio e caixa, o anel pode ficar no rótulo que os envolve.
        const rotulo = e.matches("input[type=radio],input[type=checkbox]") ? e.closest("label") : null;
        const alvo = temAnel(e) || !rotulo ? e : rotulo;
        const anel = temAnel(alvo);
        const c = alvo.getBoundingClientRect();
        return { ok: anel && c.width > 0 && c.height > 0, qual: `${alvo.tagName} ${alvo.textContent?.trim().slice(0, 30)}` };
      });
      if (!r) break;
      if (!r.ok) sem.push(r.qual);
    }
    expect(sem, url).toEqual([]);
  }
});

for (const tema of ["light", "dark"] as const) {
  test(`[AC-017] axe em toda página que não é de registro, e em amostra de registros, ${tema}`, async ({ page }) => {
    test.setTimeout(600_000);
    await page.addInitScript(([k, v]) => localStorage.setItem(k!, v!), [CHAVE, JSON.stringify({ tema, nivel: tema === "dark" ? "profissional" : "iniciante" })]);
    const mapa = await (await page.request.get("/sitemap.xml")).text();
    const urls = [...mapa.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
    const registro = /\/blocos\/\w\/\w{4}$/;
    const alvo = [...urls.filter((u) => !registro.test(u)), ...urls.filter((u) => registro.test(u)).filter((_, i) => i % 14 === 0)];
    expect(alvo.length).toBeGreaterThan(90);
    const falhas: string[] = [];
    for (const u of alvo) {
      await page.goto(u, { waitUntil: "load" });
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      for (const v of r.violations) falhas.push(`${u}: ${v.id} ${v.nodes[0]!.target}`);
    }
    expect(falhas).toEqual([]);
  });
}
