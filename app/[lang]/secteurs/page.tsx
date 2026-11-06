import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/layout/page-intro";
import { Reveal } from "@/components/motion/reveal";
import { getCategory, getSectors } from "@/lib/catalog";
import { getDictionary, isLocale, languageAlternates, localePath } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/secteurs">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.meta.sectorsTitle,
    description: t.meta.sectorsDescription,
    alternates: { canonical: `/${lang}/secteurs`, ...languageAlternates("/secteurs") },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/secteurs">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const sectors = getSectors(lang);

  return (
    <div className="px-5 pb-24 pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <PageIntro eyebrow={t.sectors.eyebrow} title={t.sectors.title} />
        <div className="mt-14 grid gap-8">
          {sectors.map((sector, index) => (
            <Reveal key={sector.slug}>
              <article
                id={sector.slug}
                className="group grid scroll-mt-28 overflow-hidden border border-line bg-card md:grid-cols-12"
              >
                <div className={`relative min-h-64 overflow-hidden md:col-span-5 ${index % 2 ? "md:order-last" : ""}`}>
                  <Image src={sector.image} alt={sector.imageAlt} fill className="media-zoom object-cover" sizes="(min-width: 768px) 40vw, 100vw" />
                </div>
                <div className="flex flex-col justify-center p-8 md:col-span-7 md:p-12">
                  <p className="text-xs tracking-[0.18em] text-accent ltr-nums">0{index + 1}</p>
                  <h2 className="mt-3 font-serif text-4xl text-ink">{sector.name}</h2>
                  <p className="mt-4 max-w-lg text-muted">{sector.text}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {sector.categories.map((slug) => (
                      <Link
                        key={slug}
                        href={localePath(lang, `/produits?categorie=${slug}`)}
                        className="rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-ink hover:bg-ink hover:text-background"
                      >
                        {getCategory(slug, lang)?.name ?? slug}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
