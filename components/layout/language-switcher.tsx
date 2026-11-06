"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/locale-provider";
import { localeCookie, otherLocale, switchLocalePath } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className, full = false }: { className?: string; full?: boolean }) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const target = otherLocale(lang);

  return (
    <Link
      href={switchLocalePath(pathname || `/${lang}`, target)}
      hrefLang={target}
      lang={target}
      aria-label={t.common.switchToLabel}
      onClick={() => {
        document.cookie = `${localeCookie}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border px-3 text-sm transition-colors",
        target === "ar" ? "font-[family-name:var(--font-plex-ar)]" : "font-[family-name:var(--font-outfit)]",
        className,
      )}
    >
      {full ? t.common.switchTo : t.common.switchToShort}
    </Link>
  );
}
