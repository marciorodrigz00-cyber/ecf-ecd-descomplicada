import { describe, expect, it } from "vitest";
import { interpretar } from "@/lib/preferencias/modelo";
import { prazoDoAno, recentes, situacaoDoPrazo } from "@/lib/prazo";

const PRAZOS = [2024, 2025].map((ac) => ({ ac, data: prazoDoAno(ac) }));

describe("[CT-127] prazo da home pela regra geral", () => {
  it("[CT-127] último dia de semana de julho do ano seguinte", () => {
    expect(prazoDoAno(2024)).toBe("2025-07-31"); // quinta
    expect(prazoDoAno(2025)).toBe("2026-07-31"); // sexta
    expect(prazoDoAno(2026)).toBe("2027-07-30"); // 31/07/2027 é sábado
    expect(prazoDoAno(2027)).toBe("2028-07-31"); // segunda
  });
  it("[CT-127] conta os dias até o prazo do ano escolhido", () => {
    expect(situacaoDoPrazo(PRAZOS, 2025, "2026-07-01")).toEqual({ tipo: "contagem", ac: 2025, data: "2026-07-31", dias: 30 });
    expect(situacaoDoPrazo(PRAZOS, 2025, "2026-07-31")).toMatchObject({ dias: 0 });
  });
  it("[CT-127] prazo do ano passado: mostra o próximo com regra", () => {
    expect(situacaoDoPrazo(PRAZOS, 2024, "2026-01-10")).toMatchObject({ tipo: "contagem", ac: 2025 });
  });
  it("[CT-127] sem regra para o próximo ano: a confirmar, sem data inventada", () => {
    expect(situacaoDoPrazo(PRAZOS, 2025, "2026-11-26")).toEqual({ tipo: "a-confirmar", ac: 2026 });
  });
});

describe("[CT-128] novidades recentes e preferência do menu", () => {
  it("[CT-128] conta só os últimos 90 dias, sem datas futuras", () => {
    expect(recentes(["2026-11-26", "2026-08-29", "2026-08-28", "2026-12-01"], "2026-11-26")).toBe(2);
  });
  it("[CT-128] menu recolhido é guardado e qualquer outro valor vira aberto", () => {
    expect(interpretar(JSON.stringify({ menu: "recolhido" })).menu).toBe("recolhido");
    expect(interpretar(JSON.stringify({ menu: "<script>" })).menu).toBeNull();
    expect(interpretar(null).menu).toBeNull();
  });
});
