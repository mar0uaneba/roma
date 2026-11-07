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
  const purchasable = isPurchasable(product);

  return (
    <Link href={localePath(lang, `/produits/${product.slug}`)} className="group block">
      <div
        data-spotlight=""
        className="spotlight spotlight-light relative aspect-[4/5] overflow-hidden bg-line shadow-[0_0_0_0_rgba(14,13,12,0)] transition-shadow duration-700 group-hover:shadow-[0_40px_70px_-40px_rgba(14,13,12,0.6)]"
      >
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="media-zoom object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Price or status chip */}
        <span className="absolute start-4 top-4 z-[2] inline-flex items-center rounded-full border border-background/40 bg-background/85 px-3 py-1 text-xs font-medium text-ink shadow-sm backdrop-blur-md">
          {purchasable ? (
            <span className="ltr-nums">{formatMoney(product.price!, lang)}</span>
          ) : product.status === "sold_out" ? (
            <span className="text-accent">{t.shop.soldOut}</span>
          ) : (
            t.shop.onQuote
          )}
        </span>

        <span className="absolute end-4 top-4 z-[2] inline-flex size-10 translate-y-2 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </span>

        {categoryName ? (
          <span className="absolute bottom-4 start-4 z-[2] text-[11px] uppercase tracking-[0.22em] text-background/90">{categoryName}</span>
        ) : null}
      </div>
      <h3 className="mt-4 font-serif text-2xl text-ink">
        <span className="bg-gradient-to-r from-accent to-accent bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size,color] duration-500 group-hover:bg-[length:100%_1px] group-hover:text-accent rtl:bg-right-bottom">
          {product.name}
        </span>
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted">{product.summary}</p>
      {purchasable && product.unit ? (
        <p className="mt-2 text-xs text-muted">
          <span className="ltr-nums">{formatMoney(product.price!, lang)}</span> · {product.unit}
        </p>
      ) : null}
    </Link>
  );
}
