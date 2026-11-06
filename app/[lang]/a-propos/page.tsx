import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { format, getDictionary, isLocale, languageAlternates, localePath } from "@/lib/i18n";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/a-propos">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.meta.aboutTitle,
    description: t.meta.aboutDescription,
    alternates: { canonical: `/${lang}/a-propos`, ...languageAlternates("/a-propos") },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/a-propos">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const values = {
    legalName: site.legalName,
    legalForm: t.about.legalForm,
    city: t.site.city,
    incorporated: t.about.incorporated,
  };

  return (
    <div className="px-5 pb-24 pt-28 md:pt-36">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-gold">
            <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
            {t.site.city}
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl">{t.about.title}</h1>
          <div className="mt-8 space-y-5 text-lg leading-8 text-muted">
            <p>{format(t.about.p1, values)}</p>
            <p>{t.about.p2}</p>
            <p>{t.about.p3}</p>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line text-sm">
            {[
              [t.about.form, t.about.legalForm],
              [t.about.capital, t.about.capitalValue],
              [t.about.ice, site.ice],
              [t.about.rc, `${site.rc} · ${t.site.city}`],
            ].map(([label, value]) => (
              <div key={label} className="bg-card p-5">
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 text-base text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link href={localePath(lang, "/contact")}>{t.about.cta}</Link>
            </Button>
          </div>
        </Reveal>
        <Reveal className="relative min-h-[28rem] overflow-hidden lg:col-span-6" delay={0.1}>
          <Image src="/images/warehouse.jpg" alt={t.about.imageAlt} fill className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
        </Reveal>
      </div>
    </div>
  );
}
