import { readdirSync } from "node:fs";
import path from "node:path";
import * as S from "@/schemas";
import { conferirRastreio, fontes, ler, regras } from "./index";
import { registroDoAno } from "./leiautes";

/** Ordem do hub: primeiro o que muda, depois o que não muda, por fim o que falta conferir. */
const ORDEM: readonly S.Incentivo["situacao"][] = ["reduzido", "excetuado", "nao-beneficio", "a-verificar"];

/** Fichas de incentivo (etapa 4). Conteúdo inválido, fonte desconhecida ou registro inexistente derrubam o build. */
export const incentivos: S.Incentivo[] = readdirSync(path.join(process.cwd(), "content", "incentivos"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const i = ler(`incentivos/${f}`, S.Incentivo);
    if (f !== `${i.id}.json`) throw new Error(`incentivos/${f}: o nome do arquivo precisa ser o id`);
    return i;
  })
  .sort((a, b) => ORDEM.indexOf(a.situacao) - ORDEM.indexOf(b.situacao) || a.curto.localeCompare(b.curto, "pt-BR"));

/** O leiaute 12 é o que documenta a LC nº 224 (situações especiais de 2026): os registros citados precisam existir nele. */
const ANO_DOS_REGISTROS = 2025;

for (const i of incentivos) {
  // O id da ficha é endereço da página: espaço próprio, sem misturar com os ids das regras.
  conferirRastreio({ ...i, id: `incentivo-${i.id}` });
  const citadas = [...i.porAno.map((p) => p.fonte), ...(i.judicial?.fontes ?? []), ...(i.exemplo ? [i.exemplo.fonte] : [])];
  for (const f of citadas) {
    const doCatalogo = fontes.find((x) => x.id === f.id);
    if (!doCatalogo) throw new Error(`incentivo ${i.id}: fonte inexistente (${f.id})`);
    if (doCatalogo.url !== f.url) throw new Error(`incentivo ${i.id}: a URL da fonte ${f.id} difere do catálogo`);
  }
  for (const r of i.registros) if (!registroDoAno(r, ANO_DOS_REGISTROS)) throw new Error(`incentivo ${i.id}: registro ${r} não existe no leiaute 12`);
  for (const p of i.porAno) {
    for (const id of p.regras) {
      if (!regras.some((x) => x.id === id && x.vigencia.acNormal.includes(p.ac))) throw new Error(`incentivo ${i.id}: regra ${id} não vale para o AC ${p.ac}`);
    }
  }
}

export const incentivo = (id: string) => incentivos.find((i) => i.id === id);

/** Fichas que citam um registro: alimentam o selo "Incentivos neste registro". */
export const incentivosDoRegistro = (codigo: string) => incentivos.filter((i) => i.registros.includes(codigo));
export const incentivosDoBloco = (letra: string) => incentivos.filter((i) => i.registros.some((r) => r[0] === letra));

/** Página especial da lei: linha do tempo e o que muda na ECF por ano (content/lc224.json). */
export const lc224 = ler("lc224.json", S.PaginaLc224);
for (const e of lc224.linha) conferirRastreio(e);
for (const f of [...lc224.linha.map((e) => e.fonte), ...lc224.naEcf.map((x) => x.fonte)]) {
  const doCatalogo = fontes.find((x) => x.id === f.id);
  if (!doCatalogo) throw new Error(`lc224.json: fonte inexistente (${f.id})`);
  if (doCatalogo.url !== f.url) throw new Error(`lc224.json: a URL da fonte ${f.id} difere do catálogo`);
}
