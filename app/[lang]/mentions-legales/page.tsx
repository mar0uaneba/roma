import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format, getDictionary, isLocale, languageAlternates } from "@/lib/i18n";
import { site, siteAddress } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/mentions-legales">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: getDictionary(lang).meta.legalTitle,
    alternates: { canonical: `/${lang}/mentions-legales`, ...languageAlternates("/mentions-legales") },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/mentions-legales">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const address = siteAddress(lang);
  const contact = [site.email ?? t.legal.contactPending, site.phone].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:pt-40">
      <h1 className="font-serif text-5xl text-ink">{t.meta.legalTitle}</h1>
      <div className="mt-10 space-y-4 leading-7 text-muted">
        <p>{format(t.legal.publisher, { legalName: site.legalName, legalForm: t.about.legalForm, capital: t.about.capitalValue })}</p>
        <p>
          {format(t.legal.seat, { address: address ?? `${t.site.city}, ${t.site.country}` })}
          {address ? null : ` ${t.legal.seatPending}`}
        </p>
        <p>{format(t.legal.registration, { rc: site.rc, city: t.site.city, ice: site.ice, incorporated: t.about.incorporated })}</p>
        <p>{format(t.legal.activity, { activity: t.site.activity })}</p>
        <p>{format(t.legal.contact, { contact })}</p>
        <p>{t.legal.hosting}</p>
        <p>{t.legal.photos}</p>
      </div>
    </div>
  );
}
