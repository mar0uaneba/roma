import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { acceptOfferAction } from "@/app/actions/shop";
import { Button } from "@/components/ui/button";
import { format, getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/shop/money";
import { getOrderByToken } from "@/lib/shop/repo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page({ params }: PageProps<"/[lang]/offre/[token]">) {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:pt-40">
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <Offer params={params} />
      </Suspense>
    </div>
  );
}

async function Offer({ params }: { params: Promise<{ lang: string; token: string }> }) {
  const { lang: rawLang, token } = await params;
  if (!isLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = getDictionary(lang);
  const order = await getOrderByToken(token);
  const money = (value: number) => formatMoney(value, lang);

  if (!order) return <p className="font-serif text-3xl text-ink">{t.shop.offerNotFound}</p>;
  if (order.status !== "draft") return <p className="font-serif text-3xl text-ink">{t.shop.offerDone}</p>;
  const expired = order.offerExpiresAt ? Date.parse(order.offerExpiresAt) < Date.now() : false;

  return (
    <>
      <p className="text-xs uppercase tracking-[0.28em] text-gold">{order.number}</p>
      <h1 className="mt-3 font-serif text-5xl text-ink">{t.shop.offerTitle}</h1>
      <p className="mt-4 text-lg text-muted">{format(t.shop.offerLead, { name: order.customerCompany || order.customerName })}</p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-4">
            <span>
              <span className="ltr-nums">{item.quantity}</span> × {item.name}
              {item.unit ? <span className="block text-sm text-muted">{item.unit}</span> : null}
            </span>
            <span className="shrink-0 ltr-nums">{money(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">{t.shop.subtotal}</dt>
          <dd className="ltr-nums">{money(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{t.shop.shipping}</dt>
          <dd className="ltr-nums">{order.shipping ? money(order.shipping) : t.shop.shippingFree}</dd>
        </div>
        {order.discount ? (
          <div className="flex justify-between">
            <dt className="text-muted">{t.shop.discount}</dt>
            <dd className="ltr-nums">− {money(order.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-medium text-ink">
          <dt>{t.shop.total}</dt>
          <dd className="ltr-nums">{money(order.total)}</dd>
        </div>
      </dl>
      {expired ? (
        <p className="mt-10 border border-gold/40 bg-[#f7f1e4] px-4 py-3">{t.shop.offerExpired}</p>
      ) : (
        <form action={acceptOfferAction} className="mt-10">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="lang" value={lang} />
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {format(t.shop.offerConfirm, { total: money(order.total) })}
          </Button>
          <p className="mt-3 text-sm text-muted">{t.shop.vatNote}</p>
        </form>
      )}
    </>
  );
}
