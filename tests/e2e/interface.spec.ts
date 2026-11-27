import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function abrir(page: Page, url = "/blocos") {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
const mapa = (p: Page) => p.getByRole("group", { name: /Mapa de fluxo/ });
const no = (p: Page, id: string) => mapa(p).locator(`[data-no="${id}"]`);
const painel = (p: Page) => p.getByTestId("console-painel");
const conquista = (p: Page, id: string) => p.locator(`[data-conquista="${id}"]`);

test("[CT-073] mapa: regime, bloco, ligações e abas", async ({ page }) => {
  await abrir(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(no(page, "M")).toHaveAttribute("aria-pressed", "true");
  await expect(no(page, "P")).toHaveCount(0);
  await expect(page.getByText("Lucro líquido antes do IRPJ")).toBeVisible();
  await page.getByRole("button", { name: "Lucro presumido", exact: true }).click();
  await expect(no(page, "P")).toHaveAttribute("aria-pressed", "true");
  for (const id of ["L", "M", "N"]) await expect(no(page, id)).toHaveCount(0);
  // Cada regime mostra exatamente os blocos que a matriz não exclui, mais os dois de fora.
  for (const [nome, total] of [["Lucro real", 15], ["Lucro presumido", 14], ["Lucro arbitrado", 12], ["Imune", 14], ["Isenta", 14]] as const) {
    await page.getByRole("button", { name: nome, exact: true }).dblclick();
    await expect(mapa(page).locator("[data-no]"), nome).toHaveCount(total);
  }
  await page.getByRole("button", { name: "Lucro real", exact: true }).click();
  await no(page, "ECD").click();
  await expect(painel(page)).toContainText("Vem de fora do arquivo");
  await no(page, "N").click();
  await page.getByRole("button", { name: "Em cada regime" }).click();
  await expect(page.getByText("Só no lucro real e nas formas mistas com lucro real.")).toBeVisible();
  await page.getByRole("button", { name: /Erros comuns/ }).click();
  await page.getByRole("button", { name: "Ligações" }).click();
  await page.getByRole("button", { name: "Ir para bloco Y" }).click();
  await expect(no(page, "Y")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Abrir o bloco Y" }).click();
  await expect(page).toHaveURL(/\/blocos\/y$/);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Blocos e preenchimento");
  await expect(page.getByRole("heading", { name: "Como os dados percorrem a ECF" })).toBeVisible();
});

test("[CT-074] registro aberto no mapa mostra o que é e o exemplo, campo a campo", async ({ page }) => {
  await abrir(page);
  await no(page, "0").click();
  await page.getByRole("button", { name: /^Registros \(/ }).click();
  const r = page.getByTestId("registro-aberto");
  const cartao = page.locator('[data-registro="0000"]');
  await cartao.click();
  await expect(cartao).toHaveAttribute("aria-expanded", "true");
  await expect(r.getByRole("heading", { name: /0000/ })).toBeFocused();
  await expect(r).toContainText("identifica unicamente uma escrituração");
  await expect(r).toContainText("MÓVEIS AURORA LTDA");
  await expect(r).toContainText("99999999000100");
  await expect(r).toContainText("fictícios");
  await r.getByRole("button", { name: "Exemplo do Manual" }).click();
  await expect(r).toContainText("EMPRESA TESTE");
  await page.locator('[data-registro="0010"]').click();
  await expect(r).toContainText("Parâmetros de Tributação");
  await r.getByRole("button", { name: "Exemplo do Manual" }).click();
  await expect(r).toContainText("Forma de tributação do lucro (1 = Lucro Real).");
  await r.getByRole("button", { name: "Fechar" }).click();
  await expect(r.locator("section")).toHaveCount(0);
  // Sem exemplo no Manual: linha montada pelo site, com o que falta avisado.
  await no(page, "C").click();
  await page.locator('[data-registro="C040"]').click();
  await expect(r).toContainText("Linha ilustrativa, com números fictícios.");
  await expect(r).toContainText("A verificar: COD_VER_LC");
  // Só dois registros seguem sem exemplo, e dizem por quê.
  await no(page, "Y").click();
  await page.locator('[data-registro="Y750"]').click();
  await expect(r).toContainText("O programa preenche este registro sozinho");
  await r.getByRole("link", { name: /Todos os campos e regras do Y750/ }).click();
  await expect(page).toHaveURL(/\/blocos\/y\/y750$/);
});

test("[CT-075] falha ao buscar o exemplo avisa e permite tentar de novo", async ({ page }) => {
  let falhar = true;
  await page.route("**/dados/2025/m.json", (rota) => (falhar ? rota.fulfill({ status: 500, body: "x" }) : rota.continue()));
  await abrir(page);
  await page.getByRole("button", { name: /^Registros \(/ }).click();
  await page.locator('[data-registro="M300"]').click();
  const r = page.getByTestId("registro-aberto");
  await expect(r.getByRole("alert")).toContainText("Não foi possível carregar");
  falhar = false;
  await r.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(r).toContainText("Exemplo preenchido");
  await expect(r).toContainText("|M300|");
});

test("[CT-076] ano 2024 traz o leiaute 11, sem exemplo fictício", async ({ page }) => {
  await abrir(page, "/ac/2024/blocos");
  await expect(page.getByTestId("selo")).toContainText("leiaute 11");
  await no(page, "0").click();
  await page.getByRole("button", { name: /^Registros \(/ }).click();
  await page.locator('[data-registro="0000"]').click();
  const r = page.getByTestId("registro-aberto");
  await expect(r).toContainText("Transcrito do Manual");
  await expect(r).not.toContainText("AURORA");
  await expect(r.getByRole("link", { name: /Todos os campos/ })).toHaveAttribute("href", "/ac/2024/blocos/0/0000");
});

test("[CT-077] percurso: anda, pausa, volta, termina e vira conquista", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await abrir(page);
  await page.getByRole("button", { name: "Percorrer passo a passo" }).click();
  const p = page.getByTestId("percurso");
  await expect(p).toHaveText("1 de 13");
  // Com menos movimento, não anda sozinho.
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Passo anterior" })).toBeDisabled();
  for (let i = 2; i <= 13; i++) {
    await page.getByRole("button", { name: "Próximo passo" }).click();
    await expect(p).toHaveText(`${i} de 13`);
  }
  await expect(page.getByRole("button", { name: "Próximo passo" })).toBeDisabled();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(p).toHaveCount(0);
  // As conquistas ficam em “Meu progresso” (etapa 2).
  await abrir(page, "/meu-progresso");
  await expect(conquista(page, "percurso")).toHaveAttribute("data-feita", "true");
  await page.reload();
  await expect(conquista(page, "percurso")).toHaveAttribute("data-feita", "true");
});

test("[CT-078] percurso automático respeita a pausa", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await abrir(page);
  await page.getByRole("button", { name: "Percorrer passo a passo" }).click();
  await expect(page.getByTestId("percurso")).toHaveText("2 de 13", { timeout: 8000 });
  await page.getByRole("button", { name: "Pausar" }).click();
  await page.waitForTimeout(4600);
  await expect(page.getByTestId("percurso")).toHaveText("2 de 13");
});

test("[CT-079] conquistas somam uso de verdade e ficam no navegador", async ({ page }) => {
  await abrir(page, "/simulador");
  await page.getByLabel("Adições (R$)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Marcar como estudada" }).click();
  await abrir(page, "/blocos/m/m300");
  await abrir(page, "/meu-progresso");
  for (const id of ["simulador", "primeiro-passo"]) await expect(conquista(page, id)).toHaveAttribute("data-feita", "true");
  await expect(conquista(page, "registros")).toContainText("1 de 10");
  await expect(page.getByRole("progressbar", { name: /conquistas/ })).toHaveAttribute("aria-valuenow", "2");
  await page.evaluate(() => localStorage.setItem("ecf:preferencias:v1", "{lixo"));
  await page.reload();
  // Preferências ilegíveis: volta ao começo, sem contador em zero.
  await expect(page.getByTestId("sem-progresso")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /conquistas/ })).toHaveCount(0);
});

test("[CT-080] teclas de atalho: funcionam, não atrapalham campos e podem ser desligadas", async ({ page }) => {
  await abrir(page, "/");
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/simulador$/);
  await page.getByLabel("Adições (R$)", { exact: true }).press("q");
  await expect(page).toHaveURL(/\/simulador$/);
  await abrir(page, "/ac/2024");
  await page.keyboard.press("Control+g");
  await expect(page).toHaveURL(/\/ac\/2024$/);
  await page.keyboard.press("q");
  await expect(page).toHaveURL(/\/ac\/2024\/quem-deve-entregar$/);
  await abrir(page, "/meu-progresso");
  await page.getByLabel("Usar teclas de atalho").uncheck();
  await abrir(page, "/");
  await page.keyboard.press("s");
  await page.waitForTimeout(400);
  await expect(page).toHaveURL(/4173\/$/);
});

