"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import type { LocalizedCategory } from "@/lib/catalog";
import { localePath } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function RangeStage({ categories }: { categories: LocalizedCategory[] }) {
  const { lang } = useI18n();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const current = categories[active] ?? categories[0];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-12">
      <div className="lg:sticky lg:top-28 lg:col-span-5">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink">
          <AnimatePresence initial={false}>
            {current ? (
              <motion.div
                key={current.slug}
                className="absolute inset-0"
                initial={reduce ? false : { opacity: 0, scale: 1.06, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, scale: 1, clipPath: "inset(0 0 0% 0)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src={current.image} alt={current.imageAlt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent p-6 text-background">
            <p className="text-xs tracking-[0.22em] text-background/70 ltr-nums">0{active + 1} / 0{categories.length}</p>
            <p className="mt-2 font-serif text-3xl">{current?.name}</p>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-line border-y border-line lg:col-span-7">
        {categories.map((category, index) => (
          <li key={category.slug}>
            <Link
              href={localePath(lang, `/produits?categorie=${category.slug}`)}
              className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-6 py-5"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
            >
              <span className={cn("text-xs tracking-[0.18em] ltr-nums transition-colors", index === active ? "text-accent" : "text-muted")}>
                0{index + 1}
              </span>
              <span>
                <span
                  className={cn(
                    "block font-serif text-3xl tracking-tight transition-[color,transform] duration-500 md:text-5xl",
                    index === active ? "translate-x-2 text-accent rtl:-translate-x-2" : "text-ink",
                  )}
                >
                  {category.name}
                </span>
                <span className="mt-1 block max-w-md text-sm text-muted">{category.description}</span>
              </span>
              <ArrowUpRight
                className={cn(
                  "size-5 self-center transition-all duration-500 rtl:-scale-x-100",
                  index === active ? "text-accent opacity-100" : "opacity-0",
                )}
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
