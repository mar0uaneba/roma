"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export type HeroSlide = { image: string; alt: string; label: string; href: string };

const ease = [0.22, 1, 0.36, 1] as const;
const DURATION = 6500;

export function Hero({ slides, whatsapp }: { slides: HeroSlide[]; whatsapp: string | null }) {
  const { lang, t } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    if (reduce || paused || slides.length < 2) return;
    const id = window.setTimeout(() => setIndex((value) => (value + 1) % slides.length), DURATION);
    return () => window.clearTimeout(id);
  }, [index, paused, reduce, slides.length]);

  const current = slides[index] ?? slides[0];

  return (
    <section
      ref={ref}
      className="grain relative flex min-h-[100svh] items-end overflow-hidden bg-ink text-background"
      aria-roledescription="carousel"
    >
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y: imageY }}>
        <AnimatePresence initial={false}>
          {current ? (
            <motion.div
              key={current.image}
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease }}
            >
              <motion.div
                className="absolute inset-0"
                initial={reduce ? false : { scale: 1.12 }}
                animate={{ scale: 1.02 }}
                transition={{ duration: DURATION / 1000 + 1.5, ease: "linear" }}
              >
                <Image
                  src={current.image}
                  alt={current.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-[65%_center]"
                />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Legibility: directional wash toward the text side, plus a floor gradient. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10 rtl:bg-gradient-to-l" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/50" />

      {/* Fine industrial grid. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto hidden max-w-6xl px-5 md:block">
        <div className="relative h-full border-x border-background/[0.07]">
          <div className="absolute inset-y-0 start-1/3 border-s border-background/[0.07]" />
          <div className="absolute inset-y-0 start-2/3 border-s border-background/[0.07]" />
        </div>
      </div>

      <motion.div
        className="relative mx-auto w-full max-w-6xl px-5 pb-28 pt-36 md:pb-32 md:pt-40"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          className="flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-gold"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
        >
          <span className="h-px w-10 bg-gold/70" aria-hidden="true" />
          {t.home.eyebrow}
        </motion.p>

        <h1 className="mt-6 max-w-4xl font-serif text-[3.1rem] leading-[0.92] tracking-tight sm:text-7xl lg:text-[6.5rem]">
          {t.home.titleLines.map((line, lineIndex) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className={cn("block", lineIndex === t.home.titleAccentLine && "italic text-accent")}
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.1, ease, delay: 0.2 + lineIndex * 0.12 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          className="mt-7 max-w-lg text-base leading-7 text-background/75 sm:text-lg sm:leading-8"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.65 }}
        >
          {t.home.lead}
        </motion.p>

        <motion.div
          className="mt-9 flex flex-wrap items-center gap-3"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.8 }}
        >
          <Button asChild size="lg" className="group">
            <Link href={localePath(lang, "/contact")}>
              {t.common.requestQuote}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="light">
            <Link href={localePath(lang, "/produits")}>{t.common.viewCatalog}</Link>
          </Button>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 px-3 text-sm text-background/80 underline-offset-4 hover:text-background hover:underline"
            >
              <WhatsAppIcon className="size-4" />
              {t.common.whatsapp}
            </a>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Slide indicator */}
      {slides.length > 1 ? (
        <div
          className="absolute bottom-6 end-5 z-10 hidden w-[min(20rem,calc(100%-2.5rem))] lg:block md:bottom-10 md:end-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="border border-background/15 bg-ink/40 p-4 backdrop-blur-md">
            <div className="flex items-baseline justify-between text-xs text-background/60">
              <span className="uppercase tracking-[0.22em]">{t.home.slideLabel}</span>
              <span className="ltr-nums tabular-nums">
                {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current?.label}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease }}
              >
                <Link href={current?.href ?? localePath(lang, "/produits")} className="mt-2 block font-serif text-2xl hover:text-accent">
                  {current?.label}
                </Link>
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex gap-1.5" role="tablist">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.image}
                  type="button"
                  role="tab"
                  aria-selected={slideIndex === index}
                  aria-label={slide.label}
                  onClick={() => setIndex(slideIndex)}
                  className="relative h-1 flex-1 overflow-hidden bg-background/20"
                >
                  {slideIndex === index ? (
                    <motion.span
                      key={`${slideIndex}-${index}-${paused}`}
                      className="absolute inset-y-0 start-0 bg-accent"
                      initial={{ width: reduce || paused ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: reduce || paused ? 0 : DURATION / 1000, ease: "linear" }}
                    />
                  ) : slideIndex < index ? (
                    <span className="absolute inset-0 bg-background/50" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Scroll cue */}
      <div className="absolute bottom-8 start-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-background/50 lg:flex rtl:translate-x-1/2">
        <span className="relative h-10 w-px overflow-hidden bg-background/15">
          <span className="scroll-cue-line absolute inset-x-0 top-0 h-1/2 bg-background/70" />
        </span>
        <ArrowDown className="size-3" aria-hidden="true" />
        <span className="sr-only">{t.home.scroll}</span>
      </div>
    </section>
  );
}
