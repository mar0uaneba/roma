import { ArrowRight, Boxes, Check, FileText, HandCoins, Palette, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Dieline } from "@/components/home/dieline";
import { Faq } from "@/components/home/faq";
import { FeaturedRail } from "@/components/home/featured-rail";
import { Hero, type HeroSlide } from "@/components/home/hero";
import { LegalCard } from "@/components/home/legal-card";
import { RangeStage } from "@/components/home/range-stage";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { getCategories, getSectors, type Product } from "@/lib/catalog";
import { format, getDictionary, localePath, type Locale } from "@/lib/i18n";
import { getTrust } from "@/lib/i18n/trust";
import { site, whatsappHref } from "@/lib/site";

const pillarIcons = [Boxes, Palette, FileText];
const trustIcons = [ShieldCheck, HandCoins, FileText, Palette];

const showcaseTiles = [
  { image: "/images/croissant.jpg", href: "/produits?categorie=sacs", span: "md:col-span-4 md:row-span-2" },
  { image: "/images/paper-cup.jpg", href: "/produits?categorie=boissons", span: "md:col-span-4" },
  { image: "/images/bowl.jpg", href: "/produits?categorie=barquettes", span: "md:col-span-4" },
  { image: "/images/gifts.jpg", href: "/produits?categorie=personnalisation", span: "md:col-span-3" },
  { image: "/images/mailer-box.jpg", href: "/produits?categorie=expedition", span: "md:col-span-5" },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-gold">
      <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
      {children}
    </p>
  );
}

