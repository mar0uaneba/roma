"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { login, logout, requireAdmin } from "@/lib/admin/auth";
import { categorySlugs, catalogProducts } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { getAllProductsForAdmin } from "@/lib/products";
import {
  cancelledEmail,
  deliverySlotEmail,
  messageEmail,
  offerEmail,
  orderConfirmedEmail,
  quoteReplyEmail,
  sendCustomerEmail,
  shippedEmail,
} from "@/lib/shop/emails";
import { round2 } from "@/lib/shop/money";
import {
  DemoModeError,
  addEvent,
  createOrder,
  deleteOrder,
  getCustomer,
  getOrder,
  getQuote,
  newToken,
  saveSettings,
  updateCustomer,
  updateOrder,
  updateQuote,
} from "@/lib/shop/repo";
import { customerStages, type Order } from "@/lib/shop/types";
import { slugify } from "@/lib/utils";

/* ── Helpers ─────────────────────────────────────────────────────────── */

function withFlash(path: string, key: "ok" | "err", message: string) {
  const url = new URL(path, "http://admin.local");
  url.searchParams.set(key, message.slice(0, 300));
  return `${url.pathname}${url.search}`;
}

function errorText(error: unknown) {
  if (error instanceof DemoModeError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

/** Runs an admin mutation: checks the session, then redirects back with a flash message. */
async function run(path: string, work: () => Promise<string | void>, successPath?: (result: string | void) => string) {
  await requireAdmin();
  let result: string | void;
  try {
    result = await work();
  } catch (error) {
    redirect(withFlash(path, "err", errorText(error)));
  }
  const target = successPath ? successPath(result) : path;
  redirect(withFlash(target, "ok", typeof result === "string" && !successPath ? result : "Saved."));
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (form: FormData, key: string) => text(form, key) || null;
const money = (form: FormData, key: string) => {
  const raw = text(form, key).replace(",", ".").replace(/\s/g, "");
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid amount for ${key}.`);
  return round2(value);
};
const checked = (form: FormData, key: string) => form.get(key) === "on" || form.get(key) === "true";

async function siteOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  const proto = list.get("x-forwarded-proto") ?? "https";
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) return process.env.NEXT_PUBLIC_SITE_URL;
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

async function loadOrder(id: string) {
  const found = await getOrder(id);
  if (!found) throw new Error("Order not found.");
  return found.order;
}

function emailNote(result: { state: string; detail?: string }) {
  if (result.state === "sent") return " E-mail sent.";
  if (result.state === "skipped") return ` E-mail not sent (${result.detail ?? "skipped"}).`;
  return ` E-mail failed: ${result.detail ?? "unknown error"}.`;
}

/* ── Session ─────────────────────────────────────────────────────────── */

export async function loginAction(form: FormData) {
  const result = await login(text(form, "password"));
  if (!result.ok) {
    const message =
      result.error === "throttled"
        ? "Too many attempts. Wait 15 minutes and try again."
        : result.error === "unconfigured"
          ? "ADMIN_PASSWORD is not set (8 characters minimum). Add it in Vercel → Settings → Environment Variables."
          : "Wrong password.";
    redirect(withFlash("/admin/login", "err", message));
  }
  redirect("/admin");
}

export async function signOutAction() {
  await logout();
  redirect("/admin/login");
}

/* ── Orders ──────────────────────────────────────────────────────────── */

export async function confirmOrderAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    const order = await loadOrder(id);
    if (!["pending", "draft"].includes(order.status)) throw new Error("Only pending orders can be confirmed.");
    await updateOrder(id, { status: "confirmed", confirmed_at: new Date().toISOString() });
    await addEvent(id, "status", "Order confirmed");
    let note = "";
    if (checked(form, "notify")) {
      const fresh = await loadOrder(id);
      note = emailNote(await sendCustomerEmail(fresh.customerEmail, orderConfirmedEmail(fresh), { customerId: fresh.customerId, orderId: id }));
    }
    return `Order confirmed.${note}`;
  });
}

export async function shipOrderAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    const carrier = text(form, "carrier");
    if (!carrier) throw new Error("Choose a carrier.");
    const order = await loadOrder(id);
    if (!["confirmed", "pending"].includes(order.status)) throw new Error("This order cannot be shipped in its current state.");
    await updateOrder(id, {
      status: "shipped",
      carrier,
      tracking_number: optional(form, "tracking"),
      shipped_at: new Date().toISOString(),
      confirmed_at: order.confirmedAt ?? new Date().toISOString(),
    });
    await addEvent(id, "status", `Shipped with ${carrier}${text(form, "tracking") ? ` · ${text(form, "tracking")}` : ""}`);
    let note = "";
    if (checked(form, "notify")) {
      const fresh = await loadOrder(id);
      note = emailNote(await sendCustomerEmail(fresh.customerEmail, shippedEmail(fresh), { customerId: fresh.customerId, orderId: id }));
    }
    return `Marked as shipped.${note}`;
  });
}

export async function deliverOrderAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    const order = await loadOrder(id);
    const now = new Date().toISOString();
    const paid = checked(form, "paid");
    await updateOrder(id, {
      status: "delivered",
      delivered_at: now,
      ...(paid ? { payment_status: "paid", paid_at: order.paidAt ?? now } : {}),
    });
    await addEvent(id, "status", paid ? "Delivered, payment collected" : "Delivered");
    return "Marked as delivered.";
  });
}

export async function markPaidAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    await updateOrder(id, { payment_status: "paid", paid_at: new Date().toISOString() });
    await addEvent(id, "payment", "Payment received");
    return "Payment recorded.";
  });
}

export async function cancelOrderAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    const reason = optional(form, "reason");
    await updateOrder(id, { status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: reason });
    await addEvent(id, "status", `Cancelled${reason ? `: ${reason}` : ""}`);
    let note = "";
    if (checked(form, "notify")) {
      const order = await loadOrder(id);
      note = emailNote(await sendCustomerEmail(order.customerEmail, cancelledEmail(order, reason), { customerId: order.customerId, orderId: id }));
    }
    return `Order cancelled.${note}`;
  });
}

export async function refundOrderAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    const order = await loadOrder(id);
    const full = text(form, "mode") !== "partial";
    const amount = full ? round2(order.total - order.refundedAmount) : (money(form, "amount") ?? 0);
    if (amount <= 0) throw new Error("Enter an amount to refund.");
    const refunded = round2(order.refundedAmount + amount);
    if (refunded > order.total + 0.001) throw new Error("The refund is larger than the order total.");
    const complete = refunded >= order.total - 0.001;
    await updateOrder(id, {
      refunded_amount: refunded,
      payment_status: complete ? "refunded" : "partially_refunded",
      ...(complete ? { status: "refunded" } : {}),
    });
    await addEvent(id, "payment", `Refunded ${amount.toFixed(2)} MAD${complete ? " (full)" : " (partial)"} — ${text(form, "method") || "cash/transfer"}`);
    return "Refund recorded.";
  });
}

export async function saveFreightAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    const before = await loadOrder(id);
    const slot = optional(form, "deliverySlot");
    await updateOrder(id, {
      supplier_ref: optional(form, "supplierRef"),
      delivery_slot: slot,
      delivery_note: optional(form, "deliveryNote"),
      damage_flag: checked(form, "damage"),
    });
    if (checked(form, "damage") && !before.damageFlag) await addEvent(id, "freight", "Damage reported");
    let note = "";
    if (slot && checked(form, "sendSlot")) {
      const order = await loadOrder(id);
      note = emailNote(await sendCustomerEmail(order.customerEmail, deliverySlotEmail(order), { customerId: order.customerId, orderId: id }));
      await addEvent(id, "freight", `Delivery slot sent: ${slot}`);
    }
    return `Freight details saved.${note}`;
  });
}

export async function saveNoteAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    await updateOrder(id, { internal_note: optional(form, "note") });
    return "Note saved.";
  });
}

export async function emailOrderCustomerAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/orders/${id}`, async () => {
    const order = await loadOrder(id);
    const subject = text(form, "subject");
    const message = text(form, "message");
    if (!subject || !message) throw new Error("Subject and message are required.");
    const result = await sendCustomerEmail(order.customerEmail, messageEmail(order.locale, order.customerName, subject, message), {
      customerId: order.customerId,
      orderId: id,
    });
    await addEvent(id, "email", `E-mail: ${subject}`);
    if (result.state === "failed") throw new Error(`E-mail failed: ${result.detail}`);
    return result.state === "sent" ? "E-mail sent." : `Saved, not sent (${result.detail}).`;
  });
}

/* ── Drafts and offers ───────────────────────────────────────────────── */

const draftItem = z.object({
  productSlug: z.string().nullable(),
  name: z.string().trim().min(1).max(160),
  image: z.string().nullable(),
  unit: z.string().nullable(),
  quantity: z.number().int().min(1).max(1_000_000),
  unitPrice: z.number().min(0).max(10_000_000),
  unitCost: z.number().min(0).max(10_000_000),
});

export async function createDraftAction(form: FormData) {
  let createdId = "";
  await run(
    "/admin/drafts/new",
    async () => {
      let parsedItems: unknown;
      try {
        parsedItems = JSON.parse(text(form, "items") || "[]");
      } catch {
        throw new Error("Invalid items.");
      }
      const items = z.array(draftItem).min(1, "Add at least one product.").safeParse(parsedItems);
      if (!items.success) throw new Error(items.error.issues[0]?.message ?? "Invalid items.");
      const name = text(form, "name");
      if (!name) throw new Error("Customer name is required.");
      if (!text(form, "email") && !text(form, "phone")) throw new Error("Enter an e-mail or a phone number.");
      const created = await createOrder({
        status: "draft",
        source: text(form, "quoteId") ? "quote" : "admin",
        paymentMethod: text(form, "paymentMethod") === "transfer" ? "transfer" : "cod",
        locale: text(form, "locale") === "ar" ? "ar" : "fr",
        customer: {
          name,
          company: optional(form, "company"),
          email: optional(form, "email"),
          phone: optional(form, "phone"),
          city: optional(form, "city"),
          address: optional(form, "address"),
          note: optional(form, "customerNote"),
        },
        items: items.data,
        shipping: money(form, "shipping") ?? 0,
        discount: money(form, "discount") ?? 0,
        quoteId: optional(form, "quoteId"),
        internalNote: optional(form, "internalNote"),
      });
      createdId = created.id;
      if (text(form, "quoteId")) await updateQuote(text(form, "quoteId"), { draft_order_id: created.id, status: "in_review" });
    },
    () => `/admin/drafts/${createdId}`,
  );
}

async function ensureOfferLink(order: Order, renew: boolean) {
  const expired = !order.offerExpiresAt || Date.parse(order.offerExpiresAt) < Date.now();
  if (order.offerToken && !renew && !expired) return order.offerToken;
  const token = newToken();
  await updateOrder(order.id, { offer_token: token, offer_expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString() });
  return token;
}

export async function sendOfferAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/drafts/${id}`, async () => {
    const order = await loadOrder(id);
    if (order.status !== "draft") throw new Error("This draft is already an order.");
    if (order.items.length === 0) throw new Error("Add products before sending the offer.");
    if (!order.customerEmail) throw new Error("The customer has no e-mail address. Copy the link and send it by WhatsApp.");
    const token = await ensureOfferLink(order, false);
    const fresh = await loadOrder(id);
    const link = `${await siteOrigin()}/${fresh.locale}/offre/${token}`;
    const result = await sendCustomerEmail(fresh.customerEmail, offerEmail(fresh, link), { customerId: fresh.customerId, orderId: id });
    if (result.state === "failed") throw new Error(`E-mail failed: ${result.detail}`);
    await updateOrder(id, { offer_sent_at: new Date().toISOString() });
    await addEvent(id, "offer", result.state === "sent" ? "Offer e-mail sent" : "Offer prepared (e-mail not configured)");
    return result.state === "sent" ? "Offer e-mail sent." : `Link ready. E-mail not sent (${result.detail}).`;
  });
}

export async function newOfferLinkAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/drafts/${id}`, async () => {
    const order = await loadOrder(id);
    await ensureOfferLink(order, true);
    await addEvent(id, "offer", "New offer link created");
    return "New link created. The previous link no longer works.";
  });
}

