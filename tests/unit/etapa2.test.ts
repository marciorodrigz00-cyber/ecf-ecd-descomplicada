import { describe, expect, test } from "vitest";
import { regimes } from "@/lib/conteudo/leiautes";
import { PADRAO, REGIMES_PERFIL, interpretar } from "@/lib/preferencias/modelo";

describe("Etapa 2: perfil", () => {
  test("[SG-033] perfil só aceita valores da lista; o resto volta ao padrão", () => {
    expect([...REGIMES_PERFIL]).toEqual(regimes.regimes.map((r) => r.id));
    expect(interpretar(JSON.stringify({ regime: "presumido", perfil: "respondido" }))).toMatchObject({ regime: "presumido", perfil: "respondido" });
    expect(interpretar(JSON.stringify({ regime: "<script>", perfil: "talvez" }))).toMatchObject({ regime: null, perfil: null });
    expect(interpretar(JSON.stringify({ regime: ["real"], perfil: 1 }))).toMatchObject({ regime: null, perfil: null });
    // Preferências gravadas antes da etapa 2 continuam válidas.
    expect(interpretar(JSON.stringify({ nivel: "profissional", estudadas: ["o-que-e"] }))).toEqual({ ...PADRAO, nivel: "profissional", estudadas: ["o-que-e"] });
  });
});
