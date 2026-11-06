"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";

export default function NotFound() {
  const { lang, t } = useI18n();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-32">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">404</p>
      <h1 className="mt-3 font-serif text-5xl text-ink">{t.notFound.title}</h1>
      <div className="mt-8">
        <Button asChild>
          <Link href={localePath(lang, "/produits")}>{t.common.backToCatalog}</Link>
        </Button>
      </div>
    </div>
  );
}
