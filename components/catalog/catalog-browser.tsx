"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { useI18n } from "@/components/i18n/locale-provider";
import type { LocalizedCategory, Product } from "@/lib/catalog";
import { format } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function CatalogBrowser({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: LocalizedCategory[];
  initialCategory?: string;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [category, setCategory] = useState(initialCategory ?? "tous");
  const [query, setQuery] = useState("");
  const categoryNames = useMemo(() => Object.fromEntries(categories.map((item) => [item.slug, item.name])), [categories]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "tous" || product.category === category;
      const haystack = `${product.name} ${product.summary} ${product.applications.join(" ")} ${product.ar?.name ?? ""}`;
      const matchesQuery = !needle || haystack.toLocaleLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [products, category, query]);

  function select(value: string) {
    setCategory(value);
    const url = new URL(window.location.href);
    if (value === "tous") url.searchParams.delete("categorie");
    else url.searchParams.set("categorie", value);
    window.history.replaceState(null, "", url);
  }

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-5 flex flex-col gap-4 border-b border-line/70 bg-background/90 px-5 py-4 backdrop-blur-lg md:top-[4.5rem] md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label={t.catalog.filterLabel}>
          <FilterButton active={category === "tous"} onClick={() => select("tous")}>
            {t.catalog.all}
          </FilterButton>
          {categories.map((item) => (
            <FilterButton key={item.slug} active={category === item.slug} onClick={() => select(item.slug)}>
              {item.name}
            </FilterButton>
          ))}
        </div>
        <div className="relative md:w-72">
          <label className="sr-only" htmlFor="recherche-produit">
            {t.catalog.searchLabel}
          </label>
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="recherche-produit"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            className="h-11 w-full rounded-full border border-line bg-card pe-4 ps-10 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
      </div>
      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {format(visible.length > 1 ? t.catalog.countMany : t.catalog.countOne, { n: visible.length })}
      </p>
      {visible.length === 0 ? (
        <p className="mt-8 text-muted">{t.catalog.empty}</p>
      ) : (
        <motion.div layout={!reduce} className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((product) => (
              <motion.div
                key={product.slug}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={product} categoryName={categoryNames[product.category]} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
        active ? "border-ink bg-ink text-background" : "border-line bg-card text-foreground hover:border-ink/30",
      )}
    >
      {children}
    </button>
  );
}
