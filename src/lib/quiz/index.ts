import type { Quiz } from "@/schemas";

type Pergunta = Quiz["perguntas"][number];
type Resultado = Quiz["resultados"][number];
type Complemento = Quiz["complementos"][number];

export type Estado =
  | { tipo: "pergunta"; pergunta: Pergunta; passo: number }
  | { tipo: "resultado"; resultado: Resultado; complementos: Complemento[]; passo: number };

/** Função pura: as respostas (ids de opção, em ordem) determinam o estado. */
export function avaliar(quiz: Quiz, respostas: readonly string[]): Estado {
  const complementos: Complemento[] = [];
  let pergunta = achar(quiz.perguntas, quiz.inicio);
  for (const [i, resposta] of respostas.entries()) {
    const opcao = achar(pergunta.opcoes, resposta);
    if (opcao.complemento) complementos.push(achar(quiz.complementos, opcao.complemento));
    if ("resultado" in opcao) {
      if (i !== respostas.length - 1) throw new Error("Resposta depois do resultado");
      return { tipo: "resultado", resultado: achar(quiz.resultados, opcao.resultado), complementos, passo: i + 1 };
    }
    pergunta = achar(quiz.perguntas, opcao.proximo);
  }
  return { tipo: "pergunta", pergunta, passo: respostas.length + 1 };
}

function achar<T extends { id: string }>(itens: readonly T[], id: string): T {
  const item = itens.find((x) => x.id === id);
  if (!item) throw new Error(`Quiz: "${id}" não existe`);
  return item;
}

/** Percorre todos os caminhos: sem ciclo, sem referência quebrada, sem item inalcançável. */
export function validarQuiz(quiz: Quiz): string[][] {
  const caminhos: string[][] = [];
  const vistos = new Set<string>();
  const andar = (respostas: string[]) => {
    if (respostas.length > quiz.perguntas.length) throw new Error("Quiz com ciclo");
    const e = avaliar(quiz, respostas);
    if (e.tipo === "resultado") {
      vistos.add(`r:${e.resultado.id}`);
      for (const c of e.complementos) vistos.add(`c:${c.id}`);
      caminhos.push(respostas);
      return;
    }
    vistos.add(`p:${e.pergunta.id}`);
    for (const o of e.pergunta.opcoes) andar([...respostas, o.id]);
  };
  andar([]);
  const todos = [
    ...quiz.perguntas.map((x) => `p:${x.id}`),
    ...quiz.resultados.map((x) => `r:${x.id}`),
    ...quiz.complementos.map((x) => `c:${x.id}`),
  ];
  const soltos = todos.filter((x) => !vistos.has(x));
  if (soltos.length) throw new Error(`Quiz com itens inalcançáveis: ${soltos.join(", ")}`);
  return caminhos;
}