export async function confirmDraftAction(form: FormData) {
  const id = text(form, "id");
  await run(
    `/admin/drafts/${id}`,
    async () => {
      const order = await loadOrder(id);
      if (order.status !== "draft") throw new Error("Already confirmed.");
      await updateOrder(id, { status: "confirmed", confirmed_at: new Date().toISOString(), offer_token: null });
      await addEvent(id, "status", "Confirmed manually from the draft");
    },
    () => `/admin/orders/${id}`,
  );
}

export async function deleteDraftAction(form: FormData) {
  const id = text(form, "id");
  await run(
    `/admin/drafts/${id}`,
    async () => {
      await deleteOrder(id);
    },
    () => "/admin/drafts",
  );
}

/* ── Quotes ──────────────────────────────────────────────────────────── */

export async function setQuoteStatusAction(form: FormData) {
  await run("/admin/quotes", async () => {
    const status = text(form, "status");
    if (!["new", "in_review", "quoted", "closed"].includes(status)) throw new Error("Unknown status.");
    await updateQuote(text(form, "id"), { status });
    return "Status updated.";
  });
}

export async function replyQuoteAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/quotes/${id}`, async () => {
    const quote = await getQuote(id);
    if (!quote) throw new Error("Quote not found.");
    const subject = text(form, "subject");
    const message = text(form, "message");
    if (!subject || !message) throw new Error("Subject and message are required.");
    const result = await sendCustomerEmail(quote.email, quoteReplyEmail(quote, subject, message), {
      customerId: null,
      orderId: null,
      quoteId: id,
    });
    if (result.state === "failed") throw new Error(`E-mail failed: ${result.detail}`);
    if (result.state === "sent") {
      const status = quote.status === "new" ? "in_review" : quote.status;
      try {
        await updateQuote(id, { status, replied_at: new Date().toISOString() });
      } catch {
        // Database without migration 005: keep the status change at least.
        await updateQuote(id, { status });
      }
      return `Reply sent to ${quote.email}.`;
    }
    return `Saved in history, not sent (${result.detail}).`;
  });
}

export async function quoteToDraftAction(form: FormData) {
  const id = text(form, "id");
  await requireAdmin();
  const quote = await getQuote(id);
  if (!quote) redirect(withFlash("/admin/quotes", "err", "Quote not found."));
  redirect(`/admin/drafts/new?quote=${encodeURIComponent(id)}`);
}

/* ── Products ────────────────────────────────────────────────────────── */

const lines = (value: string) =>
  value
    .split(/[\n,،]/)
    .map((item) => item.trim())
    .filter(Boolean);

export async function saveProductAction(form: FormData) {
  const originalSlug = text(form, "originalSlug");
  const slug = slugify(text(form, "slug") || text(form, "name"));
  await run(
    originalSlug ? `/admin/products/${originalSlug}` : "/admin/products/new",
    async () => {
      const db = getDb();
      if (!db) throw new DemoModeError();
      const category = text(form, "category");
      if (!categorySlugs.includes(category as (typeof categorySlugs)[number])) throw new Error("Choose a category.");
      const name = text(form, "name");
      if (name.length < 2) throw new Error("Name is required.");
      if (!slug) throw new Error("Slug is required.");
      const status = text(form, "status");
      if (!["active", "hidden", "sold_out"].includes(status)) throw new Error("Unknown status.");
      const image = text(form, "image") || "/images/plain-box.jpg";
      const stockRaw = text(form, "stock");
      const row = {
        slug,
        name,
        category,
        summary: text(form, "summary") || name,
        description: text(form, "description") || text(form, "summary") || name,
        applications: lines(text(form, "applications")),
        formats: lines(text(form, "formats")),
        image_url: image,
        image_alt: text(form, "imageAlt") || name,
        images: lines(text(form, "images")),
        featured: checked(form, "featured"),
        published: status !== "hidden",
        status,
        sort_order: Number(text(form, "sortOrder")) || 100,
        price: money(form, "price"),
        compare_at_price: money(form, "compareAtPrice"),
        cost_price: money(form, "costPrice"),
        stock: stockRaw === "" ? null : Math.max(0, Math.floor(Number(stockRaw) || 0)),
        unit: optional(form, "unit"),
        unit_ar: optional(form, "unitAr"),
        min_qty: Math.max(1, Math.floor(Number(text(form, "minQty")) || 1)),
        sku: optional(form, "sku"),
        feed_excluded: checked(form, "feedExcluded"),
        name_ar: optional(form, "nameAr"),
        summary_ar: optional(form, "summaryAr"),
        description_ar: optional(form, "descriptionAr"),
        applications_ar: text(form, "applicationsAr") ? lines(text(form, "applicationsAr")) : null,
        formats_ar: text(form, "formatsAr") ? lines(text(form, "formatsAr")) : null,
        image_alt_ar: optional(form, "imageAltAr"),
      };
      const { error } = await db.from("products").upsert(row, { onConflict: "slug" });
      if (error) {
        throw new Error(/column/i.test(error.message) ? "Database is missing columns: run supabase/setup.sql again." : error.message);
      }
      if (originalSlug && originalSlug !== slug) await db.from("products").delete().eq("slug", originalSlug);
      updateTag("products");
    },
    () => `/admin/products/${slug}`,
  );
}

export async function bulkProductStatusAction(form: FormData) {
  await run("/admin/products", async () => {
    const db = getDb();
    if (!db) throw new DemoModeError();
    const slugs = form.getAll("slug").map(String).filter(Boolean);
    const status = text(form, "status");
    if (!slugs.length) throw new Error("Select at least one product.");
    if (!["active", "hidden", "sold_out"].includes(status)) throw new Error("Unknown status.");
    const all = await getAllProductsForAdmin();
    const rows = all
      .filter((product) => slugs.includes(product.slug))
      .map((product) => ({
        slug: product.slug,
        name: product.name,
        category: product.category,
        summary: product.summary,
        description: product.description,
        applications: product.applications,
        formats: product.formats,
        image_url: product.image,
        image_alt: product.imageAlt,
        featured: product.featured,
        sort_order: product.sortOrder,
        status,
        published: status !== "hidden",
      }));
    const { error } = await db.from("products").upsert(rows, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    updateTag("products");
    return `${rows.length} product(s) updated.`;
  });
}

export async function importCatalogAction() {
  await run("/admin/products", async () => {
    const db = getDb();
    if (!db) throw new DemoModeError();
    const rows = catalogProducts.map((product) => ({
      slug: product.slug,
      name: product.name,
      category: product.category,
      summary: product.summary,
      description: product.description,
      applications: product.applications,
      formats: product.formats,
      image_url: product.image,
      image_alt: product.imageAlt,
      featured: product.featured,
      published: product.published,
      sort_order: product.sortOrder,
      name_ar: product.ar?.name ?? null,
      summary_ar: product.ar?.summary ?? null,
      description_ar: product.ar?.description ?? null,
      applications_ar: product.ar?.applications ?? null,
      formats_ar: product.ar?.formats ?? null,
      image_alt_ar: product.ar?.imageAlt ?? null,
    }));
    const { error } = await db.from("products").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    updateTag("products");
    return "Catalogue imported. Existing products were kept.";
  });
}

export async function publishSiteAction() {
  await run("/admin", async () => {
    updateTag("products");
    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!hook) return "Cache refreshed. Add VERCEL_DEPLOY_HOOK_URL to also trigger a full rebuild.";
    const response = await fetch(hook, { method: "POST" });
    if (!response.ok) throw new Error(`Deploy hook answered ${response.status}.`);
    return "Rebuild started. The site updates in about a minute.";
  });
}

/* ── Customers ───────────────────────────────────────────────────────── */

export async function saveCustomerAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/customers/${id}`, async () => {
    const stage = text(form, "stage");
    if (!customerStages.includes(stage as (typeof customerStages)[number])) throw new Error("Unknown stage.");
    await updateCustomer(id, {
      name: text(form, "name"),
      company: optional(form, "company"),
      phone: optional(form, "phone"),
      city: optional(form, "city"),
      address: optional(form, "address"),
      locale: text(form, "locale") === "ar" ? "ar" : "fr",
      stage,
      tags: lines(text(form, "tags")),
      notes: optional(form, "notes"),
    });
    return "Customer saved.";
  });
}

