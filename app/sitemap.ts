import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getPublicProducts } from "@/lib/products";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublicProducts();
  const paths = [
    "",
    "/produits",
    "/secteurs",
    "/a-propos",
    "/contact",
    "/mentions-legales",
    "/confidentialite",
    ...products.map((product) => `/produits/${product.slug}`),
  ];

  return paths.flatMap((path) =>
    locales.map((lang) => ({
      url: `${site.url}/${lang}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : path.startsWith("/produits/") ? 0.6 : 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((other) => [`${other}-MA`, `${site.url}/${other}${path}`])),
      },
    })),
  );
}
