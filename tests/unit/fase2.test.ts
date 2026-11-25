import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import * as S from "@/schemas";
import { ANO_PADRAO, fontes, leiautes, rastreaveis, regra, regras, verificacaoMaisAntiga } from "@/lib/conteudo";
import { data, inteiro, moeda, ordinal, percentual, semQuebra } from "@/lib/formatos";
import { PADRAO, alternarEstudada, interpretar } from "@/lib/preferencias/modelo";
import { anoDaUrl, caminhoBase, rota, secaoDoCaminho, rotaEmOutroAno } from "@/lib/rotas";
import { aplicar, politica } from "../../tools/csp-hashes/index.ts";

const BLOCOS = "0 C E J K L M N P Q T U V W X Y 9".split(" ");

function arquivos(dir: string, ext: RegExp): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => ext.test(f))
    .map((f) => path.join(dir, f));
}

describe("Funcional", () => {
  test("[CT-010] rotas e prefixo de ano", () => {
    expect(anoDaUrl("/blocos/m", 2025)).toBe(2025);
    expect(anoDaUrl("/ac/2024/blocos/m", 2025)).toBe(2024);
    expect(anoDaUrl("/ac/20245/x", 2025)).toBe(2025);
    expect(caminhoBase("/ac/2024")).toBe("/");
    expect(caminhoBase("/ac/2024/blocos/m/")).toBe("/blocos/m");
    expect(rota("/", 2024, 2025)).toBe("/ac/2024");
    expect(rota("/blocos/m", 2025, 2025)).toBe("/blocos/m");
    expect(rota("/blocos/m", 2024, 2025)).toBe("/ac/2024/blocos/m");
    expect(secaoDoCaminho("/blocos/m")?.slug).toBe("blocos");
    expect(secaoDoCaminho("/")).toBeUndefined();
  });

  test("[CT-011] preferências corrompidas voltam a um estado válido", () => {
    for (const ruim of [null, "", "{", "null", "[]", "42", '"x"']) expect(interpretar(ruim)).toEqual(PADRAO);
    expect(
      interpretar('{"nivel":"hacker","tema":"rosa","ano":"2024","estudadas":["blocos","blocos",7,"<img>"]}'),
    ).toEqual({ ...PADRAO, estudadas: ["blocos"] });
    expect(alternarEstudada(alternarEstudada([], "a"), "a")).toEqual([]);
  });
});

