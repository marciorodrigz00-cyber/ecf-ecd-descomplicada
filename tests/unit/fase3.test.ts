import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { anos, linhaDoTempo, paginas, quiz, regra, regras, textoDoValor } from "@/lib/conteudo";
import { avaliar, validarQuiz } from "@/lib/quiz";

function resultado(...respostas: string[]) {
  const e = avaliar(quiz, respostas);
  if (e.tipo !== "resultado") throw new Error("não terminou");
  return { id: e.resultado.id, situacao: e.resultado.situacao, avisos: e.complementos.map((c) => c.id) };
}
const porRegime = (r: string) => resultado("pj", "sim", "nao", "nao", r);

describe("Quiz: um caso por regime", () => {
  test.each([
    ["CT-020", "real"],
    ["CT-021", "presumido"],
    ["CT-022", "arbitrado"],
    ["CT-023", "imune"],
    ["CT-024", "isenta"],
  ])("[%s] %s", (_, r) => {
    expect(porRegime(r)).toEqual({ id: `obrigada-${r}`, situacao: "obrigada", avisos: [] });
  });

  test("[CT-025] Simples o ano todo", () => {
    expect(resultado("pj", "sim", "todo")).toEqual({ id: "dispensada-simples", situacao: "dispensada", avisos: [] });
  });
  test("[CT-026] saída do Simples", () => {
    expect(resultado("pj", "sim", "saiu", "nao", "presumido")).toMatchObject({ situacao: "obrigada", avisos: ["simples-saida"] });
  });
  test("[CT-027] entrada no Simples", () => {
    expect(resultado("pj", "sim", "entrou", "nao", "presumido")).toMatchObject({ situacao: "obrigada", avisos: ["simples-entrada"] });
  });
  test("[CT-028] inativa e movimento parcial", () => {
    expect(resultado("pj", "nao")).toMatchObject({ id: "dispensada-inativa", situacao: "dispensada" });
    expect(resultado("pj", "parte", "nao", "nao", "real")).toMatchObject({ situacao: "obrigada", avisos: ["inatividade"] });
  });
  test("[CT-029] setor público", () => {
    expect(resultado("publico")).toMatchObject({ id: "dispensada-publico", situacao: "dispensada" });
  });
  test("[CT-030] SCP e sócia ostensiva", () => {
    expect(resultado("scp")).toMatchObject({ id: "obrigada-scp", situacao: "obrigada" });
    expect(resultado("pj", "sim", "nao", "sim", "real")).toMatchObject({ id: "obrigada-real", avisos: ["ostensiva"] });
  });
  test("[CT-031] equiparada e regime desconhecido", () => {
    expect(resultado("equiparada", "sim", "nao", "nao", "nao-sei")).toMatchObject({ id: "obrigada-indefinido", situacao: "obrigada" });
  });

  test("[CT-032] todo caminho termina", () => {
    expect(validarQuiz(quiz).length).toBeGreaterThan(50);
    expect(() => avaliar(quiz, ["inexistente"])).toThrow();
    expect(() => avaliar(quiz, ["publico", "sim"])).toThrow();
    const ciclo = structuredClone(quiz);
    Object.assign(ciclo.perguntas[1]!.opcoes[0]!, { proximo: "natureza" });
    expect(() => validarQuiz(ciclo)).toThrow();
  });
});

