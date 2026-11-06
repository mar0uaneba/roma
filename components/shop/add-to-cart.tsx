"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";
import { cart } from "@/lib/shop/cart";
import { useRouter } from "next/navigation";

export function AddToCart({ slug, minQty = 1, name }: { slug: string; minQty?: number; name: string }) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [quantity, setQuantity] = useState(Math.max(1, minQty));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-12 items-center border border-ink/20" role="group" aria-label={t.shop.quantity}>
        <button
          type="button"
          className="flex size-12 items-center justify-center hover:bg-ink/5 disabled:opacity-40"
          onClick={() => setQuantity((value) => Math.max(minQty, value - 1))}
          disabled={quantity <= minQty}
          aria-label="−"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <input
          value={quantity}
          onChange={(event) => setQuantity(Math.max(minQty, Math.floor(Number(event.target.value) || minQty)))}
          inputMode="numeric"
          className="h-full w-16 border-x border-ink/20 bg-transparent text-center tabular-nums outline-none ltr-nums"
          aria-label={t.shop.quantity}
        />
        <button type="button" className="flex size-12 items-center justify-center hover:bg-ink/5" onClick={() => setQuantity((value) => value + 1)} aria-label="+">
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      <Button
        size="lg"
        onClick={() => {
          cart.add(slug, quantity);
          toast.success(t.shop.added, {
            description: `${quantity} × ${name}`,
            action: { label: t.shop.cart, onClick: () => router.push(localePath(lang, "/panier")) },
          });
        }}
      >
        <ShoppingBag className="size-4" aria-hidden="true" />
        {t.shop.addToCart}
      </Button>
    </div>
  );
}