describe("Conteúdo", () => {
  test("[CN-001] todo item fiscal é rastreável", () => {
    expect(rastreaveis.length).toBeGreaterThan(0);
    for (const r of rastreaveis) {
      expect(fontes.some((f) => f.id === r.fonte.id), r.id).toBe(true);
      expect(r.norma && r.fonte.trecho && r.verificadoEm, r.id).toBeTruthy();
    }
    expect(verificacaoMaisAntiga([{ verificadoEm: "2026-11-24" }, { verificadoEm: "2026-01-02" }])).toBe("2026-01-02");
    for (const l of leiautes) expect(regra("prazo-regra-geral", l.anoCalendario).id).toBe("prazo-regra-geral");
    expect(() => regra("prazo-regra-geral", 1999)).toThrow();
  });

  test("[CN-002] schema recusa conteúdo inválido", () => {
    const boa = regras[0]!;
    expect(S.Regra.safeParse(boa).success).toBe(true);
    expect(S.Regra.safeParse({ ...boa, status: "revisado" }).success).toBe(false);
    expect(S.Regra.safeParse({ ...boa, status: "revisado", revisor: "Pessoa" }).success).toBe(true);
    expect(S.Regra.safeParse({ ...boa, verificadoEm: "24/11/2026" }).success).toBe(false);
    expect(S.Regra.safeParse({ ...boa, extra: 1 }).success).toBe(false);
    for (const campo of ["fonte", "norma", "leiautes", "vigencia", "verificadoEm", "status"]) {
      expect(S.Regra.safeParse({ ...boa, [campo]: undefined }).success, campo).toBe(false);
    }
    for (const url of [
      "https://exemplo.com/",
      "http://www.gov.br/",
      "javascript:alert(1)",
      "https://www.gov.br.exemplo.com/",
      "https://www.gov.br@exemplo.com/",
      "https://www.gov.br:8443/",
    ]) {
      expect(S.Regra.safeParse({ ...boa, fonte: { ...boa.fonte, url } }).success, url).toBe(false);
    }
  });

  test("[CN-003] 17 blocos do escopo, na ordem oficial", () => {
    expect(leiautes.map((l) => [l.numero, l.anoCalendario])).toEqual([["12", 2025], ["11", 2024]]);
    expect(ANO_PADRAO).toBe(2025);
    for (const l of leiautes) expect(l.blocos.map((b) => b.letra)).toEqual(BLOCOS);
  });

  test("[CN-004] nada de regra fiscal escrita em componente", () => {
    const proibidos = [
      /\d+(?:[.,]\d+)?\s?%/,
      /R\$\s?\d/,
      /\b\d{2}\/\d{2}\/\d{4}\b/,
      /\b(?:IN|Lei|Decreto|Decreto-Lei|ADE|LC|Portaria)\b[^"'`<\n]{0,20}\bn[º°o]\s?\d/i,
      /\b(?:IN RFB|Lei Complementar|ADE Cofis)\s\d/i,
      /[uú]ltimo dia [uú]til/i,
    ];
    const achados = [...arquivos("src", /\.tsx$/), "src/lib/rotas.ts"].flatMap((f) => {
      const codigo = readFileSync(f, "utf8");
      return proibidos.filter((p) => p.test(codigo)).map((p) => `${f}: ${p}`);
    });
    expect(achados).toEqual([]);
  });

  test("[CN-005] formatação pt-BR", () => {
    expect(inteiro(1234567)).toBe("1.234.567");
    expect(inteiro(0)).toBe("0");
    expect(inteiro(null)).toBe("—");
    expect(moeda(123456789n)).toBe("R$ 1.234.567,89");
    expect(moeda(0n)).toBe("R$ 0,00");
    expect(moeda(-5n)).toBe("-R$ 0,05");
    expect(moeda(900719925474099301n)).toBe("R$ 9.007.199.254.740.993,01");
    expect(moeda(undefined)).toBe("—");
    expect(percentual(1500)).toBe("15%");
    expect(percentual(165)).toBe("1,65%");
    expect(data("2026-01-01")).toBe("01/01/2026");
    expect(data(null)).toBe("—");
    expect(() => data("2026-13-01")).toThrow();
    expect(ordinal(3)).toBe("3º");
    expect(semQuebra("R$ 1,00, art. 2º, § 3º, nº 4")).toBe("R$\u00a01,00, art.\u00a02º, §\u00a03º, nº\u00a04");
  });
});

describe("Troca de ano", () => {
  test("[CT-005] leva a um lugar que existe", () => {
    const ausentes = { 2025: [], 2024: ["Y730"] };
    expect(rotaEmOutroAno("/blocos/y/y730", 2024, 2025, ausentes)).toBe("/ac/2024/blocos/y");
    expect(rotaEmOutroAno("/blocos/y/y720", 2024, 2025, ausentes)).toBe("/ac/2024/blocos/y/y720");
    expect(rotaEmOutroAno("/blocos/y/y730", 2025, 2025, ausentes)).toBe("/blocos/y/y730");
    expect(rotaEmOutroAno("/nao-existe", 2024, 2025, ausentes)).toBe("/ac/2024");
    expect(rotaEmOutroAno("/fontes", 2024, 2025, ausentes)).toBe("/ac/2024/fontes");
    expect(rotaEmOutroAno("/", 2024, 2025, ausentes)).toBe("/ac/2024");
  });
});

describe("Acessibilidade", () => {
  test("[AC-005] contraste dos tokens", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const ler = (bloco: RegExp) =>
      Object.fromEntries([...bloco.exec(css)![1]!.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1]!, m[2]!]));
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const razao = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
      return (x + 0.05) / (y + 0.05);
    };
    for (const tema of [/:root\s*{([^}]*)}/, /\[data-theme="dark"\]\s*{([^}]*)}/]) {
      const t = ler(tema);
      const texto: [string, string][] = [
        ["tinta", "fundo"], ["tinta", "superficie"], ["suave", "fundo"], ["suave", "superficie"],
        ["marca", "fundo"], ["marca", "superficie"], ["sobre-marca", "marca"], ["sobre-realce", "realce"],
        ["alerta", "alerta-fundo"], ["ok", "ok-fundo"], ["ok", "fundo"],
      ];
      for (const [a, b] of texto) expect(razao(t[a]!, t[b]!), `${a}/${b}`).toBeGreaterThanOrEqual(4.5);
      const graficos: [string, string][] = [
        ["controle", "superficie"],
        ["marca", "superficie"], ["controle", "fundo"],
      ];
      for (const [a, b] of graficos) expect(razao(t[a]!, t[b]!), `${a}/${b}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Segurança", () => {
  test("[SG-002] a CSP gera hash só de scripts inline e é reaplicável", () => {
    const html = '<html><head></head><body><script src="/a.js"></script><script>1</script></body></html>';
    expect(politica(html).match(/sha256-/g)).toHaveLength(1);
    expect(politica(html)).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(aplicar(aplicar(html))).toBe(aplicar(html));
  });

  test("[SG-003] cabeçalhos do vercel.json, incluindo HSTS", () => {
    const { headers } = JSON.parse(readFileSync("vercel.json", "utf8"));
    const h = Object.fromEntries(headers[0].headers.map((x: { key: string; value: string }) => [x.key, x.value]));
    expect(headers[0].source).toBe("/(.*)");
    expect(h["Strict-Transport-Security"]).toContain("preload");
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(h["Content-Security-Policy"]).not.toMatch(/unsafe-eval|script-src|default-src/);
  });

  test("[SG-006] sem HTML cru nem execução dinâmica", () => {
    const ruim = /dangerouslySetInnerHTML|\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/;
    const achados = [...arquivos("src", /\.tsx?$/), "public/prefs.js"].filter((f) => ruim.test(readFileSync(f, "utf8")));
    expect(achados).toEqual([]);
  });
});
