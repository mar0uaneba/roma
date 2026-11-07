import type { Metadata } from "next";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { getCategories, getCategory, isPurchasable } from "@/lib/catalog";
import { AddToCart } from "@/components/shop/add-to-cart";
import { formatMoney } from "@/lib/shop/money";
import { format, getDictionary, isLocale, languageAlternates, localePath, locales } from "@/lib/i18n";
import { getTrust } from "@/lib/i18n/trust";
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
  const trust = getTrust(lang);
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
        <div className="relative">
          <ProductGallery images={[product.image, ...(product.images ?? [])]} alt={product.imageAlt} label={lang === "ar" ? "صورة" : "Photo"} />
        </div>
        <Reveal delay={0.1}>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">{category?.name}</p>
          <h1 className="mt-3 font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl">{product.name}</h1>
          <div className="line-grow mt-6 h-px w-24 bg-gradient-to-r from-accent to-gold rtl:bg-gradient-to-l" aria-hidden="true" />
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
          {isPurchasable(product) ? (
            <div className="mt-8 border-t border-line pt-8">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">{t.shop.priceFrom}</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="font-serif text-4xl text-ink ltr-nums">{formatMoney(product.price!, lang)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price! ? (
                  <span className="text-lg text-muted line-through ltr-nums">{formatMoney(product.compareAtPrice, lang)}</span>
                ) : null}
                {product.unit ? <span className="text-muted">{format(t.shop.perUnit, { unit: product.unit })}</span> : null}
              </p>
              {product.minQty && product.minQty > 1 ? <p className="mt-1 text-sm text-muted">{format(t.shop.minQty, { n: product.minQty })}</p> : null}
              <div className="mt-5">
                <AddToCart slug={product.slug} minQty={product.minQty ?? 1} name={product.name} />
              </div>
              <p className="mt-3 text-sm text-muted">{t.shop.vatNote}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <Link href={localePath(lang, `/contact?produit=${product.slug}`)} className="underline decoration-accent underline-offset-4">
                  {t.common.requestQuote}
                </Link>
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-4">
                    <WhatsAppIcon className="size-4" />
                    {t.product.askWhatsapp}
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              {product.status === "sold_out" ? <p className="w-full text-sm font-medium text-accent">{t.shop.soldOut}</p> : null}
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
          )}
          <ul className="mt-10 grid gap-3 border-t border-line pt-8 sm:grid-cols-3">
            {trust.productTrust.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm text-ink">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            {site.legalName} · SARL AU · ICE <span className="ltr-nums">{site.ice}</span> · RC <span className="ltr-nums">{site.rc}</span>
          </p>
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
