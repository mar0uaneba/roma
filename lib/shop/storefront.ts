import "server-only";
import { isPurchasable } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedProducts } from "@/lib/products";
import { getSettings } from "@/lib/shop/repo";
import type { ShopProduct, ShopRules } from "@/components/shop/cart-view";

/** Products that can be ordered online, localized, with only what the browser needs. */
export async function getShop(locale: Locale): Promise<{ products: ShopProduct[]; rules: ShopRules }> {
  const [products, settings] = await Promise.all([getLocalizedProducts(locale), getSettings()]);
  return {
    products: products.filter(isPurchasable).map((product) => ({
      slug: product.slug,
      name: product.name,
      image: product.image,
      unit: product.unit ?? null,
      price: product.price!,
      minQty: product.minQty ?? 1,
    })),
    rules: {
      shippingFee: settings.shippingFee,
      freeShippingFrom: settings.freeShippingFrom,
      minOrder: settings.minOrder,
      transferEnabled: settings.transferEnabled,
    },
  };
}
