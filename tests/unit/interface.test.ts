import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { anos, leiauteDoAno } from "@/lib/conteudo";
import { didaticos, registroDoAno, registrosDoAno } from "@/lib/conteudo/leiautes";
import { exemplos, realMontado } from "@/lib/exemplos";
import { exemploDoManual, exemploIlustrativo, ilustrativos, resumoRegistro } from "@/lib/exemplos/por-registro";
import { TOTAL_BLOCOS, conquistas } from "@/lib/preferencias/conquistas";
import { PADRAO, interpretar } from "@/lib/preferencias/modelo";
import { SECOES } from "@/lib/rotas";
import { roteiros } from "@/lib/simulacao/montar";

describe("Exemplo por registro", () => {
  test("[CN-039] todo registro tem exemplo, menos dois que só o programa preenche", () => {
    for (const ano of anos) {
      const todos = registrosDoAno(ano).map((r) => resumoRegistro(r.codigo, ano));
      expect(todos.filter((r) => r.exemplos.length === 0).map((r) => r.codigo), String(ano)).toEqual(["Y750", "9100"]);
      for (const r of todos.filter((x) => x.exemplos.length === 0)) expect(r.semExemplo).toMatch(/O programa/);
      // E todo exemplo principal dá para ler campo a campo.
      for (const r of todos.filter((x) => x.exemplos.length > 0)) expect(r.exemplos[0]!.partes, `${ano} ${r.codigo}`).not.toBeNull();
    }
  });

  test("[CN-045] linhas ilustrativas batem com a empresa fictícia e com as contas", () => {
    const campos = (c: string) => ilustrativos.itens.find((x) => x.registro === c)!.campos;
    const aurora = (reg: string, inicio: string[]) => realMontado.arquivo.linhas.filter((l) => l.reg === reg && inicio.every((v, i) => l.campos[i] === v)).at(-1)!.campos;
    expect(campos("C050")).toEqual(aurora("J050", ["01072025", "01", "A", "4", "1.1.1.01"]));
    expect(campos("E155")).toEqual(aurora("K155", ["1.1.1.01"]));
    expect(campos("C155").slice(0, 8)).toEqual(aurora("K155", ["1.1.1.01"]));
    expect(campos("E355")).toEqual(aurora("K355", ["3.1.1.01"]));
    expect(campos("C355").slice(0, 4)).toEqual(aurora("K355", ["3.1.1.01"]));
    expect(campos("N605")).toEqual(aurora("K355", ["3.1.1.01"]));
    expect(campos("M510").slice(3)).toEqual(aurora("M500", ["PROV", "I"]).slice(2));
    expect(campos("E020")[5]).toBe(aurora("M500", ["PF", "I"])[8]);
    expect([campos("E015")[3], campos("E015")[4]]).toEqual(aurora("K155", ["1.1.1.01"]).slice(6, 8));
    expect([campos("E010")[1], campos("E010")[2]]).toEqual(aurora("L100", ["1.01.01.02.01"]).slice(0, 2));
    // Contagens: uma linha de cada registro do bloco.
    for (const l of ["C", "E"]) expect(Number(campos(`${l}990`)[0])).toBe(registrosDoAno(2025).filter((r) => r.codigo.startsWith(l)).length);
    // X350, conta feita à mão.
    const n = campos("X350").map((v) => Number(v.replace(",", ".")));
    expect(n[2]).toBe(1000000 - 600000);
    expect(n[7]).toBe(400000 + 100000 + 0 - 40000 - 10000);
    expect(n[11]).toBe(450000 + 50000 + 0 - 0);
    expect(n[14]).toBe(500000 + 0 - 100000);
    // Nenhum código inventado: o que depende de tabela não lida fica vazio e avisado.
    expect(ilustrativos.itens.flatMap((x) => x.pendentes.map((p) => `${x.registro}.${p}`))).toEqual(["C040.COD_VER_LC", "X340.TIP_MOEDA"]);
    expect(resumoRegistro("X340", 2025).exemplos[0]!.nota).toMatch(/A verificar: TIP_MOEDA/);
    expect(resumoRegistro("C150", 2024).exemplos[0]!.linha).toBe("|C150|01102024|31122024|");
  });

  test("[CN-046] ilustrativo não toma o lugar de exemplo melhor, e linha fora do leiaute é recusada", () => {
    expect(resumoRegistro("M300", 2025).exemplos.some((e) => e.origem === "ilustrativo")).toBe(false);
    expect(resumoRegistro("X990", 2025).exemplos[0]!.origem).toBe("ficticio");
    expect(resumoRegistro("X990", 2024).exemplos[0]!.origem).toBe("ilustrativo");
    expect(resumoRegistro("0021", 2024).exemplos.every((e) => e.origem === "manual")).toBe(true);
    const r = registroDoAno("C150", 2025)!;
    expect(() => exemploIlustrativo({ ...r, campos: r.campos.slice(0, 2) }, 2025)).toThrow(/fora do leiaute/);
  });

  test("[CN-040] cada valor cai no campo certo", () => {
    for (const ano of anos) {
      for (const r of registrosDoAno(ano)) {
        for (const ex of resumoRegistro(r.codigo, ano).exemplos) {
          expect(ex.linha.startsWith(`|${r.codigo}|`), `${ano} ${r.codigo}`).toBe(true);
          if (!ex.partes) {
            expect(ex.nota).toMatch(/não foi separada/);
            continue;
          }
          expect(ex.partes.map((p) => p.nome), r.codigo).toEqual(r.campos.map((c) => c.nome));
          expect(`|${ex.partes.map((p) => p.valor).join("|")}|`).toBe(ex.linha.split("|").map((x) => x.trim()).join("|"));
          expect(ex.partes[0]!.valor).toBe(r.codigo);
        }
      }
    }
  });

  test("[CN-041] 0000 e 0010 conferidos à mão", () => {
    const zero = resumoRegistro("0000", 2025);
    expect(zero.campos).toBe(16);
    const fic = zero.exemplos[0]!;
    expect(fic.origem).toBe("ficticio");
    const v = Object.fromEntries(fic.partes!.map((p) => [p.nome, p.valor]));
    expect([v.REG, v.NOME_ESC, v.COD_VER, v.CNPJ]).toEqual(["0000", "LECF", "0012", "99999999000100"]);
    expect(fic.partes!.at(0)!.nome).toBe("REG");
    // O Manual lê "0009" numa linha que traz "0011": a leitura dele não é usada, só a tabela de campos.
    const man = zero.exemplos.find((e) => e.origem === "manual")!;
    expect(man.partes?.every((p) => p.leitura === null) ?? true).toBe(true);
    const dez = resumoRegistro("0010", 2025).exemplos.find((e) => e.origem === "manual")!;
    const forma = dez.partes!.find((p) => p.nome === "FORMA_TRIB")!;
    expect([forma.valor, forma.leitura]).toEqual(["1", "Forma de tributação do lucro (1 = Lucro Real)."]);
  });

  test("[CN-042] leitura do Manual só quando todos os valores batem", () => {
    const base = registroDoAno("0990", 2025)!;
    const com = (exemplo: string[]) => exemploDoManual({ ...base, exemplo });
    expect(com(["|0990|9|", "|0990|: Tipo.", "|9|: Total."])!.partes!.map((p) => p.leitura)).toEqual(["Tipo.", "Total."]);
    expect(com(["|0990|9|", "|0990|: Tipo.", "|8|: Total."])!.partes!.map((p) => p.leitura)).toEqual([null, null]);
    expect(com(["|0990|9|extra|"])!.partes).toBeNull();
    expect(com(["|0990|9"])).toBeNull();
    expect(com(["texto"])).toBeNull();
    expect(com([])).toBeNull();
  });

  test("[CN-043] exemplos fictícios só no ano deles, e sempre avisados", () => {
    for (const r of registrosDoAno(2024)) expect(resumoRegistro(r.codigo, 2024).exemplos.every((e) => e.origem !== "ficticio")).toBe(true);
    const fic = registrosDoAno(2025).flatMap((r) => resumoRegistro(r.codigo, 2025).exemplos).filter((e) => e.origem === "ficticio");
    expect(fic.length).toBeGreaterThan(60);
    for (const e of fic) expect(e.nota).toContain("fictícios");
    expect(new Set(fic.map((e) => e.titulo)).size).toBe(exemplos.length);
    expect(() => resumoRegistro("S100", 2025)).toThrow();
  });

  test.skipIf(!existsSync("out"))("[RD-004] um arquivo de exemplos por bloco e por ano, leve", () => {
    for (const ano of anos) {
      const arq = readdirSync(path.join("out", "dados", String(ano)));
      const doAno = roteiros.filter((r) => r.ano === ano).map((r) => `roteiro-${r.registro.toLowerCase()}.json`);
      expect(arq.sort()).toEqual(["busca.json", ...doAno, ...leiauteDoAno(ano).blocos.map((b) => `${b.letra.toLowerCase()}.json`)].sort());
      for (const a of arq) expect(statSync(path.join("out", "dados", String(ano), a)).size, a).toBeLessThan(600_000);
    }
    const m = JSON.parse(readFileSync("out/dados/2025/m.json", "utf8"));
    expect(m.map((r: { codigo: string }) => r.codigo)).toContain("M300");
  });

  test("[CN-044] nome curto em todos os blocos do mapa", () => {
    expect(didaticos.map((d) => d.letra)).toEqual(leiauteDoAno(2025).blocos.map((b) => b.letra));
    expect(new Set(didaticos.map((d) => d.curto)).size).toBe(TOTAL_BLOCOS);
  });
});

