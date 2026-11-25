import type { MetadataRoute } from "next";
import { INDEXAR, SITE } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return INDEXAR
    ? { rules: { userAgent: "*", allow: "/", disallow: "/dados/" }, sitemap: `${SITE}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
