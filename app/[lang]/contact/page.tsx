import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuoteForm } from "@/components/forms/quote-form";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { getCategories, getSectors } from "@/lib/catalog";
import { getDictionary, isLocale, languageAlternates, type Locale } from "@/lib/i18n";
import { getLocalizedProducts } from "@/lib/products";
import { site, siteAddress, telHref, whatsappHref } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.meta.contactTitle,
    description: t.meta.contactDescription,
    alternates: { canonical: `/${lang}/contact`, ...languageAlternates("/contact") },
  };
}

export default async function Page({ params, searchParams }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const whatsapp = whatsappHref(t.contact.whatsappMessage);
  const address = siteAddress(lang);

  return (
    <div className="px-5 pb-24 pt-28 md:pt-36">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-gold">
            <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
            {t.contact.eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight text-ink">{t.contact.title}</h1>
          <p className="mt-5 leading-7 text-muted">{t.contact.lead}</p>
          <ul className="mt-10 divide-y divide-line border-y border-line text-sm">
            <li className="flex items-center gap-4 py-4">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                {address ? `${address}, ` : ""}
                {t.site.city}, {t.site.country}
              </span>
            </li>
            {site.phone ? (
              <li className="flex items-center gap-4 py-4">
                <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
                <a href={telHref(site.phone)} className="ltr-nums hover:text-accent">
                  {site.phone}
                </a>
              </li>
            ) : null}
            {site.email ? (
              <li className="flex items-center gap-4 py-4">
                <Mail className="size-4 shrink-0 text-accent" aria-hidden="true" />
                <a href={`mailto:${site.email}`} className="ltr-nums hover:text-accent">
                  {site.email}
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li className="flex items-center gap-4 py-4">
                <WhatsAppIcon className="size-4 shrink-0 text-[#1f6b45]" />
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                  {t.common.writeWhatsapp}
                </a>
              </li>
            ) : null}
            <li className="flex items-center gap-4 py-4 text-muted">
              <Clock className="size-4 shrink-0 text-accent" aria-hidden="true" />
              {t.contact.hours}
            </li>
          </ul>
          {!site.phone && !site.email && !whatsapp ? <p className="mt-6 text-sm leading-6 text-muted">{t.contact.formOnly}</p> : null}
        </div>
        <div className="border border-line bg-card p-6 shadow-[0_30px_80px_-40px_rgba(14,13,12,0.25)] md:p-10 lg:col-span-7">
          <Suspense fallback={<div className="min-h-[36rem]" />}>
            <Form lang={lang} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Form({ lang, searchParams }: { lang: Locale; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [query, products] = await Promise.all([searchParams, getLocalizedProducts(lang)]);
  const produit = typeof query.produit === "string" ? query.produit : undefined;
  // The value sent to the back office stays in French so the team reads one language.
  const frProducts = await getLocalizedProducts("fr");
  const initialProduct = frProducts.find((product) => product.slug === produit)?.name ?? "";

  return (
    <QuoteForm
      products={products.map((product) => ({
        label: product.name,
        value: frProducts.find((item) => item.slug === product.slug)?.name ?? product.name,
      }))}
      categories={getCategories(lang).map((category, index) => ({
        label: category.name,
        value: getCategories("fr")[index]?.name ?? category.name,
      }))}
      sectors={getSectors(lang).map((sector, index) => ({
        label: sector.name,
        value: getSectors("fr")[index]?.name ?? sector.name,
      }))}
      initialProduct={initialProduct}
    />
  );
}
