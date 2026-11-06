import { NextResponse } from "next/server";
import { z } from "zod";
import { isPurchasable } from "@/lib/catalog";
import { isDbConfigured } from "@/lib/db";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getLocalizedProducts } from "@/lib/products";
import { notifyTeam, orderReceivedEmail, sendCustomerEmail } from "@/lib/shop/emails";
import { formatMoney } from "@/lib/shop/money";
import { createOrder, getOrder, getSettings, shippingFor } from "@/lib/shop/repo";

const schema = z.object({
  locale: z.enum(["fr", "ar"]),
  items: z
    .array(z.object({ slug: z.string().min(1).max(80), quantity: z.number().int().min(1).max(100_000) }))
    .min(1)
    .max(50),
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().min(8).max(30),
  email: z
    .string()
    .trim()
    .max(180)
    .optional()
    .nullable()
    .refine((value) => !value || z.email().safeParse(value).success),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(4).max(240),
  note: z.string().trim().max(1000).optional().nullable(),
  paymentMethod: z.enum(["cod", "transfer"]).default("cod"),
  website: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  const requested = (body as { locale?: string } | null)?.locale;
  const locale: Locale = isLocale(requested) ? requested : "fr";
  const t = getDictionary(locale);

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: t.quoteResult.invalid }, { status: 400 });
  }
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true, number: "RP-0000" });
  if (!isDbConfigured()) return NextResponse.json({ ok: false, message: t.shop.closed }, { status: 503 });

  // Prices, names and costs always come from the server, never from the browser.
  const [products, frProducts, settings] = await Promise.all([getLocalizedProducts(locale), getLocalizedProducts("fr"), getSettings()]);
  const items = [];
  for (const line of input.items) {
    const product = products.find((item) => item.slug === line.slug);
    const fr = frProducts.find((item) => item.slug === line.slug);
    if (!product || !fr || !isPurchasable(product)) {
      return NextResponse.json({ ok: false, message: t.shop.unavailable }, { status: 409 });
    }
    const quantity = Math.max(line.quantity, product.minQty ?? 1);
    if (typeof product.stock === "number" && product.stock < quantity) {
      return NextResponse.json({ ok: false, message: `${t.shop.unavailable} (${product.name})` }, { status: 409 });
    }
    items.push({
      productSlug: product.slug,
      name: fr.name,
      image: product.image,
      unit: fr.unit ?? null,
      quantity,
      unitPrice: product.price!,
      unitCost: product.costPrice ?? 0,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  if (settings.minOrder !== null && subtotal < settings.minOrder) {
    return NextResponse.json({ ok: false, message: t.shop.minOrder.replace("{amount}", formatMoney(settings.minOrder, locale)) }, { status: 400 });
  }
  if (input.paymentMethod === "transfer" && !settings.transferEnabled) {
    return NextResponse.json({ ok: false, message: t.quoteResult.invalid }, { status: 400 });
  }

  try {
    const created = await createOrder({
      status: "pending",
      source: "shop",
      paymentMethod: input.paymentMethod,
      locale,
      customer: {
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        city: input.city,
        address: input.address,
        note: input.note,
      },
      items,
      shipping: shippingFor(settings, subtotal) ?? 0,
      discount: 0,
    });

    let emailed = false;
    const found = await getOrder(created.id);
    if (found?.order.customerEmail) {
      const result = await sendCustomerEmail(found.order.customerEmail, orderReceivedEmail(found.order), {
        customerId: found.order.customerId,
        orderId: created.id,
      });
      emailed = result.state === "sent";
    }
    await notifyTeam(
      `Nouvelle commande ${created.number} — ${formatMoney(found?.order.total ?? subtotal, "fr")}`,
      [`${input.name} · ${input.phone} · ${input.city}`, ...items.map((item) => `${item.quantity} × ${item.name}`), "", "Admin : /admin/orders"].join("\n"),
    );

    return NextResponse.json({ ok: true, number: created.number, emailed });
  } catch (error) {
    console.error("order creation failed", error);
    return NextResponse.json({ ok: false, message: t.shop.error }, { status: 500 });
  }
}
