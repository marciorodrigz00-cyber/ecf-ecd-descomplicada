import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const EXEMPLOS = ["lucro-real", "lucro-presumido", "isenta"];
async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
async function preparar(page: Page, tema = "light", nivel = "profissional") {
  await page.addInitScript(
    (v) => localStorage.setItem("ecf:preferencias:v1", v),
    JSON.stringify({ nivel, tema, ano: null, estudadas: [], roteiro: null }),
  );
}
const passo = (page: Page, id: string) => page.locator(`[data-passo="${id}"] [data-valor]`);
const campo = (page: Page, rotulo: string) => page.getByLabel(`${rotulo} (R$)`, { exact: true });

test("[CT-056] simulador: resultado, troca de regime e memória de cálculo", async ({ page }) => {
  await abrir(page, "/simulador");
  const res = page.getByTestId("sim-resultado");
  await expect(res).toContainText("R$ 26.200,00");
  await expect(res).toContainText("R$ 11.592,00");
  await expect(passo(page, "M300-compensado")).toHaveText("R$ 55.200,00");
  await expect(passo(page, "M300-saldo")).toHaveText("R$ 10.800,00");
  await campo(page, "Adições").fill("1.000,00");
  await expect(passo(page, "M300-ajustado")).toHaveText("R$ 185.000,00");
  await expect(passo(page, "M350-ajustado")).toHaveText("R$ 185.000,00");
  await page.getByLabel("Usar os mesmos ajustes na CSLL").uncheck();
  await expect(passo(page, "M350-ajustado")).toHaveText("R$ 189.000,00");
  await page.getByLabel("Lucro presumido").check();
  await expect(res).toContainText("R$ 8.400,00");
  await expect(res).toContainText("R$ 7.056,00");
  await page.getByLabel("Meses de atividade no trimestre").selectOption("1");
  await expect(passo(page, "irpj-adicional")).toHaveText("R$ 4.240,00");
});

test("[CT-057] simulador: zero, negativo, erro e botões repetidos", async ({ page }) => {
  await abrir(page, "/simulador");
  const res = page.getByTestId("sim-resultado");
  await page.getByRole("button", { name: "Limpar" }).dblclick();
  await expect(res).toContainText("R$ 0,00");
  const lucro = campo(page, "Lucro antes do IRPJ e da CSLL");
  await lucro.fill("-50000");
  await expect(passo(page, "M300-base")).toHaveText("-R$ 50.000,00");
  await expect(page.locator('[data-passo="M300-base"]')).toContainText("Prejuízo fiscal do período");
  await expect(passo(page, "irpj-pagar")).toHaveText("R$ 0,00");
  await lucro.fill("abc");
  await expect(lucro).toHaveAttribute("aria-invalid", "true");
  await expect(res).toContainText("Corrija os campos marcados");
  await lucro.fill("10000");
  await campo(page, "Exclusões").fill("-1");
  await expect(page.getByText("Este campo não aceita valor negativo.")).toBeVisible();
  await campo(page, "Exclusões").fill("");
  await campo(page, "Imposto de renda retido na fonte").fill("2000");
  await expect(res).toContainText("-R$ 500,00");
  await expect(res).toContainText("Saldo negativo");
  await page.getByRole("button", { name: "Usar o exemplo" }).dblclick();
  await expect(res).toContainText("R$ 26.200,00");
});

test("[CT-058] exemplos: lista, página, F5 e Voltar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, "/exemplos");
  await page.getByRole("link", { name: /Móveis Aurora/ }).click();
  await expect(page).toHaveURL(/\/exemplos\/lucro-real$/);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Móveis Aurora Ltda.");
  await expect(page.getByRole("navigation", { name: "Você está em" }).locator("[aria-current=page]")).toHaveText("Lucro real");
  const m300 = page.locator("[data-registro=M300]");
  await m300.locator("summary").click();
  await expect(m300.getByText("128800,00")).toBeVisible();
  await expect(m300.getByText(/Usa o saldo anterior até o limite de R\$\s55\.200,00/)).toBeVisible();
  await m300.getByRole("link", { name: "Ver o leiaute do M300" }).click();
  await expect(page).toHaveURL(/\/blocos\/m\/m300$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/exemplos\/lucro-real$/);
});

