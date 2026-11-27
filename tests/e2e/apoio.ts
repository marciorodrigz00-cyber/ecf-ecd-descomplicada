import type { Page } from "@playwright/test";

/** Abre o painel do perfil pelo indicador da coluna; abaixo de 1024 px, pela gaveta. */
export async function abrirPerfil(page: Page) {
  const indicador = page.locator("[data-testid=indicador-perfil]:visible").first();
  if (!(await indicador.count())) await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.locator("[data-testid=indicador-perfil]:visible").first().click();
  return page.getByTestId("dialogo-perfil");
}

/** Nível e ano mudam só no painel do perfil (layout com menu lateral). */
export async function mudarNivel(page: Page, rotulo: "Já conheço" | "Estou começando") {
  const painel = await abrirPerfil(page);
  await painel.getByText(rotulo, { exact: true }).click();
  await page.keyboard.press("Escape");
}

export async function mudarAno(page: Page, ano: string) {
  const painel = await abrirPerfil(page);
  await painel.getByRole("group", { name: "Ano da ECF no perfil" }).getByRole("link", { name: ano }).click();
}
