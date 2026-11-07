import "server-only";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { demoCustomers, demoEmails, demoOrders, demoQuotes } from "@/lib/shop/demo";
import { computeTotals } from "@/lib/shop/money";
import {
  defaultSettings,
  type Customer,
  type CustomerStage,
  type CustomerWithStats,
  type EmailLog,
  type Order,
  type OrderEvent,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
  type QuoteRequest,
  type ShopSettings,
} from "@/lib/shop/types";

/** Thrown by every write when no database is connected (demo mode). */
export class DemoModeError extends Error {
  constructor() {
    super("Demo mode: connect the database (Supabase) to save changes.");
  }
}

function db() {
  const client = getDb();
  if (!client) throw new DemoModeError();
  return client;
}

export function isDemo() {
  return !getDb();
}

/* ── Mapping ─────────────────────────────────────────────────────────── */

type Row = Record<string, unknown>;
const str = (value: unknown) => (typeof value === "string" ? value : null);
const num = (value: unknown) => (value === null || value === undefined ? 0 : Number(value) || 0);
const locale = (value: unknown): Locale => (isLocale(str(value)) ? (value as Locale) : "fr");

function mapItem(row: Row): OrderItem {
  return {
    id: String(row.id),
    productSlug: str(row.product_slug),
    name: String(row.name ?? ""),
    image: str(row.image),
    unit: str(row.unit),
    quantity: num(row.quantity),
    unitPrice: num(row.unit_price),
    unitCost: num(row.unit_cost),
    lineTotal: num(row.line_total),
  };
}

