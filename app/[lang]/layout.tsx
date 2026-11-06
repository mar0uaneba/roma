import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "../globals.css";
import { fontVariables } from "@/app/fonts";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp";
import { dirOf, getDictionary, htmlLang, isLocale, languageAlternates, locales, ogLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#0e0d0c",
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.siteTitle, template: `%s · ${lang === "ar" ? "روما باك" : "Roma Pack"}` },
    description: t.meta.siteDescription,
    alternates: languageAlternates("/"),
    openGraph: {
      title: t.meta.siteTitle,
      description: t.meta.ogDescription,
      locale: ogLocale[lang],
      alternateLocale: lang === "fr" ? ogLocale.ar : ogLocale.fr,
      siteName: "Roma Pack",
      type: "website",
      images: [{ url: "/images/kraft-bag.jpg", width: 1200, height: 1500, alt: "Roma Pack" }],
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const dir = dirOf(lang);

  return (
    <html lang={htmlLang[lang]} dir={dir} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <LocaleProvider lang={lang} dictionary={t}>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-background"
          >
            {t.common.skip}
          </a>
          <Suspense fallback={<div className="h-16 md:h-20" />}>
            <Header />
          </Suspense>
          <main id="contenu">{children}</main>
          <Footer lang={lang} />
          <WhatsAppButton lang={lang} />
          <Toaster position="top-center" dir={dir} />
        </LocaleProvider>
      </body>
    </html>
  );
}
