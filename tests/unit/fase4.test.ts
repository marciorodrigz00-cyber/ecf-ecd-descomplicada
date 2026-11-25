import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { ANO_PADRAO, anos, leiauteDoAno } from "@/lib/conteudo";
import {
  conferencia,
  didaticos,
  grafo,
  legendas,
  mudancas,
  regimes,
  registroDoAno,
  registrosDoAno,
  regrasDe,
} from "@/lib/conteudo/leiautes";
import { interpretar } from "@/lib/preferencias/modelo";
import { separarRegras, tipografia } from "../../tools/extrair-leiaute/index.ts";

describe("Registros", () => {
  test("[CN-010] quantidade, ordem e integridade por leiaute", () => {
    expect(registrosDoAno(2025)).toHaveLength(180);
    expect(registrosDoAno(2024)).toHaveLength(179);
    for (const a of anos) {
      const regs = registrosDoAno(a);
      const letras = leiauteDoAno(a).blocos.map((b) => b.letra);
      // Na ordem dos blocos do leiaute, cada bloco abre em 001 (o 0 em 0000) e fecha em 990 (o 9 em 9999).
      const blocos = [...new Set(regs.map((r) => r.codigo[0]))];
      expect(blocos).toEqual(letras);
      for (const l of letras) {
        const cods = regs.filter((r) => r.codigo[0] === l).map((r) => r.codigo);
        expect(cods, l).toContain(`${l}001`);
        expect(cods, l).toContain(`${l}990`);
        expect(new Set(cods).size, l).toBe(cods.length);
      }
      for (const r of regs) {
        expect(new Set(r.campos.map((c) => c.nome)).size, r.codigo).toBe(r.campos.length);
        expect(r.ocorrencia, r.codigo).not.toBe("—");
        expect(r.nivel, r.codigo).toMatch(/^\d$/);
      }
    }
  });

  test("[CN-011] todos os registros têm conferência registrada", () => {
    for (const a of anos) {
      expect(conferencia(a).codigos).toEqual(registrosDoAno(a).map((r) => r.codigo).sort());
    }
  });

  test("[CN-012] amostra digitada à mão a partir do Manual", () => {
    const r10 = registroDoAno("0010", 2025)!;
    expect(r10.campos.map((c) => c.nome).slice(0, 6)).toEqual(["REG", "HASH_ECF_ANTERIOR", "OPT_REFIS", "FORMA_TRIB", "FORMA_APUR", "COD_QUALIF_PJ"]);
    const forma = r10.campos[3]!;
    expect([forma.tipo, forma.obrigatorio]).toEqual(["N", "Sim"]);
    for (const t of ["1 – Lucro Real", "5 – Lucro Presumido", "6 – Lucro Arbitrado", "8 – Imune", "9 – Isenta"]) {
      expect(forma.descricao).toContain(t);
    }
    const m300 = registroDoAno("M300", 2025)!;
    expect(m300.campos.map((c) => [c.nome, c.tipo, c.tamanho, c.decimal, c.obrigatorio])).toEqual([
      ["REG", "C", "4", "—", "Sim"],
      ["CODIGO", "C", "—", "—", "Sim"],
      ["DESCRICAO", "C", "—", "—", "Não"],
      ["TIPO_LANCAMENTO", "C", "1", "—", "Não"],
      ["IND_RELACAO", "N", "1", "—", "Não"],
      ["VALOR", "NS", "19", "2", "Não"],
      ["HIST_LAN_LAL", "C", "500", "—", "Não"],
    ]);
    expect(m300.nivel).toBe("3");
    expect(m300.chave).toBe("CODIGO");
    expect(regrasDe(m300)).toContain("REGRA_VALOR_DETALHADO");
    expect(registroDoAno("M300", 2025)!.saida).toContain("FORMA_TRIB_PER");
    expect(registroDoAno("X390", 2025)!.saida).toContain("“8” ou “9”");
    expect(registroDoAno("0000", 2025)!.campos.at(-1)!.nome).toBe("EVENTO_SCP");
    expect(registroDoAno("0000", 2024)!.campos.map((c) => c.nome)).not.toContain("EVENTO_SCP");
    expect(registroDoAno("Y600", 2025)!.campos.find((c) => c.nome === "VL_LUC_DIV")!.obrigatorio).toBe("Não");
  });

  test("[CN-013] matriz de regimes bate com a condição oficial de cada registro", () => {
    for (const a of anos) {
      for (const l of regimes.linhas) {
        const textos = l.base.map((c) => registroDoAno(c, a)!.saida);
        for (const r of regimes.regimes) {
          // Só vale a menção a FORMA_TRIB, e não a FORMA_TRIB_PER.
          const citados = textos.map((t) => {
            const trecho = t.split(/E 0010\. ?FORMA_TRIB_PER/)[0]!;
            if (!/FORMA_TRIB(?!_)/.test(trecho)) return null;
            const formas = [...trecho.matchAll(/["“](\d+)[”"]?/g)].map((m) => m[1]);
            if (/["“]1["”] a ["“]7["”]/.test(trecho)) formas.push("2", "3", "4", "5", "6");
            return formas;
          });
          const cita = citados.some((f) => f === null || f.includes(r.forma));
          expect(l.celulas[r.id] !== "nao" || !cita, `${a} bloco ${l.bloco} ${r.id}: ${textos}`).toBe(true);
          if (l.celulas[r.id] !== "nao") expect(cita || l.bloco === "X", `${a} bloco ${l.bloco} ${r.id}: ${textos}`).toBe(true);
        }
      }
    }
  });

  test("[CN-014] erros didáticos e ligações citam registro e regra existentes", () => {
    for (const a of anos) {
      for (const e of didaticos.flatMap((d) => d.erros)) {
        const r = registroDoAno(e.registro, a)!;
        expect(r, e.registro).toBeTruthy();
        if (e.regra) expect(regrasDe(r), e.registro).toContain(e.regra);
      }
      for (const g of grafo.arestas) expect(registroDoAno(g.base.registro, a), g.base.registro).toBeTruthy();
    }
    // O texto oficial da condição precisa sustentar as ligações que saem do bloco 0.
    for (const g of grafo.arestas.filter((x) => x.de === "0")) {
      expect(registroDoAno(g.base.registro, ANO_PADRAO)!.saida, g.base.registro).toMatch(/00[12]0\. ?/i);
    }
  });

  test("[CN-015] comparação entre leiautes", () => {
    expect(mudancas("Y730", 2025)?.mudanca).toEqual({ tipo: "novo" });
    const z = mudancas("0000", 2025)!.mudanca;
    expect(z?.tipo === "alterado" && z.itens).toContain("Campo novo: EVENTO_SCP");
    expect(mudancas("M300", 2024)).toBeNull();
  });

  test("[CN-016] Bloco S fora de dados e telas; legendas completas", () => {
    for (const n of ["11", "12"]) {
      expect(readdirSync(`content/leiautes/${n}/registros`)).not.toContain("S.json");
    }
    expect(anos.flatMap(registrosDoAno).filter((r) => r.codigo.startsWith("S"))).toEqual([]);
    for (const t of new Set(anos.flatMap(registrosDoAno).flatMap((r) => r.campos.map((c) => c.tipo)))) {
      if (t !== "—") expect(legendas.tipos[t], t).toBeTruthy();
    }
    for (const r of anos.flatMap(registrosDoAno)) {
      expect(legendas.obrigatoriedade[/^(OC|FC|O|F|N)\b/.exec(r.saida)![1]!], r.codigo).toBeTruthy();
    }
  });

  test("[CN-017] extrator: regras, continuação e tipografia", () => {
    expect(separarRegras("REGRA_A: Verifica se X, conforme REGRA_B.\nREGRA_C: Outra.").map((r) => r.codigo)).toEqual(["REGRA_A", "REGRA_C"]);
    expect(tipografia("Lei no 9.249, art. 9o, § 2o")).toBe("Lei nº 9.249, art. 9º, § 2º");
    expect(tipografia("no 3 caso")).toBe("no 3 caso");
  });
});

