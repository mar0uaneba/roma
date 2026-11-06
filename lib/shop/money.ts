import type { Locale } from "@/lib/i18n/config";

const formatters = new Map<string, Intl.NumberFormat>();

/** "1 234,50 MAD" in French, "1,234.50 د.م." in Arabic. Numbers stay Latin digits, as is usual in Morocco. */
export function formatMoney(value: number, locale: Locale | "en" = "fr") {
  const key = locale;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "ar" ? "ar-MA-u-nu-latn" : locale === "en" ? "en-US" : "fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(Number.isFinite(value) ? value : 0);
}

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type LineInput = { quantity: number; unitPrice: number; unitCost?: number };

export function computeTotals(lines: LineInput[], shipping = 0, discount = 0) {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  const costTotal = round2(lines.reduce((sum, line) => sum + line.quantity * (line.unitCost ?? 0), 0));
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const total = round2(Math.max(subtotal + Math.max(shipping, 0) - safeDiscount, 0));
  return { subtotal, costTotal, shipping: round2(Math.max(shipping, 0)), discount: round2(safeDiscount), total };
}
