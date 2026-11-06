import type { Tone } from "@/components/admin/ui";
import { formatMoney } from "@/lib/shop/money";
import type { CustomerStage, Order, OrderStatus, PaymentStatus } from "@/lib/shop/types";

export const TIMEZONE = "Africa/Casablanca";

export const mad = (value: number) => formatMoney(value, "en");

export function dateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function dateOnly(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export const orderStatusMeta: Record<OrderStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "gray" },
  pending: { label: "To confirm", tone: "amber" },
  confirmed: { label: "To ship", tone: "orange" },
  shipped: { label: "Shipped", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
  refunded: { label: "Refunded", tone: "gray" },
};

export const paymentMeta: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: "Unpaid", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  refunded: { label: "Refunded", tone: "gray" },
  partially_refunded: { label: "Part. refunded", tone: "blue" },
};

export const stageMeta: Record<CustomerStage, { label: string; tone: Tone }> = {
  lead: { label: "Lead", tone: "blue" },
  customer: { label: "Customer", tone: "green" },
  vip: { label: "VIP", tone: "orange" },
  inactive: { label: "Inactive", tone: "gray" },
};

export const paymentMethodLabel = (order: Pick<Order, "paymentMethod">) => (order.paymentMethod === "transfer" ? "Bank transfer" : "Cash on delivery");

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function csvCell(value: unknown) {
  const textValue = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(textValue) ? `'${textValue}` : textValue;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: unknown[][]) {
  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
