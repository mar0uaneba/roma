import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home/home-page";
import { getDictionary, isLocale, languageAlternates } from "@/lib/i18n";
import { getFeaturedProducts } from "@/lib/products";
import { site, siteAddress } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: { absolute: t.meta.siteTitle },
    description: t.meta.homeDescription,
    alternates: { canonical: `/${lang}`, ...languageAlternates("/") },
  };
}

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const featured = await getFeaturedProducts(lang, 6);
  const address = siteAddress(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WholesaleStore",
    name: site.name,
    description: t.site.activity,
    url: `${site.url}/${lang}`,
    image: `${site.url}/images/kraft-bag.jpg`,
    inLanguage: lang,
    address: {
      "@type": "PostalAddress",
      addressLocality: t.site.city,
      addressCountry: "MA",
      ...(address ? { streetAddress: address } : {}),
    },
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
    areaServed: "MA",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HomePage lang={lang} featured={featured} />
    </>
  );
}