function mapOrder(row: Row): Order {
  const items = Array.isArray(row.shop_order_items) ? (row.shop_order_items as Row[]) : [];
  return {
    id: String(row.id),
    number: String(row.number),
    status: row.status as OrderStatus,
    paymentMethod: (row.payment_method as PaymentMethod) ?? "cod",
    paymentStatus: (row.payment_status as Order["paymentStatus"]) ?? "unpaid",
    source: (row.source as Order["source"]) ?? "shop",
    locale: locale(row.locale),
    customerId: str(row.customer_id),
    customerName: String(row.customer_name ?? ""),
    customerCompany: str(row.customer_company),
    customerEmail: str(row.customer_email),
    customerPhone: str(row.customer_phone),
    customerCity: str(row.customer_city),
    customerAddress: str(row.customer_address),
    customerNote: str(row.customer_note),
    subtotal: num(row.subtotal),
    shipping: num(row.shipping),
    discount: num(row.discount),
    total: num(row.total),
    costTotal: num(row.cost_total),
    refundedAmount: num(row.refunded_amount),
    carrier: str(row.carrier),
    trackingNumber: str(row.tracking_number),
    supplierRef: str(row.supplier_ref),
    deliverySlot: str(row.delivery_slot),
    deliveryNote: str(row.delivery_note),
    damageFlag: Boolean(row.damage_flag),
    internalNote: str(row.internal_note),
    cancelReason: str(row.cancel_reason),
    offerToken: str(row.offer_token),
    offerExpiresAt: str(row.offer_expires_at),
    offerSentAt: str(row.offer_sent_at),
    quoteId: str(row.quote_id),
    confirmedAt: str(row.confirmed_at),
    shippedAt: str(row.shipped_at),
    deliveredAt: str(row.delivered_at),
    paidAt: str(row.paid_at),
    cancelledAt: str(row.cancelled_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
    items: items.map(mapItem).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function mapCustomer(row: Row): Customer {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    company: str(row.company),
    email: str(row.email),
    phone: str(row.phone),
    city: str(row.city),
    address: str(row.address),
    locale: locale(row.locale),
    stage: (row.stage as CustomerStage) ?? "lead",
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    notes: str(row.notes),
    createdAt: String(row.created_at),
  };
}

function mapEmail(row: Row): EmailLog {
  return {
    id: String(row.id),
    customerId: str(row.customer_id),
    orderId: str(row.order_id),
    quoteId: str(row.quote_id),
    toEmail: String(row.to_email),
    subject: String(row.subject),
    html: String(row.html ?? ""),
    kind: String(row.kind ?? "message"),
    status: (row.status as EmailLog["status"]) ?? "sent",
    error: str(row.error),
    createdAt: String(row.created_at),
  };
}

function mapQuote(row: Row): QuoteRequest {
  return {
    id: String(row.id),
    company: String(row.company ?? ""),
    contactName: String(row.contact_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    city: str(row.city),
    sector: String(row.sector ?? ""),
    product: str(row.product),
    quantity: str(row.quantity),
    message: String(row.message ?? ""),
    status: (row.status as QuoteRequest["status"]) ?? "new",
    locale: locale(row.locale),
    draftOrderId: str(row.draft_order_id),
    repliedAt: str(row.replied_at),
    createdAt: String(row.created_at),
  };
}

/* ── Orders ──────────────────────────────────────────────────────────── */

export const orderTabs = ["all", "to_ship", "pending", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderTab = (typeof orderTabs)[number];

const tabStatuses: Record<OrderTab, OrderStatus[]> = {
  all: ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"],
  to_ship: ["confirmed"],
  pending: ["pending"],
  shipped: ["shipped"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
  refunded: ["refunded"],
};

function matchesQuery(order: Order, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [order.number, order.customerName, order.customerCompany, order.customerEmail, order.customerPhone, order.customerCity]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

export async function listOrders({ tab = "all", q = "", drafts = false }: { tab?: OrderTab; q?: string; drafts?: boolean } = {}): Promise<Order[]> {
  const statuses = drafts ? (["draft"] as OrderStatus[]) : tabStatuses[tab];
  const client = getDb();
  if (!client) {
    return demoOrders()
      .filter((order) => statuses.includes(order.status) && matchesQuery(order, q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  let query = client
    .from("shop_orders")
    .select("*, shop_order_items(*)")
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(500);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ").trim();
    query = query.or(
      ["number", "customer_name", "customer_company", "customer_email", "customer_phone", "customer_city"]
        .map((column) => `${column}.ilike.%${safe}%`)
        .join(","),
    );
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapOrder(row as Row));
}

export async function countOrders() {
  const orders = await listOrders({ tab: "all" });
  const drafts = await listOrders({ drafts: true });
  const count = (status: OrderStatus) => orders.filter((order) => order.status === status).length;
  return {
    pending: count("pending"),
    toShip: count("confirmed"),
    shipped: count("shipped"),
    open: count("pending") + count("confirmed"),
    drafts: drafts.length,
  };
}

/** Orders since a date, all statuses except drafts. Used for statistics. */
export async function ordersSince(sinceIso: string): Promise<Order[]> {
  const client = getDb();
  if (!client) return demoOrders().filter((order) => order.status !== "draft" && order.createdAt >= sinceIso);
  const { data, error } = await client
    .from("shop_orders")
    .select("*, shop_order_items(*)")
    .neq("status", "draft")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapOrder(row as Row));
}

export async function getOrder(id: string): Promise<{ order: Order; events: OrderEvent[] } | null> {
  const client = getDb();
  if (!client) {
    const order = demoOrders().find((item) => item.id === id) ?? null;
    return order ? { order, events: demoEvents(order) } : null;
  }
  const { data, error } = await client.from("shop_orders").select("*, shop_order_items(*)").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const { data: events } = await client
    .from("shop_order_events")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });
  return {
    order: mapOrder(data as Row),
    events: (events ?? []).map((row) => ({
      id: String(row.id),
      kind: String(row.kind),
      message: String(row.message),
      createdAt: String(row.created_at),
    })) as OrderEvent[],
  };
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const client = getDb();
  if (!client) return demoOrders().find((order) => order.offerToken === token) ?? null;
  const { data } = await client.from("shop_orders").select("*, shop_order_items(*)").eq("offer_token", token).maybeSingle();
  return data ? mapOrder(data as Row) : null;
}

export async function getOrderByNumber(number: string) {
  const client = getDb();
  if (!client) return null;
  const { data } = await client.from("shop_orders").select("*, shop_order_items(*)").eq("number", number).maybeSingle();
  return data ? mapOrder(data as Row) : null;
}

export type NewItem = {
  productSlug: string | null;
  name: string;
  image: string | null;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export type NewOrder = {
  status: OrderStatus;
  source: Order["source"];
  paymentMethod: PaymentMethod;
  locale: Locale;
  customer: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
    note?: string | null;
  };
  items: NewItem[];
  shipping: number;
  discount: number;
  quoteId?: string | null;
  internalNote?: string | null;
};

export function newToken() {
  return randomBytes(24).toString("base64url");
}

export async function createOrder(input: NewOrder) {
  const client = db();
  const customerId = await upsertCustomer({
    name: input.customer.name,
    company: input.customer.company ?? null,
    email: input.customer.email ?? null,
    phone: input.customer.phone ?? null,
    city: input.customer.city ?? null,
    address: input.customer.address ?? null,
    locale: input.locale,
  });
  const totals = computeTotals(input.items, input.shipping, input.discount);
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("shop_orders")
    .insert({
      status: input.status,
      source: input.source,
      payment_method: input.paymentMethod,
      locale: input.locale,
      customer_id: customerId,
      customer_name: input.customer.name,
      customer_company: input.customer.company || null,
      customer_email: input.customer.email || null,
      customer_phone: input.customer.phone || null,
      customer_city: input.customer.city || null,
      customer_address: input.customer.address || null,
      customer_note: input.customer.note || null,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      discount: totals.discount,
      total: totals.total,
      cost_total: totals.costTotal,
      quote_id: input.quoteId ?? null,
      internal_note: input.internalNote ?? null,
      confirmed_at: input.status === "confirmed" ? now : null,
    })
    .select("id, number")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Order not created");

  const items = input.items.map((item, index) => ({
    order_id: data.id,
    product_slug: item.productSlug,
    name: item.name,
    image: item.image,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    unit_cost: item.unitCost,
    line_total: Math.round(item.quantity * item.unitPrice * 100) / 100,
    position: index,
  }));
  const { error: itemsError } = await client.from("shop_order_items").insert(items);
  if (itemsError) {
    await client.from("shop_orders").delete().eq("id", data.id);
    throw new Error(itemsError.message);
  }

  if (input.status !== "draft") {
    await client.from("customers").update({ stage: "customer" }).eq("id", customerId).eq("stage", "lead");
  }
  await addEvent(data.id, "created", input.status === "draft" ? "Draft created" : `Order received (${input.source})`);
  return { id: String(data.id), number: String(data.number) };
}

export async function updateOrder(id: string, patch: Row) {
  const { error } = await db().from("shop_orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteOrder(id: string) {
  const { error } = await db().from("shop_orders").delete().eq("id", id).eq("status", "draft");
  if (error) throw new Error(error.message);
}

export async function addEvent(orderId: string, kind: string, message: string) {
  const client = getDb();
  if (!client) return;
  await client.from("shop_order_events").insert({ order_id: orderId, kind, message });
}

function demoEvents(order: Order): OrderEvent[] {
  const events: OrderEvent[] = [{ id: "e1", kind: "created", message: "Order received (shop)", createdAt: order.createdAt }];
  if (order.confirmedAt) events.unshift({ id: "e2", kind: "status", message: "Confirmed by phone", createdAt: order.confirmedAt });
  if (order.shippedAt) events.unshift({ id: "e3", kind: "status", message: `Shipped with ${order.carrier ?? "carrier"}`, createdAt: order.shippedAt });
  if (order.deliveredAt) events.unshift({ id: "e4", kind: "status", message: "Delivered, cash collected", createdAt: order.deliveredAt });
  return events;
}

/* ── Customers ───────────────────────────────────────────────────────── */

export async function upsertCustomer(input: {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  locale: Locale;
}) {
  const client = db();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.replace(/\s+/g, "") || null;

  let existing: Row | null = null;
  if (email) {
    const { data } = await client.from("customers").select("*").eq("email", email).limit(1).maybeSingle();
    existing = (data as Row) ?? null;
  }
  if (!existing && phone) {
    const { data } = await client.from("customers").select("*").eq("phone", phone).limit(1).maybeSingle();
    existing = (data as Row) ?? null;
  }

  if (existing) {
    const patch: Row = {};
    if (!existing.name && input.name) patch.name = input.name;
    if (!existing.company && input.company) patch.company = input.company;
    if (!existing.email && email) patch.email = email;
    if (!existing.phone && phone) patch.phone = phone;
    if (input.city) patch.city = input.city;
    if (input.address) patch.address = input.address;
    if (Object.keys(patch).length) await client.from("customers").update(patch).eq("id", existing.id);
    return String(existing.id);
  }

  const { data, error } = await client
    .from("customers")
    .insert({
      name: input.name,
      company: input.company,
      email,
      phone,
      city: input.city,
      address: input.address,
      locale: input.locale,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Customer not created");
  return String(data.id);
}

export async function listCustomers({ stage, q = "" }: { stage?: CustomerStage; q?: string } = {}): Promise<CustomerWithStats[]> {
  const client = getDb();
  let customers: Customer[];
  let orders: Order[];
  if (!client) {
    customers = demoCustomers();
    orders = demoOrders();
  } else {
    const { data, error } = await client.from("customers").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    customers = (data ?? []).map((row) => mapCustomer(row as Row));
    const { data: orderRows } = await client
      .from("shop_orders")
      .select("id, customer_id, total, status, payment_status, created_at")
      .not("status", "in", "(draft,cancelled)");
    orders = (orderRows ?? []).map((row) => mapOrder(row as Row));
  }

  const needle = q.toLowerCase();
  return customers
    .filter((customer) => !stage || customer.stage === stage)
    .filter(
      (customer) =>
        !needle ||
        [customer.name, customer.company, customer.email, customer.phone, customer.city]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle)),
    )
    .map((customer) => {
      const own = orders.filter((order) => order.customerId === customer.id && order.status !== "draft" && order.status !== "cancelled");
      return {
        ...customer,
        orders: own.length,
        revenue: own.filter((order) => order.status !== "refunded").reduce((sum, order) => sum + order.total, 0),
        lastOrderAt: own.map((order) => order.createdAt).sort().at(-1) ?? null,
      };
    });
}

export async function getCustomer(id: string): Promise<{ customer: Customer; orders: Order[]; emails: EmailLog[] } | null> {
  const client = getDb();
  if (!client) {
    const customer = demoCustomers().find((item) => item.id === id);
    if (!customer) return null;
    return {
      customer,
      orders: demoOrders().filter((order) => order.customerId === id),
      emails: demoEmails().filter((email) => email.customerId === id),
    };
  }
  const { data } = await client.from("customers").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const [{ data: orders }, { data: emails }] = await Promise.all([
    client.from("shop_orders").select("*, shop_order_items(*)").eq("customer_id", id).order("created_at", { ascending: false }),
    client.from("email_log").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  return {
    customer: mapCustomer(data as Row),
    orders: (orders ?? []).map((row) => mapOrder(row as Row)),
    emails: (emails ?? []).map((row) => mapEmail(row as Row)),
  };
}

export async function updateCustomer(id: string, patch: Row) {
  const { error } = await db().from("customers").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ── E-mail log ──────────────────────────────────────────────────────── */

export async function logEmail(entry: Omit<EmailLog, "id" | "createdAt" | "quoteId"> & { quoteId?: string | null }) {
  const client = getDb();
  if (!client) return null;
  const { data } = await client
    .from("email_log")
    .insert({
      customer_id: entry.customerId,
      order_id: entry.orderId,
      ...(entry.quoteId ? { quote_id: entry.quoteId } : {}),
      to_email: entry.toEmail,
      subject: entry.subject,
      html: entry.html,
      kind: entry.kind,
      status: entry.status,
      error: entry.error,
    })
    .select("id")
    .single();
  return data ? String(data.id) : null;
}

export async function listOrderEmails(orderId: string): Promise<EmailLog[]> {
  const client = getDb();
  if (!client) return demoEmails().filter((email) => email.orderId === orderId);
  const { data } = await client.from("email_log").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapEmail(row as Row));
}

export async function listQuoteEmails(quoteId: string): Promise<EmailLog[]> {
  const client = getDb();
  if (!client) return [];
  const { data } = await client.from("email_log").select("*").eq("quote_id", quoteId).order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapEmail(row as Row));
}

export async function getEmail(id: string): Promise<EmailLog | null> {
  const client = getDb();
  if (!client) return demoEmails().find((email) => email.id === id) ?? null;
  const { data } = await client.from("email_log").select("*").eq("id", id).maybeSingle();
  return data ? mapEmail(data as Row) : null;
}

/* ── Quotes ──────────────────────────────────────────────────────────── */

export async function listQuotes(): Promise<QuoteRequest[]> {
  const client = getDb();
  if (!client) return demoQuotes();
  const { data, error } = await client.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapQuote(row as Row));
}

export async function getQuote(id: string): Promise<QuoteRequest | null> {
  const client = getDb();
  if (!client) return demoQuotes().find((quote) => quote.id === id) ?? null;
  const { data } = await client.from("quote_requests").select("*").eq("id", id).maybeSingle();
  return data ? mapQuote(data as Row) : null;
}

export async function updateQuote(id: string, patch: Row) {
  const { error } = await db().from("quote_requests").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ── Settings ────────────────────────────────────────────────────────── */

export async function getSettings(): Promise<ShopSettings> {
  const client = getDb();
  if (!client) return defaultSettings;
  const { data } = await client.from("site_settings").select("value").eq("key", "shop").maybeSingle();
  return { ...defaultSettings, ...((data?.value as Partial<ShopSettings>) ?? {}) };
}

export async function saveSettings(settings: ShopSettings) {
  const { error } = await db()
    .from("site_settings")
    .upsert({ key: "shop", value: settings, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/** Shipping for a cart subtotal, or null when it is confirmed by phone. */
export function shippingFor(settings: ShopSettings, subtotal: number) {
  if (settings.freeShippingFrom !== null && subtotal >= settings.freeShippingFrom) return 0;
  return settings.shippingFee;
}
