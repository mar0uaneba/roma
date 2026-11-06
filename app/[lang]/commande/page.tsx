import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { CheckoutForm } from "@/components/shop/cart-view";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getShop } from "@/lib/shop/storefront";

export async function generateMetadata({ params }: PageProps<"/[lang]/commande">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).shop.checkoutTitle, robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[lang]/commande">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className="px-5 pb-24 pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <PageIntro eyebrow={t.shop.payment} title={t.shop.checkoutTitle} lead={t.shop.checkoutLead} />
        <div className="mt-10">
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <Checkout lang={lang} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Checkout({ lang }: { lang: Locale }) {
  const { products, rules } = await getShop(lang);
  return <CheckoutForm products={products} rules={rules} />;
}