test("[CT-059] exemplos avisam quando o ano é outro, e o simulador vale para os dois", async ({ page }) => {
  await abrir(page, "/ac/2024/exemplos/isenta");
  await expect(page.getByText("Os exemplos usam o leiaute 12")).toBeVisible();
  await page.getByRole("link", { name: "Ver no ano-calendário 2025" }).click();
  await expect(page).toHaveURL(/\/exemplos\/isenta$/);
  await abrir(page, "/ac/2024/simulador");
  await expect(page.getByTestId("sim-resultado")).toContainText("R$ 26.200,00");
  await expect(page.getByText("regras do ano-calendário 2024")).toBeVisible();
});

test("[CN-029] avisos de fictício em todos os exemplos", async ({ page }) => {
  for (const s of EXEMPLOS) {
    await abrir(page, `/exemplos/${s}`);
    await expect(page.locator("main")).toContainText("fictícios, só para estudo");
    await expect(page.locator("main")).toContainText("não substitui orientação de profissional contábil");
  }
});

test("[SG-010] payloads nos campos do simulador não executam", async ({ page }) => {
  const dialogos: string[] = [];
  page.on("dialog", (d) => {
    dialogos.push(d.message());
    void d.dismiss();
  });
  await abrir(page, "/simulador");
  for (const p of ["<img src=x onerror=alert(1)>", "<svg onload=alert(1)>", '"><b>', "javascript:alert(1)", "{{7*7}}", "${7*7}"]) {
    await campo(page, "Adições").fill(p);
    await expect(campo(page, "Adições")).toHaveAttribute("aria-invalid", "true");
    expect(await page.locator("main img, main b, main svg[onload]").count()).toBe(0);
  }
  expect(dialogos).toEqual([]);
});

test("[AC-010] simulador só por teclado", async ({ page }) => {
  await abrir(page, "/simulador");
  await page.getByLabel("Lucro real").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByLabel("Lucro presumido")).toBeChecked();
  await campo(page, "Receita de serviços em geral").focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.type("0");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/simulador$/);
  await expect(passo(page, "irpj-base")).toHaveText("R$ 40.000,00");
});

for (const tema of ["light", "dark"] as const) {
  for (const largura of [375, 768, 1050, 1440]) {
    test(`[AC-011][RS-006] exemplos e simulador: axe, rolagem e alvos, ${tema} ${largura}`, async ({ page }) => {
      test.setTimeout(180_000);
      await preparar(page, tema);
      await page.setViewportSize({ width: largura, height: 900 });
      for (const url of ["/exemplos", "/simulador", ...EXEMPLOS.map((s) => `/exemplos/${s}`)]) {
        await abrir(page, url);
        if (url === "/simulador") {
          await campo(page, "Adições").fill("x");
          await campo(page, "Adições").blur();
        }
        for (const s of await page.locator("main details > summary").all()) if ((await s.isVisible()) && largura !== 768) await s.click();
        const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(d[0], `${url} ${d}`).toBeLessThanOrEqual(d[1]!);
        const pequenos = await page.evaluate(() =>
          [...document.querySelectorAll("main a[href],main button,main select,main summary,main label:has(input)")]
            .map((e) => ({ t: e.textContent?.trim().slice(0, 40), r: e.getBoundingClientRect() }))
            .filter((x) => x.r.width > 2 && x.r.height > 2 && (x.r.width < 24 || x.r.height < 24))
            .map((x) => `${x.t} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`),
        );
        expect(pequenos, url).toEqual([]);
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 160)}`), url).toEqual([]);
      }
    });
  }
}
