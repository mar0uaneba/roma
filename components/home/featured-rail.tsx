"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import type { Product } from "@/lib/catalog";
import { localePath } from "@/lib/i18n/config";

export function FeaturedRail({ products, categoryNames }: { products: Product[]; categoryNames: Record<string, string> }) {
  const { lang, t } = useI18n();
  const rail = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const node = rail.current;
    if (!node) return;
    const card = node.querySelector("a");
    const step = (card?.getBoundingClientRect().width ?? 360) + 16;
    // In RTL, positive "forward" scrolling goes toward negative scrollLeft.
    const sign = lang === "ar" ? -1 : 1;
    node.scrollBy({ left: direction * step * sign, behavior: "smooth" });
  }

  return (
    <>
      <div className="mx-auto mt-6 flex max-w-6xl justify-end gap-2 px-5">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="inline-flex size-11 items-center justify-center rounded-full border border-background/25 transition-colors hover:bg-background hover:text-ink"
          aria-label={t.common.previous}
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="inline-flex size-11 items-center justify-center rounded-full border border-background/25 transition-colors hover:bg-background hover:text-ink"
          aria-label={t.common.next}
        >
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={rail}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 md:px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]"
      >
        {products.map((product, index) => (
          <Link
            key={product.slug}
            href={localePath(lang, `/produits/${product.slug}`)}
            className="group w-[78vw] shrink-0 snap-start sm:w-[24rem]"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-background/10">
              <Image src={product.image} alt={product.imageAlt} fill sizes="(min-width: 640px) 384px, 78vw" className="media-zoom object-cover" />
              <span className="absolute start-4 top-4 bg-ink/60 px-2.5 py-1 text-[11px] tracking-[0.18em] text-background backdrop-blur ltr-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="absolute inset-x-0 bottom-0 translate-y-full bg-accent px-5 py-3 text-sm text-accent-foreground transition-transform duration-500 group-hover:translate-y-0">
                {t.product.request}
              </span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-background/55">{categoryNames[product.category]}</p>
            <h3 className="mt-1 font-serif text-3xl transition-colors group-hover:text-accent">{product.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-background/60">{product.summary}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
