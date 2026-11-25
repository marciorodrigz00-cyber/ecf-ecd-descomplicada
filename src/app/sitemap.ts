import type { MetadataRoute } from "next";
import { ANO_PADRAO, anos, leiauteDoAno, novidades } from "@/lib/conteudo";
import { registrosDoAno } from "@/lib/conteudo/leiautes";
import { exemplos } from "@/lib/exemplos";
import { SECOES, rota } from "@/lib/rotas";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";

/** Só endereços canônicos. A data é a da última verificação, não a do build. */
export default function sitemap(): MetadataRoute.Sitemap {
  const doAno = (ano: number) => {
    const l = leiauteDoAno(ano);
    const bases = [
      "/",
      ...SECOES.map((s) => `/${s.slug}`),
      "/preencher",
      "/fontes",
      ...exemplos.map((e) => `/exemplos/${e.dados.slug}`),
      ...l.blocos.map((b) => `/blocos/${b.letra.toLowerCase()}`),
      ...registrosDoAno(ano).map((r) => `/blocos/${r.codigo[0]!.toLowerCase()}/${r.codigo.toLowerCase()}`),
    ];
    return bases.map((b) => ({ url: SITE + rota(b, ano, ANO_PADRAO), lastModified: l.verificadoEm }));
  };
  return [
    ...anos.flatMap(doAno),
    // A novidade é uma só, qualquer que seja o ano.
    ...novidades.map((n) => ({ url: `${SITE}/novidades/${n.slug}`, lastModified: n.verificadoEm })),
  ];
}
