import type { MetadataRoute } from "next";
import { INDEXAR, OCULTO, SITE } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Oculto: o robô precisa poder ler a página para ver o noindex. Bloqueado aqui, o endereço ainda poderia ser listado.
  if (OCULTO) return { rules: { userAgent: "*", allow: "/" } };
  return INDEXAR
    ? { rules: { userAgent: "*", allow: "/", disallow: "/dados/" }, sitemap: `${SITE}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
