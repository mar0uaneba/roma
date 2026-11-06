"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n/locale-provider";
import { isPurchasable, type Product } from "@/lib/catalog";
import { formatMoney } from "@/lib/shop/money";
import { localePath } from "@/lib/i18n/config";

export function ProductCard({ product, categoryName }: { product: Product; categoryName?: string }) {
  const { lang, t } = useI18n();

  return (
    <Link href={localePath(lang, `/produits/${product.slug}`)} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-line">
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="media-zoom object-cover"
        />
        <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/15" />
        <span className="absolute end-4 top-4 inline-flex size-10 translate-y-2 items-center justify-center rounded-full bg-background text-ink opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </span>
      </div>
      {categoryName ? <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">{categoryName}</p> : null}
      <h3 className="mt-1 font-serif text-2xl text-ink transition-colors group-hover:text-accent">{product.name}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{product.summary}</p>
      <p className="mt-3 text-sm font-medium text-ink">
        {isPurchasable(product) ? (
          <span className="ltr-nums">{formatMoney(product.price!, lang)}</span>
        ) : product.status === "sold_out" ? (
          <span className="text-accent">{t.shop.soldOut}</span>
        ) : (
          <span className="text-muted">{t.shop.onQuote}</span>
        )}
        {isPurchasable(product) && product.unit ? <span className="font-normal text-muted"> · {product.unit}</span> : null}
      </p>
    </Link>
  );
}