describe("Conquistas", () => {
  const feitas = (p: Partial<typeof PADRAO>) => conquistas({ ...PADRAO, ...p }, SECOES.length).filter((c) => c.feito >= c.meta).map((c) => c.id);
  test("[CT-070] regras e limites", () => {
    expect(feitas({})).toEqual([]);
    expect(feitas({ estudadas: ["blocos"] })).toEqual(["primeiro-passo"]);
    expect(feitas({ estudadas: SECOES.slice(0, 3).map((s) => s.slug) })).not.toContain("meia-trilha");
    expect(feitas({ estudadas: SECOES.slice(0, 4).map((s) => s.slug) })).toContain("meia-trilha");
    expect(feitas({ estudadas: SECOES.map((s) => s.slug) })).toEqual(expect.arrayContaining(["meia-trilha", "trilha"]));
    const regs = (n: number) => Array.from({ length: n }, (_, i) => `M${String(i).padStart(3, "0")}`);
    expect(feitas({ registros: regs(9) })).toEqual([]);
    expect(feitas({ registros: regs(10) })).toEqual(["registros"]);
    expect(conquistas({ ...PADRAO, registros: regs(30) }, 8).find((c) => c.id === "registros")!.feito).toBe(10);
    expect(feitas({ blocos: [..."0CEJKLMNPQTUVWXY9"] })).toEqual(["blocos"]);
    expect(feitas({ feitos: ["quiz", "simulador", "percurso"] })).toEqual(["percurso", "quiz", "simulador"]);
  });

  test("[CT-071] armazenamento adulterado não quebra nem inventa conquista", () => {
    const p = interpretar(
      JSON.stringify({ blocos: ["M", "M", "<b>", 7, "MM"], registros: ["M300", "x", "M300", null, "../a"], feitos: ["quiz", "admin"], atalhos: "sim", estudadas: "x" }),
    );
    expect(p).toMatchObject({ blocos: ["M"], registros: ["M300"], feitos: ["quiz"], atalhos: true, estudadas: [] });
    expect(interpretar(JSON.stringify({ atalhos: false })).atalhos).toBe(false);
    expect(interpretar(JSON.stringify({ registros: Array.from({ length: 5000 }, (_, i) => `M${String(i % 1000).padStart(3, "0")}`) })).registros.length).toBe(400);
    // Preferências gravadas antes desta versão continuam válidas.
    expect(interpretar('{"nivel":"profissional","tema":"light","ano":2024,"estudadas":["blocos"],"roteiro":null}')).toEqual({
      ...PADRAO, nivel: "profissional", tema: "light", ano: 2024, estudadas: ["blocos"],
    });
  });

  test("[CT-072] tema escuro é o padrão nos dois lugares que decidem", () => {
    expect(readFileSync("public/prefs.js", "utf8")).toMatch(/p\.tema === "light" \? "light" : "dark"/);
    expect(readFileSync("public/prefs.js", "utf8")).not.toContain("prefers-color-scheme");
    expect(readFileSync("src/app/layout.tsx", "utf8")).toContain('data-theme="dark"');
  });
});
