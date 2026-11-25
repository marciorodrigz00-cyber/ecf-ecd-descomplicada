import { ANO_PADRAO, glossario, leiauteDoAno, novidades } from "@/lib/conteudo";
import { didatico, registrosDoAno } from "@/lib/conteudo/leiautes";
import { exemplos } from "@/lib/exemplos";
import { SECOES, rota } from "@/lib/rotas";
import { TIPOS, type LinhaIndice, type TipoItem } from "./index";

/** Índice de um ano, montado no build. Fica fora da página e só é buscado ao abrir a busca. */
export function montarIndice(ano: number): LinhaIndice[] {
  const ir = (b: string) => rota(b, ano, ANO_PADRAO);
  const n = (t: TipoItem) => TIPOS.indexOf(t);
  const registro = (c: string) => `/blocos/${c[0]!.toLowerCase()}/${c.toLowerCase()}`;
  const registros = registrosDoAno(ano);
  return [
    ...leiauteDoAno(ano).blocos.map((b): LinhaIndice => [n("bloco"), b.letra, `Bloco ${b.letra}: ${didatico(b.letra).curto}`, ir(`/blocos/${b.letra.toLowerCase()}`), b.nome]),
    ...SECOES.map((s): LinhaIndice => [n("secao"), "", s.titulo, ir(`/${s.slug}`), `${s.curto} ${s.profissional}`]),
    [n("secao"), "", "Roteiro de preenchimento", ir("/preencher"), "passo a passo preencher"],
    [n("secao"), "", "Fontes e verificações", ir("/fontes"), "fonte oficial norma"],
    ...exemplos.map((e): LinhaIndice => [n("secao"), "", `Exemplo: ${e.dados.titulo}`, ir(`/exemplos/${e.dados.slug}`), `${e.dados.regime} empresa fictícia`]),
    ...glossario.map((t): LinhaIndice => [n("termo"), "", t.termo, ir(`/glossario#${t.id}`), t.sinonimos.join(" ")]),
    ...registros.map((r): LinhaIndice => [n("registro"), r.codigo, r.nome, ir(registro(r.codigo)), `bloco ${r.codigo[0]}`]),
    ...novidades.map((x): LinhaIndice => [n("novidade"), "", x.titulo, ir(`/novidades/${x.slug}`), `${x.tipo} ${x.norma}`]),
    // O REG se repete em todos: não ajuda a achar nada.
    ...registros.flatMap((r) =>
      r.campos.slice(1).map((c): LinhaIndice => {
        const d = c.descricao.replace(/\s+/g, " ");
        return [n("campo"), `${r.codigo}.${c.nome}`, d.length > 90 ? `${d.slice(0, 89)}…` : d, ir(`${registro(r.codigo)}#campo-${c.numero}`), ""];
      }),
    ),
  ];
}
