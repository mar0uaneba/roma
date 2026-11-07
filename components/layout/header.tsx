"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { useI18n } from "@/components/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SpotlightTracker } from "@/components/motion/spotlight-tracker";
import { CartButton } from "@/components/shop/cart-button";
import { Button } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";
import { navItems } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const nav = navItems(t);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;
  const overHero = isHome && !scrolled && !open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        overHero ? "px-0 pt-0" : "px-3 pt-3 md:px-5",
      )}
    >
      <SpotlightTracker />
      <div
        className={cn(
          "relative mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-hidden px-5 transition-[height,background-color,box-shadow,border-color,color,border-radius] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          overHero
            ? "h-20 border border-transparent bg-transparent text-background md:h-24"
            : "h-14 rounded-[6px] border border-line/70 bg-background/80 text-ink shadow-[0_18px_50px_-24px_rgba(14,13,12,0.35)] backdrop-blur-xl backdrop-saturate-150 md:h-16",
        )}
      >
        {!overHero ? (
          <span aria-hidden="true" className="sd-progress pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-accent via-accent to-gold" />
        ) : null}
        <Link href={localePath(lang)} aria-label={t.common.home} className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label={t.common.mainNav}>
          {nav.map((item) => {
            const href = localePath(lang, item.href);
            const active = pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "group relative py-2 text-sm tracking-wide transition-colors",
                  overHero ? "text-background/80 hover:text-background" : "text-foreground/70 hover:text-foreground",
                  active && (overHero ? "text-background" : "text-foreground"),
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-0 -bottom-0.5 h-px origin-[left] scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100 rtl:origin-[right]",
                    active && "scale-x-100",
                  )}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <CartButton className={overHero ? "border-background/30 hover:bg-background/10" : "border-line hover:border-ink/40"} />
          <LanguageSwitcher className={overHero ? "border-background/30 hover:bg-background/10" : "border-line hover:border-ink/40"} />
          <Button asChild>
            <Link href={localePath(lang, "/contact")}>{t.common.requestQuote}</Link>
          </Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <CartButton className={overHero ? "border-background/30" : "border-line"} />
          <LanguageSwitcher className={overHero ? "border-background/30" : "border-line"} />
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full border",
                  overHero ? "border-background/30" : "border-line",
                )}
                aria-label={t.common.openMenu}
              >
                <Menu className="size-5" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm" />
              <Dialog.Content
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="fixed inset-y-0 end-0 z-50 flex w-[min(100%,22rem)] flex-col bg-background p-6 text-ink shadow-xl focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <Dialog.Title className="font-serif text-xl">{t.common.menu}</Dialog.Title>
                  <Dialog.Description className="sr-only">{t.common.mobileNav}</Dialog.Description>
                  <Dialog.Close
                    className="inline-flex size-11 items-center justify-center rounded-full border border-line"
                    aria-label={t.common.closeMenu}
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                <nav className="mt-10 flex flex-col gap-1" aria-label={t.common.mobileNav}>
                  {nav.map((item, index) => (
                    <Link
                      key={item.href}
                      href={localePath(lang, item.href)}
                      className="flex items-baseline gap-4 border-b border-line py-4 font-serif text-3xl"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-sans text-xs text-accent ltr-nums">0{index + 1}</span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto space-y-3">
                  <LanguageSwitcher full className="w-full border-line" />
                  <Button asChild className="w-full" size="lg">
                    <Link href={localePath(lang, "/contact")} onClick={() => setOpen(false)}>
                      {t.common.requestQuote}
                    </Link>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
