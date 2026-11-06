import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { PageIntro } from "@/components/layout/page-intro";
import { getCategories, isCategorySlug } from "@/lib/catalog";
import { getDictionary, isLocale, languageAlternates, type Locale } from "@/lib/i18n";
import { getLocalizedProducts } from "@/lib/products";

export async function generateMetadata({ params }: PageProps<"/[lang]/produits">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.meta.catalogTitle,
    description: t.meta.catalogDescription,
    alternates: { canonical: `/${lang}/produits`, ...languageAlternates("/produits") },
  };
}

export default async function Page({ params, searchParams }: PageProps<"/[lang]/produits">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <div className="px-5 pb-24 pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <PageIntro eyebrow={t.catalog.eyebrow} title={t.catalog.title} lead={t.catalog.lead} />
        <div className="mt-12">
          <Suspense fallback={<p className="min-h-[50vh] text-muted">{t.catalog.loading}</p>}>
            <Catalog lang={lang} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Catalog({ lang, searchParams }: { lang: Locale; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [query, products] = await Promise.all([searchParams, getLocalizedProducts(lang)]);
  const categorie = typeof query.categorie === "string" ? query.categorie : undefined;
  const initialCategory = isCategorySlug(categorie) ? categorie : "tous";

  return (
    <CatalogBrowser key={initialCategory} products={products} categories={getCategories(lang)} initialCategory={initialCategory} />
  );
}
