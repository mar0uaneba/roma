import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format, getDictionary, isLocale, languageAlternates } from "@/lib/i18n";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/confidentialite">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: getDictionary(lang).meta.privacyTitle,
    alternates: { canonical: `/${lang}/confidentialite`, ...languageAlternates("/confidentialite") },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/confidentialite">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:pt-40">
      <h1 className="font-serif text-5xl text-ink">{t.meta.privacyTitle}</h1>
      <div className="mt-10 space-y-4 leading-7 text-muted">
        <p>{t.privacy.p1}</p>
        <p>{t.privacy.p2}</p>
        <p>{t.privacy.p3}</p>
        <p>{format(t.privacy.p4, { email: site.email ?? t.privacy.p4Pending })}</p>
        <p>{t.privacy.p5}</p>
      </div>
    </div>
  );
}