describe("Estrutura", () => {
  test("[CT-040] roteiro salvo inválido é descartado", () => {
    expect(interpretar('{"roteiro":{"regime":"real","passo":3}}').roteiro).toEqual({ regime: "real", passo: 3 });
    for (const r of ['{"regime":"<b>","passo":1}', '{"regime":"real","passo":-1}', '{"regime":"real","passo":1e9}', '"x"', "null"]) {
      expect(interpretar(`{"roteiro":${r}}`).roteiro).toBeNull();
    }
  });

  test("[SG-009] redirecionamento só para caminho interno do ano padrão", () => {
    const { redirects } = JSON.parse(readFileSync("vercel.json", "utf8"));
    for (const r of redirects) {
      expect(r.source.startsWith(`/ac/${ANO_PADRAO}`)).toBe(true);
      expect(r.destination).toMatch(/^\/(?!\/)/);
      expect(r.source).not.toContain("*)/:path*");
    }
    expect(redirects[1].source).toContain("[a-z0-9-]+");
  });

  // Sem build não há o que medir; no portão da fase o build sempre existe.
  test.skipIf(!existsSync("out"))("[RD-003] peso das páginas de registro", () => {
    const html = readdirSync("out", { recursive: true, encoding: "utf8" }).filter((f) => /blocos[\\/]\w[\\/]\w{4}\.html$/.test(f));
    expect(html.length).toBe(359);
    const maior = Math.max(...html.map((f) => readFileSync(path.join("out", f)).length));
    expect(maior).toBeLessThan(1_000_000);
  });
});
