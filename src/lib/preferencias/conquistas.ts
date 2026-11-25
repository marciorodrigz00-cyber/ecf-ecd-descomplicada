import type { Preferencias } from "./modelo";

export const TOTAL_BLOCOS = 17;
export type Conquista = { id: string; titulo: string; como: string; feito: number; meta: number };

/** Tudo sai das preferências salvas neste navegador. Nada é enviado. */
export function conquistas(p: Preferencias, totalSecoes: number): Conquista[] {
  const secoes = Math.min(p.estudadas.length, totalSecoes);
  const item = (id: string, titulo: string, como: string, feito: number, meta: number): Conquista => ({
    id, titulo, como, feito: Math.min(feito, meta), meta,
  });
  const fez = (x: string) => (p.feitos.includes(x) ? 1 : 0);
  return [
    item("primeiro-passo", "Primeiro passo", "Marque uma seção como estudada", secoes, 1),
    item("percurso", "Fluxo completo", "Percorra o mapa do começo ao fim", fez("percurso"), 1),
    item("quiz", "Sei quem entrega", "Chegue ao resultado do quiz", fez("quiz"), 1),
    item("simulador", "Mão na massa", "Mude um valor no simulador", fez("simulador"), 1),
    item("registros", "Leitor de registros", "Abra 10 registros", p.registros.length, 10),
    item("blocos", "Todos os blocos", `Abra os ${TOTAL_BLOCOS} blocos cobertos`, p.blocos.length, TOTAL_BLOCOS),
    item("meia-trilha", "Meia trilha", "Estude metade das seções", secoes, Math.ceil(totalSecoes / 2)),
    item("trilha", "Trilha concluída", "Estude todas as seções", secoes, totalSecoes),
  ];
}
