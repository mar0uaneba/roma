import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { getCategories, getCategory } from "@/lib/catalog";
import { format, getDictionary, isLocale, languageAlternates, localePath, locales } from "@/lib/i18n";
import { getLocalizedProducts, getProduct, getPublicProducts } from "@/lib/products";
import { site, whatsappHref } from "@/lib/site";

export async function generateStaticParams() {
  const products = await getPublicProducts();
  return locales.flatMap((lang) => products.map((product) => ({ lang, slug: product.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/produits/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const product = await getProduct(slug, lang);
  if (!product) return { title: getDictionary(lang).meta.product };
  return {
    title: product.name,
    description: product.summary,
    alternates: { canonical: `/${lang}/produits/${slug}`, ...languageAlternates(`/produits/${slug}`) },
    openGraph: { images: [{ url: product.image, alt: product.imageAlt }] },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/produits/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const [product, products] = await Promise.all([getProduct(slug, lang), getLocalizedProducts(lang)]);
  if (!product) notFound();

  const category = getCategory(product.category, lang);
  const categoryNames = Object.fromEntries(getCategories(lang).map((item) => [item.slug, item.name]));
  const related = products.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 3);
  const whatsapp = whatsappHref(format(t.product.whatsappMessage, { name: product.name }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    image: product.image.startsWith("http") ? product.image : `${site.url}${product.image}`,
    category: category?.name,
    brand: { "@type": "Brand", name: site.name },
  };

  return (
    <article className="px-5 pb-24 pt-28 md:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center gap-2 text-xs text-muted">
        <Link href={localePath(lang, "/produits")} className="hover:text-ink">
          {t.nav.catalog}
        </Link>
        <ChevronRight className="size-3 rtl:-scale-x-100" aria-hidden="true" />
        <Link href={localePath(lang, `/produits?categorie=${product.category}`)} className="hover:text-ink">
          {category?.name}
        </Link>
        <ChevronRight className="size-3 rtl:-scale-x-100" aria-hidden="true" />
        <span className="text-ink" aria-current="page">
          {product.name}
        </span>
      </nav>
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden bg-line lg:sticky lg:top-28">
            <Image src={product.image} alt={product.imageAlt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">{category?.name}</p>
          <h1 className="mt-3 font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl">{product.name}</h1>
          <p className="mt-6 text-lg leading-8 text-muted">{product.summary}</p>
          <p className="mt-6 leading-7">{product.description}</p>
          <dl className="mt-10 grid gap-8 border-y border-line py-8 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted">{t.product.uses}</dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {product.applications.map((item) => (
                  <span key={item} className="rounded-full border border-line bg-card px-3 py-1 text-sm">
                    {item}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted">{t.product.formats}</dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {product.formats.map((item) => (
                  <span key={item} className="rounded-full border border-line bg-card px-3 py-1 text-sm">
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={localePath(lang, `/contact?produit=${product.slug}`)}>{t.product.request}</Link>
            </Button>
            {whatsapp ? (
              <Button asChild size="lg" variant="outline">
                <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="size-4" />
                  {t.product.askWhatsapp}
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link href={localePath(lang, "/produits")}>{t.common.backToCatalog}</Link>
              </Button>
            )}
          </div>
        </Reveal>
      </div>
      {related.length > 0 ? (
        <div className="mx-auto mt-24 max-w-6xl">
          <h2 className="font-serif text-3xl text-ink md:text-4xl">{t.product.related}</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} categoryName={categoryNames[item.category]} />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