describe("Conteúdo fiscal", () => {
  // Digitado à mão a partir da leitura das normas em 24/11/2026, independente dos JSON.
  const esperado: Record<string, { norma: RegExp; trechos: string[] }> = {
    "multa-real-atraso": { norma: /1\.598\/1977, art\. 8º-A, I,/, trechos: ["0,25%", "mês-calendário ou fração", "10%"] },
    "multa-real-erro": { norma: /8º-A, II,/, trechos: ["3%", "R$ 100,00"] },
    "multa-real-limite": { norma: /8º-A, § 1º/, trechos: ["R$ 100.000,00", "R$ 3.600.000,00", "R$ 5.000.000,00"] },
    "multa-real-reducao": { norma: /8º-A, § 2º/, trechos: ["90%", "30 dias", "75%", "60 dias", "metade", "25%"] },
    "multa-real-erro-reducao": { norma: /8º-A, § 3º/, trechos: ["Não é devida", "50%"] },
    "multa-demais-requisitos": { norma: /8\.218\/1991, art\. 12, I,/, trechos: ["0,5%"] },
    "multa-demais-erro": { norma: /art\. 12, II,/, trechos: ["5%", "1%"] },
    "multa-demais-atraso": { norma: /art\. 12, III,/, trechos: ["0,02%", "por dia", "1%"] },
    "multa-demais-reducao": { norma: /art\. 12, parágrafo único/, trechos: ["metade", "a 75%"] },
    "multa-qual": { norma: /2\.004\/2021, art\. 6º/, trechos: ["Lucro real", "8º-A", "art. 12"] },
    "prazo-regra-geral": { norma: /art\. 3º, caput/, trechos: ["último dia útil de julho"] },
    "prazo-especial-1": { norma: /art\. 3º, § 2º, I$/, trechos: ["julho do mesmo ano"] },
    "prazo-especial-2": { norma: /art\. 3º, § 2º, II$/, trechos: ["3º mês subsequente"] },
    "prazo-horario": { norma: /art\. 3º, § 4º/, trechos: ["23h59min59s", "Brasília"] },
    "livro-caixa": { norma: /art\. 2º, VIII/, trechos: ["2016", "R$ 1.200.000,00"] },
    "dispensa-simples": { norma: /art\. 1º, § 1º, I$/, trechos: ["Simples Nacional"] },
    "dispensa-publicos": { norma: /art\. 1º, § 1º, II$/, trechos: ["órgãos públicos", "autarquias", "fundações públicas"] },
    "dispensa-inativas": { norma: /art\. 1º, § 1º, III$/, trechos: ["durante todo o ano-calendário", "obrigações acessórias"] },
    scp: { norma: /art\. 1º, § 3º/, trechos: ["separadamente para cada SCP"] },
    "imunes-isentas": { norma: /Manual/, trechos: ["2015"] },
  };

  test("[CN-006] valores e dispositivos", () => {
    for (const a of anos) {
      for (const [id, e] of Object.entries(esperado)) {
        const r = regra(id, a);
        expect(r.norma, id).toMatch(e.norma);
        for (const t of e.trechos) expect(textoDoValor(r.valor), id).toContain(t);
      }
    }
    // Toda regra de multa precisa estar na lista conferida ou não ter número.
    for (const r of regras.filter((x) => x.id.startsWith("multa-") && !(x.id in esperado))) {
      expect(textoDoValor(r.valor), r.id).not.toMatch(/\d+%|R\$/);
    }
    expect(linhaDoTempo.map((e) => ("data" in e.quando ? e.quando.data : String(e.quando.ano)))).toEqual([
      "2007-01-22", "2013-12-20", "2014", "2015", "2016", "2021-02-01", "2024-12-18", "2026-01-29",
    ]);
  });

  test("[CN-007] textos citam regras, sem repetir valores", () => {
    const proibidos = [/\d\s?%/, /R\$/, /\d{2}\/\d{2}\/\d{4}/, /\bn[º°]\s?\d/, /\b(?:IN RFB|Lei|Decreto|ADE)\b.{0,12}\d/, /último dia útil/i];
    const prosa = [
      ...Object.values(paginas).flat().flatMap((s) => [...s.iniciante, ...s.profissional]),
      ...quiz.perguntas.flatMap((p) => [p.texto, p.ajuda, ...p.opcoes.map((o) => o.texto)]),
      ...quiz.resultados.flatMap((r) => [r.titulo, r.iniciante, r.profissional]),
      ...quiz.complementos.map((c) => c.texto),
      ...linhaDoTempo.flatMap((e) => [e.titulo, e.iniciante, e.profissional]),
    ];
    for (const t of prosa) for (const p of proibidos) expect(t).not.toMatch(p);
    const ids = [...Object.values(paginas).flat(), ...quiz.resultados, ...quiz.complementos].flatMap((x) => x.regras);
    for (const id of ids) for (const a of anos) expect(() => regra(id, a), id).not.toThrow();
  });

  test("[SG-008] links do conteúdo só para fontes oficiais", () => {
    const bruto = ["regras/multas", "regras/prazos", "regras/obrigatoriedade", "regras/definicao", "regras/retificacao", "linha-do-tempo", "fontes"]
      .map((f) => readFileSync(`content/${f}.json`, "utf8"))
      .join("");
    const hosts = new Set([...bruto.matchAll(/https?:\/\/([^/"]+)/g)].map((m) => m[1]));
    expect([...hosts].sort()).toEqual([
      "normas.receita.fazenda.gov.br",
      "normasinternet2.receita.fazenda.gov.br",
      // Notícias do STF sobre as ações contra a LC 224 (etapa 4).
      "noticias.stf.jus.br",
      "www.gov.br",
      "www.planalto.gov.br",
    ]);
  });
});
