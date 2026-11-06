"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/locale-provider";
import { format, localePath } from "@/lib/i18n/config";
import { useCart } from "@/lib/shop/cart";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const lines = useCart();
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  if (lines.length === 0) return null;

  return (
    <Link
      href={localePath(lang, "/panier")}
      className={cn("relative inline-flex size-10 items-center justify-center rounded-full border", className)}
      aria-label={format(t.shop.openCart, { n: count })}
    >
      <ShoppingBag className="size-4" aria-hidden="true" />
      <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground ltr-nums">
        {count > 999 ? "999+" : count}
      </span>
    </Link>
  );
}
