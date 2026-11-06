import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAdminContext } from "@/lib/admin";
import type { Order } from "@/lib/order-types";
import type { OrderStatus } from "@/lib/validations";

const filePath = path.join(process.cwd(), "data", "orders.json");

type OrderRow = {
  id: string;
  reference: string;
  company: string;
  contact_name: string;
  phone: string;
  email: string | null;
  product: string;
  quantity: number;
  unit_price: number | string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
};

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    reference: row.reference,
    company: row.company,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email ?? "",
    product: row.product,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    status: row.status,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

async function readLocalOrders() {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalOrders(orders: Order[]) {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(orders, null, 2), "utf8");
    return true;
  } catch {
    // Read-only file systems (Vercel) cannot keep local orders: Supabase is required there.
    return false;
  }
}

const localWriteFailed = {
  ok: false as const,
  message: "Stockage local indisponible sur cet hébergement. Connectez Supabase pour enregistrer les commandes.",
};

export function nextReference(references: string[]) {
  const highest = references.reduce((max, reference) => {
    const value = Number(reference.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `CMD-${String(highest + 1).padStart(4, "0")}`;
}

export async function listOrders(): Promise<{ orders: Order[]; source: "database" | "local" }> {
  const context = await getAdminContext();
  if (context.supabase && context.role === "admin") {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, reference, company, contact_name, phone, email, product, quantity, unit_price, status, notes, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: ((data ?? []) as OrderRow[]).map(fromRow), source: "database" };
  }

  const orders = await readLocalOrders();
  return {
    orders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    source: "local",
  };
}

export async function saveOrderRecord(input: Omit<Order, "id" | "reference" | "createdAt"> & { id?: string }) {
  const context = await getAdminContext();
  if (context.configured && context.supabase && context.role === "admin") {
    if (input.id) {
      const { error } = await context.supabase
        .from("orders")
        .update({
          company: input.company,
          contact_name: input.contactName,
          phone: input.phone,
          email: input.email || null,
          product: input.product,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          status: input.status,
          notes: input.notes || null,
        })
        .eq("id", input.id);
      if (error) return { ok: false as const, message: "La commande n'a pas été enregistrée." };
      return { ok: true as const };
    }

    const { data: existing } = await context.supabase.from("orders").select("reference");
    const reference = nextReference((existing ?? []).map((row) => String(row.reference)));
    const { error } = await context.supabase.from("orders").insert({
      reference,
      company: input.company,
      contact_name: input.contactName,
      phone: input.phone,
      email: input.email || null,
      product: input.product,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      status: input.status,
      notes: input.notes || null,
    });
    if (error) return { ok: false as const, message: "La commande n'a pas été créée. Vérifiez que la table orders existe." };
    return { ok: true as const };
  }

  if (context.configured) {
    return { ok: false as const, message: "Session administrateur requise." };
  }

  const orders = await readLocalOrders();
  if (input.id) {
    const index = orders.findIndex((order) => order.id === input.id);
    if (index === -1) return { ok: false as const, message: "Commande introuvable." };
    const current = orders[index];
    if (!current) return { ok: false as const, message: "Commande introuvable." };
    orders[index] = { ...current, ...input, id: current.id, reference: current.reference, createdAt: current.createdAt };
  } else {
    orders.push({
      ...input,
      id: randomUUID(),
      reference: nextReference(orders.map((order) => order.reference)),
      createdAt: new Date().toISOString(),
    });
  }
  if (!(await writeLocalOrders(orders))) return localWriteFailed;
  return { ok: true as const };
}

export async function deleteOrderRecord(id: string) {
  const context = await getAdminContext();
  if (context.configured && context.supabase && context.role === "admin") {
    const { error } = await context.supabase.from("orders").delete().eq("id", id);
    if (error) return { ok: false as const, message: "La commande n'a pas été supprimée." };
    return { ok: true as const };
  }
  if (context.configured) return { ok: false as const, message: "Session administrateur requise." };

  const orders = await readLocalOrders();
  if (!(await writeLocalOrders(orders.filter((order) => order.id !== id)))) return localWriteFailed;
  return { ok: true as const };
}
