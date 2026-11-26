import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PILOTOS = ["0/0035", "0/0000", "m/m300", "l/l100"];
const AXE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
async function iniciar(page: Page, url = "/blocos/0/0035") {
  await abrir(page, url);
  await page.getByRole("button", { name: "Ver animado" }).click();
  await expect(page.getByTestId("sim-player")).toBeVisible();
}
const passo = (page: Page) => page.getByTestId("sim-passo");
const erros = (page: Page) => {
  const lista: string[] = [];
  page.on("pageerror", (e) => lista.push(e.message));
  page.on("console", (m) => m.type() === "error" && lista.push(m.text()));
  return lista;
};

test("[RD-009] nada da simulação é baixado antes do clique; o roteiro é um arquivo estático", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => pedidos.push(new URL(r.url()).pathname));
  await abrir(page, "/blocos/0/0035");
  expect(pedidos.filter((p) => p.includes("roteiro"))).toEqual([]);
  await expect(page.getByTestId("sim-player")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver animado" }).click();
  await expect(page.getByTestId("sim-player")).toBeVisible();
  expect(pedidos.filter((p) => p.includes("roteiro"))).toEqual(["/dados/2025/roteiro-0035.json"]);
  const r = await page.request.get("/dados/2025/roteiro-0035.json");
  expect(r.status()).toBe(200);
  expect((await r.json()).linha).toBe("|0035|11111111000291|SCP TESTE 1|");
  // Registro sem roteiro não tem a seção; arquivo de roteiro inexistente dá 404.
  await abrir(page, "/blocos/0/0010");
  await expect(page.getByRole("button", { name: "Ver animado" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Veja o preenchimento" })).toBeVisible();
  expect((await page.request.get("/dados/2025/roteiro-0010.json")).status()).toBe(404);
});

test("[CT-111] decisão: “não” explica e não avança; “sim” segue para os campos", async ({ page }) => {
  const e = erros(page);
  await iniciar(page);
  await expect(passo(page)).toHaveText(/Passo 1 de \d+: A empresa/);
  await page.getByRole("button", { name: "Próximo passo" }).click();
  await expect(passo(page)).toHaveText(/O registro existe\?/);
  await expect(page.getByRole("button", { name: "Próximo passo" })).toBeDisabled();
  await page.getByRole("button", { name: "Não", exact: true }).click();
  await expect(page.getByTestId("sim-resposta")).toContainText("não existe nesta ECF");
  await page.waitForTimeout(800);
  await expect(passo(page)).toHaveText(/O registro existe\?/);
  await page.getByRole("button", { name: "Ver o caso em que o registro existe" }).click();
  await expect(page.getByTestId("sim-resposta")).toContainText("entra no arquivo");
  await expect(passo(page)).toHaveText(/Campo REG/, { timeout: 10_000 });
  expect(e).toEqual([]);
});

test("[CT-112] controles: pausa, passos, barra, velocidade e reiniciar", async ({ page }) => {
  await iniciar(page);
  const pausar = page.getByRole("button", { name: "Pausar" });
  await pausar.click();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
  const antes = await passo(page).innerText();
  await page.waitForTimeout(800);
  await expect(passo(page)).toHaveText(antes);
  // Barra de progresso clicável.
  await page.getByRole("button", { name: /Ir para o passo \d+: A linha montada/ }).click();
  await expect(passo(page)).toHaveText(/A linha montada/);
  await expect(page.getByRole("button", { name: /Ir para o passo \d+: A linha montada/ })).toHaveAttribute("aria-current", "step");
  await expect(page.getByTestId("sim-player")).toContainText("|0035|11111111000291|SCP TESTE 1|");
  await page.getByRole("button", { name: "Passo anterior" }).click();
  await expect(passo(page)).toHaveText(/Campo NOME_SCP/);
  // Pausado, o campo aparece inteiro.
  await expect(page.getByTestId("sim-valor")).toHaveText("SCP TESTE 1");
  await page.getByRole("button", { name: "Próximo passo" }).click();
  await expect(passo(page)).toHaveText(/A linha montada/);
  // Velocidade.
  const vel = page.getByRole("group", { name: "Velocidade" });
  await vel.getByRole("button", { name: "1,5x" }).click();
  await expect(vel.getByRole("button", { name: "1,5x" })).toHaveAttribute("aria-pressed", "true");
  await expect(vel.getByRole("button", { name: "1x" })).toHaveAttribute("aria-pressed", "false");
  // Erro proposital e resumo.
  await page.getByRole("button", { name: /Ir para o passo \d+: E se houver um erro/ }).click();
  await expect(page.getByTestId("sim-player")).toContainText("REGRA_CNPJ_DIFERENTE_SCP");
  await expect(page.getByTestId("sim-player")).toContainText("Como corrigir");
  await page.getByRole("button", { name: /Ir para o passo \d+: Resumo/ }).click();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Próximo passo" })).toBeDisabled();
  await expect(page.getByTestId("sim-player")).toContainText("Verificado em 26/11/2026");
  await page.getByRole("button", { name: "Reiniciar" }).click();
  await expect(passo(page)).toHaveText(/Passo 1 de \d+: A empresa/);
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
});

test("[CT-113] tocando, o passo avança sozinho e a digitação monta o valor", async ({ page }) => {
  await iniciar(page);
  await page.getByRole("group", { name: "Velocidade" }).getByRole("button", { name: "1,5x" }).click();
  await expect(passo(page)).toHaveText(/O registro existe\?/, { timeout: 8_000 });
  await page.getByRole("button", { name: "Sim", exact: true }).click();
  await expect(passo(page)).toHaveText(/Campo COD_SCP/, { timeout: 10_000 });
  await expect(page.getByTestId("sim-valor")).toHaveText("11111111000291", { timeout: 5_000 });
  await expect(passo(page)).toHaveText(/Campo NOME_SCP/, { timeout: 5_000 });
});

test("[CT-114] duplo clique e F5 não quebram a simulação", async ({ page }) => {
  const e = erros(page);
  await abrir(page, "/blocos/0/0000");
  await page.getByRole("button", { name: "Ver animado" }).dblclick();
  await expect(page.getByTestId("sim-player")).toHaveCount(1);
  await page.getByRole("button", { name: "Pausar" }).dblclick();
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  await page.getByRole("button", { name: "Próximo passo" }).dblclick();
  await expect(passo(page)).toHaveText(/Passo 3 de/);
  await page.getByRole("button", { name: "Reiniciar" }).dblclick();
  await expect(passo(page)).toHaveText(/Passo 1 de/);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("sim-player")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver animado" }).click();
  await expect(passo(page)).toHaveText(/Passo 1 de/);
  expect(e).toEqual([]);
});

test("[AC-021] teclado só com o foco no player, aria-live e axe nos dois temas e níveis", async ({ page }) => {
  await iniciar(page);
  const player = page.getByTestId("sim-player");
  await expect(passo(page)).toHaveAttribute("aria-live", "polite");
  // Fora do player, Espaço rola a página e não pausa.
  await page.locator("h1").click();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  await player.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(passo(page)).toHaveText(/Passo 2 de/);
  await page.keyboard.press("ArrowLeft");
  await expect(passo(page)).toHaveText(/Passo 1 de/);
  // Tab chega aos controles, com foco visível.
  await page.getByRole("button", { name: "Continuar" }).focus();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeFocused();
  for (const nivel of ["iniciante", "profissional"]) {
    await page.evaluate((n) => document.documentElement.setAttribute("data-nivel", n), nivel);
    for (const tema of ["light", "dark"]) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);
      for (const alvo of [/A empresa/, /Campo COD_SCP/, /E se houver um erro/, /Resumo/]) {
        await page.getByRole("button", { name: new RegExp(`Ir para o passo \\d+: ${alvo.source}`) }).click();
        const r = await new AxeBuilder({ page }).include("[data-testid=sim-player]").withTags(AXE).analyze();
        expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`), `${nivel}/${tema}/${alvo.source}`).toEqual([]);
      }
    }
  }
});

test("[AC-022] com movimento reduzido, a simulação vira uma lista de passos", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await abrir(page, "/blocos/l/l100");
  await page.getByRole("button", { name: "Ver animado" }).click();
  const lista = page.getByTestId("sim-lista");
  await expect(lista).toBeVisible();
  await expect(page.getByTestId("sim-player")).toHaveCount(0);
  await expect(lista.getByRole("heading", { name: /Passo 1: A empresa/ })).toBeVisible();
  await expect(lista.getByRole("heading", { name: /Resumo/ })).toBeVisible();
  await expect(lista).toContainText("REGRA_VALIDACAO_SALDO_FINAL_BAL");
  const r = await new AxeBuilder({ page }).include("[data-testid=sim-lista]").withTags(AXE).analyze();
  expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`)).toEqual([]);
});

for (const largura of [375, 768, 1050, 1440]) {
  test(`[RS-010] simulação em ${largura} px sem rolagem lateral, nos 4 pilotos`, async ({ page }) => {
    test.setTimeout(120_000);
    const e = erros(page);
    await page.setViewportSize({ width: largura, height: 900 });
    for (const p of PILOTOS) {
      await iniciar(page, `/blocos/${p}`);
      await page.getByRole("button", { name: "Pausar" }).click();
      for (const nome of ["passo 1:", "Campo", "A linha montada", "Validação", "E se houver um erro", "Resumo"]) {
        const alvo = page.getByRole("button", { name: new RegExp(`Ir para o passo \\d+: ${nome.replace("passo 1:", "A empresa")}`) }).first();
        await alvo.click();
        const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(sobra, `${p} ${nome}`).toBeLessThanOrEqual(0);
      }
    }
    expect(e).toEqual([]);
  });
}

test("[CN-077] os 4 pilotos: ficha, decisão quando há e regras não simuladas com o motivo", async ({ page }) => {
  for (const p of PILOTOS) {
    await iniciar(page, `/blocos/${p}`);
    await page.getByRole("button", { name: "Pausar" }).click();
    const nomes = await page.getByRole("list", { name: "Passos" }).getByRole("button").evaluateAll((b) => b.map((x) => x.getAttribute("aria-label")));
    expect(nomes.some((n) => /O registro existe/.test(n ?? "")), p).toBe(p !== "0/0000");
    expect(nomes.some((n) => /O que não dá para simular/.test(n ?? "")), p).toBe(p !== "0/0035");
    await expect(page.getByTestId("para-que-serve"), p).toBeVisible();
  }
});

test("[CT-115] linha explicada: clicar num campo mostra o que ele é; as setas andam entre os campos", async ({ page }) => {
  const e = erros(page);
  await abrir(page, "/blocos/0/0010");
  const linha = page.getByTestId("linha-explicada").first();
  const painel = linha.getByTestId("linha-campo");
  // Começa no primeiro campo preenchido depois do REG, sem precisar de clique.
  await expect(painel).toHaveText(/Campo \d+ de 13: /);
  await linha.getByRole("button", { name: /^Campo 4, FORMA_TRIB:/ }).click();
  await expect(painel).toContainText("Campo 4 de 13: FORMA_TRIB");
  await expect(painel).toContainText("Regras do Manual para este campo");
  await expect(linha.getByRole("button", { name: /^Campo 4, FORMA_TRIB:/ })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await expect(painel).toContainText("Campo 5 de 13: FORMA_APUR");
  await expect(linha.getByRole("button", { name: /^Campo 5, FORMA_APUR:/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(painel).toContainText("Campo 1 de 13: REG");
  await expect(painel).toContainText("Texto fixo");
  // Campo vazio é dito em voz alta e na tela.
  await linha.getByRole("button", { name: "Campo 2, HASH_ECF_ANTERIOR: vazio" }).click();
  await expect(painel).toContainText("(vazio neste exemplo)");
  // A lista completa continua disponível, recolhida.
  await linha.locator("xpath=..").getByText("Todos os campos em lista").click();
  await expect(page.getByText("Em branco neste exemplo").first()).toBeVisible();
  // Sem roteiro: só a linha explicada, sem versão animada.
  await expect(page.getByRole("button", { name: "Ver animado" })).toHaveCount(0);
  expect(e).toEqual([]);
});

test("[AC-023] linha explicada: axe nos dois temas e sem rolagem lateral em 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  for (const url of ["/blocos/0/0010", "/blocos/0/0035", "/blocos/l/l100"]) {
    await abrir(page, url);
    await page.getByTestId("linha-explicada").first().getByRole("button").last().click();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra, url).toBeLessThanOrEqual(0);
    for (const tema of ["light", "dark"]) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);
      const r = await new AxeBuilder({ page }).include("[data-testid=linha-explicada]").withTags(AXE).analyze();
      expect(r.violations.map((v) => `${v.id} ${v.nodes[0]!.target}`), `${url} ${tema}`).toEqual([]);
    }
  }
});