test("[AC-013] mapa só por teclado", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page);
  await no(page, "M").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-no]:focus")).toHaveAttribute("aria-pressed", "true");
  const depois = await page.locator("[data-no]:focus").getAttribute("data-no");
  expect(depois).not.toBe("M");
  await page.keyboard.press("ArrowLeft");
  await expect(no(page, "M")).toBeFocused();
  await page.getByRole("button", { name: /^Registros \(/ }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.hasAttribute("data-registro"))).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("registro-aberto").getByRole("heading").first()).toBeFocused();
});

for (const tema of ["light", "dark"] as const) {
  for (const largura of [375, 768, 1050, 1280, 1440]) {
    test(`[AC-013][RS-008] mapa e registro aberto: axe, rolagem e sobreposição, ${tema} ${largura}`, async ({ page }) => {
      test.setTimeout(120_000);
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(e.message));
      page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
      await page.addInitScript(
        (v) => localStorage.setItem("ecf:preferencias:v1", v),
        JSON.stringify({ nivel: "iniciante", tema, ano: null, estudadas: [], roteiro: null }),
      );
      await page.setViewportSize({ width: largura, height: 900 });
      await abrir(page);
      for (const regime of ["Lucro real", "Lucro presumido", "Imune"]) {
        await page.getByRole("button", { name: regime, exact: true }).click();
        const problemas = await mapa(page).evaluate((m) => {
          const fora = m.getBoundingClientRect();
          const cx = [...m.querySelectorAll<HTMLElement>("[data-no]")].map((e) => ({ id: e.dataset.no, r: e.getBoundingClientRect() }));
          const p: string[] = [];
          cx.forEach((a, i) => {
            if (a.r.left < fora.left - 1 || a.r.right > fora.right + 1 || a.r.bottom > fora.bottom + 1 || a.r.top < fora.top - 1) p.push(`${a.id} sai do mapa`);
            cx.slice(i + 1).forEach((b) => {
              if (a.r.left < b.r.right && b.r.left < a.r.right && a.r.top < b.r.bottom && b.r.top < a.r.bottom) p.push(`${a.id} sobre ${b.id}`);
            });
          });
          return p;
        });
        expect(problemas, regime).toEqual([]);
      }
      await page.getByRole("button", { name: "Lucro real", exact: true }).click();
      await no(page, "0").click();
      await page.getByRole("button", { name: /^Registros \(/ }).click();
      await page.locator('[data-registro="0000"]').click();
      await expect(page.getByTestId("registro-aberto")).toContainText("AURORA");
      const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(d[0]).toBeLessThanOrEqual(d[1]!);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(r.violations.map((v) => [v.id, v.nodes.map((n) => [n.target, n.any[0]?.message])])).toEqual([]);
      expect(erros).toEqual([]);
    });
  }
}
