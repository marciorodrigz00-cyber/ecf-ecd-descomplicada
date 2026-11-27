import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { agrupar, buscar, preparar, TIPOS } from "@/lib/busca";
import { montarIndice } from "@/lib/busca/indice";
import { anos, leiauteDoAno } from "@/lib/conteudo";
import { ancorasDosCampos, registrosDoAno, registrosDoBloco, vizinhos } from "@/lib/conteudo/leiautes";

describe("Etapa 3: navegação entre registros", () => {
  test("[CN-078] âncora pelo nome do campo, única em todos os registros dos dois anos", () => {
    expect(ancorasDosCampos([{ nome: "COD_SCP" }, { nome: "VALOR" }, { nome: "VALOR" }]).map(([, a]) => a)).toEqual(["cod-scp", "valor", "valor-2"]);
    for (const ano of anos)
      for (const r of registrosDoAno(ano)) {
        const lista = ancorasDosCampos(r.campos).map(([, a]) => a);
        expect(new Set(lista).size, `${ano} ${r.codigo}`).toBe(lista.length);
        for (const a of lista) expect(a, `${ano} ${r.codigo}`).toMatch(/^[a-z0-9][a-z0-9-]*$/);
        // A âncora não pode colidir com os títulos de seção da página (t-…).
        for (const a of lista) expect(a.startsWith("t-"), a).toBe(false);
      }
  });

  test("[CT-122] anterior e próximo seguem a ordem do arquivo e atravessam blocos", () => {
    for (const ano of anos) {
      const ordem = leiauteDoAno(ano).blocos.flatMap((b) => registrosDoBloco(b.letra, ano).map((r) => r.codigo));
      expect(vizinhos(ordem[0]!, ano).anterior).toBeNull();
      expect(vizinhos(ordem.at(-1)!, ano).proximo).toBeNull();
      ordem.forEach((c, i) => {
        const v = vizinhos(c, ano);
        expect(v.anterior?.codigo ?? null, c).toBe(ordem[i - 1] ?? null);
        expect(v.proximo?.codigo ?? null, c).toBe(ordem[i + 1] ?? null);
      });
    }
    // Fim do bloco 0 leva ao primeiro registro do bloco seguinte.
    const ultimo0 = registrosDoBloco("0", 2025).at(-1)!.codigo;
    const seguinte = leiauteDoAno(2025).blocos[1]!.letra;
    expect(vizinhos(ultimo0, 2025).proximo!.codigo).toBe(registrosDoBloco(seguinte, 2025)[0]!.codigo);
  });

  test("[CN-078] toda regra do Manual está no índice da busca", () => {
    for (const ano of anos) {
      const indice = montarIndice(ano);
      const regras = new Set(indice.filter((l) => TIPOS[l[0]] === "regra").map((l) => `${l[2].split(":")[0]}|${l[1]}`));
      for (const r of registrosDoAno(ano)) {
        for (const x of r.regrasRegistro) expect(regras.has(`${r.codigo}|${x.codigo}`), `${ano} ${r.codigo} ${x.codigo}`).toBe(true);
        for (const g of r.regrasCampo) for (const x of g.regras) expect(regras.has(`${r.codigo}.${g.campo}|${x.codigo}`), `${ano} ${r.codigo} ${x.codigo}`).toBe(true);
      }
    }
  });

  test("[CT-125] busca por nome de campo e por código de regra, com grupos", () => {
    const indice = preparar(montarIndice(2025));
    const campos = buscar(indice, "COD_SCP").filter((r) => r.tipo === "campo");
    expect(campos.map((r) => r.codigo)).toEqual(expect.arrayContaining(["0000.COD_SCP", "0035.COD_SCP"]));
    expect(campos.find((r) => r.codigo === "0035.COD_SCP")!.href).toBe("/blocos/0/0035#cod-scp");
    const regras = buscar(indice, "REGRA_CNPJ_DIFERENTE_SCP");
    expect(regras[0]).toMatchObject({ tipo: "regra", codigo: "REGRA_CNPJ_DIFERENTE_SCP" });
    expect(regras.map((r) => r.href)).toEqual(expect.arrayContaining(["/blocos/0/0035#regra-cod-scp-regra-cnpj-diferente-scp"]));
    // Agrupar mantém a ordem dentro de cada tipo e não perde nada.
    const misto = buscar(indice, "scp");
    const g = agrupar(misto);
    expect(g).toHaveLength(misto.length);
    const tipos = g.map((r) => r.tipo);
    expect(tipos.filter((t, i) => t !== tipos[i - 1]).length).toBe(new Set(tipos).size);
    for (const t of new Set(tipos)) expect(g.filter((r) => r.tipo === t)).toEqual(misto.filter((r) => r.tipo === t));
  });

  test.skipIf(!existsSync("out"))("[RD-010] índice da busca com as regras continua leve", () => {
    for (const ano of anos) {
      const f = `out/dados/${ano}/busca.json`;
      expect(statSync(f).size, f).toBeLessThan(600_000);
      expect(JSON.parse(readFileSync(f, "utf8")).some((l: unknown[]) => TIPOS[l[0] as number] === "regra")).toBe(true);
    }
  });
});
