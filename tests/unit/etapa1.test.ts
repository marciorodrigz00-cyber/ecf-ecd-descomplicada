import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { anos, leiauteDoAno } from "@/lib/conteudo";
import { didaticos, grafo, nomeBloco, regimes, registroDoAno } from "@/lib/conteudo/leiautes";

const arquivos = (dir: string, re: RegExp): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => re.test(f)).map((f) => path.join(dir, f));
const json = (f: string) => JSON.parse(readFileSync(f, "utf8"));

describe("Etapa 1: nomes, códigos e datas", () => {
  test("[CN-070] nome de bloco vem de uma fonte só e o curto não se repete no mapa", () => {
    for (const ano of anos) {
      const blocos = leiauteDoAno(ano).blocos;
      for (const b of blocos) expect(nomeBloco(b.letra, ano).nome).toBe(b.nome);
      const curtos = [...blocos.map((b) => nomeBloco(b.letra, ano).curto), ...grafo.externos.map((x) => x.nome)].map((x) => x.toLowerCase());
      expect(curtos.filter((x, i) => curtos.indexOf(x) !== i), `AC ${ano}`).toEqual([]);
    }
    // Nenhum componente escreve nome de bloco à mão (nomes de regime podem coincidir com nomes curtos).
    const deRegime = new Set(regimes.regimes.map((r) => r.nome.toLowerCase()));
    const nomes = [...new Set([...anos.flatMap((a) => leiauteDoAno(a).blocos.map((b) => b.nome)), ...didaticos.map((d) => d.curto)])].filter(
      (n) => !deRegime.has(n.toLowerCase()) && n.length > 4,
    );
    const achados: string[] = [];
    for (const f of arquivos("src", /\.tsx?$/)) {
      const t = readFileSync(f, "utf8");
      for (const n of nomes) if (t.includes(`"${n}"`) || t.includes(`>${n}<`) || t.includes(`\`${n}\``)) achados.push(`${f}: ${n}`);
    }
    expect(achados).toEqual([]);
    // Os objetivos não repetem o nome curto logo de saída.
    for (const d of didaticos) expect(d.objetivo.toLowerCase().startsWith(`é o ${d.curto.toLowerCase()}`), d.letra).toBe(false);
  });

  test("[CN-071] código de registro citado em texto existe; código de tabela dinâmica vem com a palavra tabela ou linha", () => {
    const textos: string[] = [];
    const juntar = (x: unknown): void => {
      if (typeof x === "string") textos.push(x);
      else if (Array.isArray(x)) x.forEach(juntar);
      else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["url", "id", "fonte", "rastreio"].includes(k)) juntar(v);
    };
    for (const f of ["content/blocos.json", "content/grafo.json", "content/glossario.json", ...arquivos("content/novidades", /\.json$/)]) juntar(json(f));
    const existe = (c: string) => anos.some((a) => registroDoAno(c, a));
    const ruins: string[] = [];
    for (const t of textos) {
      for (const frase of t.split(/(?<=[.;:!?])\s+/)) {
        for (const [codigo, base, sufixo] of frase.matchAll(/\b([0-9CEJKLMNPQTUVWXY]\d{3})([A-Z])?\b/g)) {
          if (!/^\d{4}$/.test(base!) || /^0\d{3}$/.test(base!) || /^9\d{3}$/.test(base!)) {
            if (!existe(base!)) ruins.push(`${codigo} não existe: ${frase.slice(0, 80)}`);
          }
          if (sufixo && !/tabela|linha/i.test(frase)) ruins.push(`${codigo} sem “tabela” ou “linha”: ${frase.slice(0, 80)}`);
        }
      }
    }
    expect(ruins).toEqual([]);
    // Rótulo de ligação com tabela dinâmica cita o registro para onde o link leva.
    for (const a of grafo.arestas) if (a.base.tabela) expect(a.base.tabela, `${a.de}→${a.para}`).toContain(`registro ${a.base.registro}`);
  });

  test("[CN-073] padrão de data sem rótulo é reconhecido (controle negativo)", () => {
    const sem = "Comunicado da versão 12.2.8 · verificado em 25/11/2026";
    const com = "Comunicado da versão 12.2.8 · comunicado verificado em 25/11/2026";
    const achar = (t: string) => [...t.matchAll(/(.{0,3})verificad[oa]s?\s+em\s+(\d{2}\/\d{2}\/\d{4})/gi)].some(([, trecho]) => /·\s*$/.test(trecho!.slice(0, 3)));
    expect(achar(sem)).toBe(true);
    expect(achar(com)).toBe(false);
  });

  test.skipIf(!existsSync("out"))("[CN-073] toda data de verificação na tela diz a que se refere e vem dos dados", () => {
    const datas = new Set<string>();
    const coletar = (x: unknown): void => {
      if (Array.isArray(x)) x.forEach(coletar);
      else if (x && typeof x === "object") {
        for (const [k, v] of Object.entries(x)) {
          if (k === "verificadoEm" && typeof v === "string") datas.add(v);
          else coletar(v);
        }
      }
    };
    for (const f of arquivos("content", /\.json$/)) coletar(json(f));
    const br = (iso: string) => iso.split("-").reverse().join("/");
    const validas = new Set([...datas].map(br));
    const ruins = new Set<string>();
    for (const f of arquivos("out", /\.html$/)) {
      const texto = readFileSync(f, "utf8").replace(/<script[\s\S]*?<\/script>|<[^>]+>/g, " ").replace(/\s+/g, " ");
      for (const [, trecho, data] of texto.matchAll(/(.{0,3})verificad[oa]s?\s+em\s+(\d{2}\/\d{2}\/\d{4})/gi)) {
        if (/·\s*$/.test(trecho!.slice(0, 3))) ruins.add(`${f}: data sem rótulo`);
        if (!validas.has(data!)) ruins.add(`${f}: ${data} não está nos dados`);
      }
    }
    expect([...ruins].slice(0, 10)).toEqual([]);
  }, 60_000);

  test.skipIf(!existsSync("out"))("[SM-006] selo “ECD em breve” no cabeçalho de todas as páginas", () => {
    const sem = arquivos("out", /\.html$/).filter((f) => !readFileSync(f, "utf8").includes("ECD em breve"));
    expect(sem).toEqual([]);
  }, 60_000);
});