export async function emailCustomerAction(form: FormData) {
  const id = text(form, "id");
  await run(`/admin/customers/${id}`, async () => {
    const found = await getCustomer(id);
    if (!found) throw new Error("Customer not found.");
    const subject = text(form, "subject");
    const message = text(form, "message");
    if (!subject || !message) throw new Error("Subject and message are required.");
    const result = await sendCustomerEmail(
      found.customer.email,
      messageEmail(found.customer.locale, found.customer.name, subject, message),
      { customerId: id, orderId: null },
    );
    if (result.state === "failed") throw new Error(`E-mail failed: ${result.detail}`);
    return result.state === "sent" ? "E-mail sent." : `Saved in history, not sent (${result.detail}).`;
  });
}

/* ── Settings ────────────────────────────────────────────────────────── */

export async function saveSettingsAction(form: FormData) {
  await run("/admin/settings", async () => {
    await saveSettings({
      shippingFee: money(form, "shippingFee"),
      freeShippingFrom: money(form, "freeShippingFrom"),
      minOrder: money(form, "minOrder"),
      bankDetails: text(form, "bankDetails"),
      transferEnabled: checked(form, "transferEnabled"),
    });
    updateTag("products");
    return "Settings saved.";
  });
}

/* ── Product photos ──────────────────────────────────────────────────── */

const imageTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export async function uploadProductImageAction(form: FormData) {
  const slug = text(form, "slug");
  await run(`/admin/products/${slug}`, async () => {
    const db = getDb();
    if (!db) throw new DemoModeError();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image.");
    const extension = imageTypes[file.type];
    if (!extension) throw new Error("Use a JPG, PNG, WebP or AVIF image.");
    if (file.size > 4 * 1024 * 1024) throw new Error("Image larger than 4 MB.");

    const { data: product } = await db.from("products").select("slug, images, image_url").eq("slug", slug).maybeSingle();
    if (!product) throw new Error("Save the product once before adding photos.");

    const path = `${slug}/${Date.now()}.${extension}`;
    const { error } = await db.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const url = db.storage.from("product-images").getPublicUrl(path).data.publicUrl;

    const asMain = checked(form, "main");
    const images = Array.isArray(product.images) ? (product.images as string[]) : [];
    const patch = asMain ? { image_url: url, images: product.image_url ? [product.image_url, ...images] : images } : { images: [...images, url] };
    const { error: saveError } = await db.from("products").update(patch).eq("slug", slug);
    if (saveError) throw new Error(saveError.message);
    updateTag("products");
    return "Photo added.";
  });
}
