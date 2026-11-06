"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { catalogProducts } from "@/lib/catalog";
import { getAdminContext } from "@/lib/admin";
import { productSchema, quoteStatusSchema, orderSchema } from "@/lib/validations";
import { deleteOrderRecord, saveOrderRecord } from "@/lib/orders";

type ActionResult = { ok: true } | { ok: false; message: string };

async function adminClient() {
  const context = await getAdminContext();
  if (!context.configured || !context.supabase) {
    return { ok: false as const, message: "Supabase n'est pas configuré." };
  }
  if (!context.user || context.role !== "admin") {
    return { ok: false as const, message: "Session administrateur requise." };
  }
  return { ok: true as const, supabase: context.supabase };
}

export async function signOut() {
  const context = await getAdminContext();
  if (context.supabase) {
    await context.supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export async function updateQuoteStatus(id: string, status: string): Promise<ActionResult> {
  const parsed = quoteStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, message: "Statut inconnu." };

  const access = await adminClient();
  if (!access.ok) return access;

  const { error } = await access.supabase
    .from("quote_requests")
    .update({ status: parsed.data })
    .eq("id", id);

  if (error) return { ok: false, message: "Le statut n'a pas été enregistré." };
  return { ok: true };
}

export async function saveProduct(input: unknown): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  }

  const access = await adminClient();
  if (!access.ok) return access;

  const product = parsed.data;
  const { error } = await access.supabase.from("products").upsert(
    {
      slug: product.slug,
      name: product.name,
      category: product.category,
      summary: product.summary,
      description: product.description,
      applications: splitList(product.applications),
      formats: splitList(product.formats),
      image_url: product.image,
      image_alt: product.imageAlt,
      featured: product.featured,
      published: product.published,
      sort_order: product.sortOrder,
      name_ar: product.nameAr || null,
      summary_ar: product.summaryAr || null,
      description_ar: product.descriptionAr || null,
      applications_ar: product.applicationsAr ? splitList(product.applicationsAr) : null,
      formats_ar: product.formatsAr ? splitList(product.formatsAr) : null,
      image_alt_ar: product.imageAltAr || null,
    },
    { onConflict: "slug" },
  );

  if (error) {
    return {
      ok: false,
      message: /_ar/.test(error.message)
        ? "Colonnes arabes absentes : exécutez supabase/migrations/003_i18n.sql."
        : "Le produit n'a pas été enregistré.",
    };
  }
  updateTag("products");
  return { ok: true };
}

export async function deleteProduct(slug: string): Promise<ActionResult> {
  const access = await adminClient();
  if (!access.ok) return access;

  const { error } = await access.supabase.from("products").delete().eq("slug", slug);
  if (error) return { ok: false, message: "Le produit n'a pas été retiré de la base." };
  updateTag("products");
  return { ok: true };
}

export async function importEditorialCatalog(): Promise<ActionResult> {
  const access = await adminClient();
  if (!access.ok) return access;

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

  const { error } = await access.supabase.from("products").upsert(rows, { onConflict: "slug" });
  if (error) return { ok: false, message: "L'import du catalogue n'a pas abouti." };
  updateTag("products");
  return { ok: true };
}

export async function saveOrder(input: unknown): Promise<ActionResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  }

  const order = parsed.data;
  const result = await saveOrderRecord({
    id: order.id || undefined,
    company: order.company,
    contactName: order.contactName,
    phone: order.phone,
    email: order.email,
    product: order.product,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    status: order.status,
    notes: order.notes ?? "",
  });
  return result.ok ? { ok: true } : result;
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  return deleteOrderRecord(id);
}

function splitList(value: string) {
  return value
    .split(/[,،]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
