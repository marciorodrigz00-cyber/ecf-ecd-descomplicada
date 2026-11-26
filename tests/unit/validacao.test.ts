import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { buscaCom, lerBusca } from "@/lib/parametros";

describe("Seleção no endereço", () => {
  const padroes = { regime: "real", bloco: "M" };
  test("[CT-101] grava só o que foge do padrão e preserva o resto", () => {
    expect(buscaCom("", { regime: "real", bloco: "M" }, padroes)).toBe("");
    expect(buscaCom("", { regime: "real", bloco: "K" }, padroes)).toBe("?bloco=K");
    expect(buscaCom("?bloco=K&x=1", { regime: "imune", bloco: "M" }, padroes)).toBe("?x=1&regime=imune");
    expect(buscaCom("", { bloco: "a&b=c#d" }, padroes)).toBe("?bloco=a%26b%3Dc%23d");
  });
  test("[CT-101] lê com padrão e ignora nome desconhecido", () => {
    expect(lerBusca("?bloco=K&outro=1", padroes)).toEqual({ regime: "real", bloco: "K" });
    expect(lerBusca("?__proto__=x&bloco=", padroes)).toEqual({ regime: "real", bloco: "" });
  });
});

test("[RD-008] vercel.json guarda só os arquivos com hash no nome", () => {
  const { headers } = JSON.parse(readFileSync("vercel.json", "utf8")) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
  const regras = headers.filter((h) => h.headers.some((x) => x.key === "Cache-Control"));
  expect(regras).toEqual([{ source: "/_next/static/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }]);
});