export function HomePage({ lang, featured }: { lang: Locale; featured: Product[] }) {
  const t = getDictionary(lang);
  const trust = getTrust(lang);
  const categories = getCategories(lang);
  const sectors = getSectors(lang);
  const categoryNames = Object.fromEntries(categories.map((category) => [category.slug, category.name]));
  const whatsapp = whatsappHref(t.contact.whatsappMessage);

  const slides: HeroSlide[] = ["sacs", "patisserie", "expedition", "boissons"].flatMap((slug) => {
    const category = categories.find((item) => item.slug === slug);
    return category
      ? [{ image: category.image, alt: category.imageAlt, label: category.name, href: localePath(lang, `/produits?categorie=${slug}`) }]
      : [];
  });

  return (
    <>
      <Hero slides={slides} whatsapp={whatsapp} />

      {/* Material marquee — kept LTR so the loop direction is identical in both languages. */}
      <div className="marquee overflow-hidden border-y border-ink bg-ink text-background" dir="ltr">
        <div className="marquee-track gap-10">
          {[0, 1].map((copy) => (
            <p key={copy} className="flex items-center gap-10 whitespace-nowrap py-4 pe-10" aria-hidden={copy === 1}>
              {t.home.materials.map((item) => (
                <span key={item} className="flex items-center gap-10 text-xs uppercase tracking-[0.28em]" lang={lang}>
                  {item}
                  <span className="inline-block size-1.5 rotate-45 bg-accent" aria-hidden="true" />
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      {/* Trust bar: verifiable commitments only. */}
      <section aria-label={trust.barLabel} className="border-b border-line bg-card">
        <ul className="mx-auto grid max-w-6xl sm:grid-cols-2 lg:grid-cols-4">
          {trust.items.map((item, index) => {
            const Icon = trustIcons[index] ?? ShieldCheck;
            return (
              <li
                key={item.title}
                data-spotlight=""
                className="spotlight relative flex items-start gap-4 border-line px-5 py-7 sm:[&:nth-child(2n)]:border-s lg:border-s lg:first:border-s-0 max-lg:[&:nth-child(n+3)]:border-t max-sm:[&:nth-child(n+2)]:border-t"
              >
                <span className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-background text-accent">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-serif text-lg text-ink">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{format(item.text, { rc: site.rc, ice: site.ice })}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>{t.home.pillarsEyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-tight text-ink md:text-5xl">{t.home.pillarsTitle}</h2>
          </Reveal>
          <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3 lg:col-span-7">
            {t.home.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index] ?? Boxes;
              return (
                <Reveal key={pillar.title} delay={index * 0.1} className="group h-full bg-card transition-colors duration-500 hover:bg-ink hover:text-background">
                  <div data-spotlight="" className="spotlight spotlight-light relative h-full p-6">
                  <Icon className="size-6 text-accent" strokeWidth={1.4} aria-hidden="true" />
                  <h3 className="mt-10 font-serif text-2xl">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted transition-colors group-hover:text-background/70">{pillar.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ranges */}
      <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>{t.home.rangesEyebrow}</Eyebrow>
            <h2 className="mt-4 max-w-xl font-serif text-4xl tracking-tight text-ink md:text-6xl">{t.home.rangesTitle}</h2>
          </div>
          <Link
            href={localePath(lang, "/produits")}
            className="hidden text-sm text-ink underline decoration-accent decoration-2 underline-offset-4 md:inline"
          >
            {t.common.allCatalog}
          </Link>
        </Reveal>
        <div className="mt-12">
          <RangeStage categories={categories} />
        </div>
      </section>

      {/* Showcase bento */}
      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <Eyebrow>{t.home.showcaseEyebrow}</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl tracking-tight text-ink md:text-6xl">{t.home.showcaseTitle}</h2>
          </Reveal>
          <div className="mt-12 grid auto-rows-[15rem] gap-4 md:auto-rows-[17rem] md:grid-cols-12">
            {showcaseTiles.map((tile, index) => {
              const copy = t.home.showcase[index];
              return (
                <Reveal key={tile.image} delay={(index % 3) * 0.08} className={tile.span}>
                  <Link
                    href={localePath(lang, tile.href)}
                    data-spotlight=""
                    className="spotlight spotlight-light sd-unveil group relative block h-full overflow-hidden bg-ink"
                  >
                    <div className="sd-parallax absolute inset-0">
                      <Image
                        src={tile.image}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 40vw, 100vw"
                        className="media-zoom object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-background md:p-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-background/60">{copy?.text}</p>
                        <h3 className="mt-1 font-serif text-2xl md:text-3xl">{copy?.title}</h3>
                      </div>
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-background/30 transition-all duration-500 group-hover:border-accent group-hover:bg-accent">
                        <ArrowRight className="size-4 -rotate-45 transition-transform duration-500 group-hover:rotate-0 rtl:-scale-x-100" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 ? (
        <section className="grain relative overflow-hidden bg-ink py-20 text-background md:py-28">
          <Reveal className="mx-auto flex max-w-6xl items-end justify-between px-5">
            <div>
              <Eyebrow>{t.home.featuredEyebrow}</Eyebrow>
              <h2 className="mt-4 font-serif text-4xl tracking-tight md:text-6xl">{t.home.featuredTitle}</h2>
            </div>
          </Reveal>
          <FeaturedRail products={featured} categoryNames={categoryNames} />
        </section>
      ) : null}

      {/* Custom branding */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>{t.home.brandEyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-tight text-ink md:text-5xl">{t.home.brandTitle}</h2>
            <p className="mt-6 leading-7 text-muted">{t.home.brandText}</p>
            <ul className="mt-8 space-y-3">
              {t.home.brandPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-ink">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-10" size="lg" variant="ink">
              <Link href={localePath(lang, "/contact?produit=emballages-personnalises")}>{t.home.brandCta}</Link>
            </Button>
          </Reveal>
          <div className="relative lg:col-span-7">
            <div
              className="relative overflow-hidden border border-line bg-card p-6 text-ink md:p-10"
              style={{
                backgroundImage:
                  "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
                backgroundPosition: "-1px -1px",
              }}
            >
              <Dieline className="relative mx-auto w-full max-w-xl" label={t.home.dielineLabel} />
            </div>
            <div className="absolute -bottom-6 end-6 hidden w-40 overflow-hidden border-4 border-background shadow-2xl sm:block md:w-52">
              <div className="relative aspect-square">
                <Image src="/images/plain-box.jpg" alt="" fill sizes="208px" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <Reveal>
          <Eyebrow>{t.home.sectorsEyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-ink md:text-6xl">{t.home.sectorsTitle}</h2>
        </Reveal>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {sectors.map((sector, index) => (
            <Link
              key={sector.slug}
              href={localePath(lang, `/secteurs#${sector.slug}`)}
              className="group relative grid gap-3 py-6 md:grid-cols-12 md:items-center"
            >
              <span className="text-xs tracking-[0.18em] text-accent ltr-nums md:col-span-1">0{index + 1}</span>
              <h3 className="font-serif text-3xl text-ink transition-[color,transform] duration-500 group-hover:translate-x-2 group-hover:text-accent md:col-span-5 md:text-4xl rtl:group-hover:-translate-x-2">
                {sector.name}
              </h3>
              <p className="text-muted md:col-span-5">{sector.text}</p>
              <div className="pointer-events-none absolute end-0 top-1/2 hidden h-24 w-36 -translate-y-1/2 scale-90 overflow-hidden opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100 lg:block">
                <Image src={sector.image} alt="" fill sizes="144px" className="object-cover" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 pt-16 md:pt-20">
          <Reveal>
            <Eyebrow>{t.home.processEyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-ink md:text-5xl">{t.home.processTitle}</h2>
          </Reveal>
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pt-12">
          {/* Timeline rail that draws itself while scrolling. */}
          <div aria-hidden="true" className="absolute inset-x-5 top-[4.375rem] hidden h-px bg-line md:block">
            <div className="sd-draw h-full bg-gradient-to-r from-accent via-accent to-gold" />
          </div>
          <div className="grid gap-10 pb-16 md:grid-cols-3 md:gap-8 md:pb-20">
            {t.home.steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.12} className="relative">
                <div>
                  <span className="relative z-10 inline-flex size-11 items-center justify-center rounded-full border border-accent/40 bg-card font-serif text-lg text-accent shadow-[0_0_0_6px_var(--card)] ltr-nums">
                    0{index + 1}
                  </span>
                  <h3 className="mt-6 font-serif text-3xl text-ink">{step.title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Identity: who you are dealing with. */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>{trust.identityEyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-tight text-ink md:text-5xl">{trust.identityTitle}</h2>
            <p className="mt-6 max-w-md leading-7 text-muted">{trust.identityText}</p>
            <ul className="mt-8 space-y-3">
              {trust.productTrust.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-ink">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={0.12}>
            <LegalCard lang={lang} className="lift mx-auto max-w-xl rotate-[-0.6deg] lg:me-0" />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow>{t.home.faqEyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-ink md:text-5xl">{t.home.faqTitle}</h2>
          </Reveal>
          <div className="lg:col-span-8">
            <Faq items={t.home.faq} />
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="grain relative overflow-hidden bg-ink text-background">
        <div aria-hidden="true" className="absolute -end-40 -top-40 size-[36rem] rounded-full bg-accent/25 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-12 md:py-28">
          <Reveal className="md:col-span-7">
            <Eyebrow>{t.home.ctaEyebrow}</Eyebrow>
            <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">{t.home.ctaTitle}</h2>
            <p className="mt-6 max-w-md leading-7 text-background/70">{t.home.ctaText}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group">
                <Link href={localePath(lang, "/contact")}>
                  {t.home.ctaButton}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              {whatsapp ? (
                <Button asChild size="lg" variant="light">
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="size-4" />
                    {t.common.writeWhatsapp}
                  </a>
                </Button>
              ) : null}
            </div>
          </Reveal>
          <Reveal className="relative md:col-span-5" delay={0.15}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src="/images/pastry-box.jpg" alt={t.home.ctaImageAlt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
            </div>
            <div className="float-soft absolute -bottom-5 -start-5 hidden border border-background/15 bg-ink/80 px-5 py-4 backdrop-blur md:block">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">{t.contact.hours}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
