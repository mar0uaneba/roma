import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { TrustSeal } from "@/components/brand/trust-seal";
import { getCategories } from "@/lib/catalog";
import { format, getDictionary, localePath, type Locale } from "@/lib/i18n";
import { getTrust } from "@/lib/i18n/trust";
import { navItems, site, siteAddress, telHref, whatsappHref } from "@/lib/site";

export function Footer({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const categories = getCategories(lang);
  const address = siteAddress(lang);
  const whatsapp = whatsappHref(t.contact.whatsappMessage);
  const trust = getTrust(lang);

  return (
    <footer className="relative overflow-hidden bg-ink text-background">
      <div aria-hidden="true" className="pointer-events-none absolute -top-px inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 start-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px] rtl:translate-x-1/2" />
      <div
        aria-hidden="true"
        className="wordmark-outline pointer-events-none absolute -bottom-[3vw] start-1/2 -translate-x-1/2 select-none whitespace-nowrap font-serif text-[19vw] leading-none rtl:translate-x-1/2"
        dir="ltr"
      >
        ROMA PACK
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-[12vw] pt-16 md:grid-cols-12 md:pt-20">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-background/65">{format(t.footer.blurb, { city: t.site.city })}</p>
          <div className="mt-8 flex items-center gap-4">
            <TrustSeal id="footer" label={trust.sealLabel} className="size-20 shrink-0 text-gold/70" />
            <p className="text-xs leading-5 text-background/55">
              <span className="block text-background/80">{trust.verified}</span>
              {site.legalName} · SARL AU
              <span className="block ltr-nums">ICE {site.ice}</span>
            </p>
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-background/45">{t.footer.site}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {navItems(t).map((item) => (
              <li key={item.href}>
                <Link href={localePath(lang, item.href)} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-background/45">{t.footer.catalog}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={localePath(lang, `/produits?categorie=${category.slug}`)} className="transition-colors hover:text-accent">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-background/45">{t.footer.contact}</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              {t.site.city}, {t.site.country}
            </li>
            {address ? <li>{address}</li> : null}
            {site.phone ? (
              <li>
                <a href={telHref(site.phone)} className="ltr-nums hover:text-accent">
                  {site.phone}
                </a>
              </li>
            ) : null}
            {site.email ? (
              <li>
                <a href={`mailto:${site.email}`} className="ltr-nums hover:text-accent">
                  {site.email}
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                  {t.common.writeWhatsapp}
                </a>
              </li>
            ) : null}
            {!site.phone && !site.email ? <li className="text-background/65">{t.footer.formChannel}</li> : null}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-background/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-background/50 sm:flex-row sm:justify-between">
          <p>
            © 2026 {site.legalName} · ICE <span className="ltr-nums">{site.ice}</span> · RC <span className="ltr-nums">{site.rc}</span>{" "}
            {t.site.city}
          </p>
          <p className="flex gap-4">
            <Link href={localePath(lang, "/mentions-legales")} className="hover:text-background">
              {t.footer.legal}
            </Link>
            <Link href={localePath(lang, "/confidentialite")} className="hover:text-background">
              {t.footer.privacy}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
