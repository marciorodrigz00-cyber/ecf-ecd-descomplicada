import { defineConfig } from "@playwright/test";

const PORTA = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  workers: 2,
  fullyParallel: true,
  timeout: 60_000,
  reporter: [["list"], ["json", { outputFile: "test-results/playwright.json" }]],
  outputDir: "test-results/artefatos",
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    channel: "chrome",
    locale: "pt-BR",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tools/servidor-local.ts",
      url: `http://127.0.0.1:${PORTA}`,
      env: { PORTA: String(PORTA) },
      reuseExistingServer: false,
    },
    {
      command: "node tools/servidor-local.ts",
      url: `http://127.0.0.1:${PORTA + 1}`,
      env: { PORTA: String(PORTA + 1), CSP_REPORT_ONLY: "1" },
      reuseExistingServer: false,
    },
  ],
});
