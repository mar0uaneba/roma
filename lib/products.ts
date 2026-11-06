import { cacheLife, cacheTag } from "next/cache";
import { catalogProducts, categoryBySlug, localizeProduct, type Product } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { getDb } from "@/lib/db";
import { createPublicClient } from "@/lib/supabase/public";

type ProductRow = {
  slug: string;
  name: string;
  category: Product["category"];
  summary: string;
  description: string;
  applications: string[] | null;
  formats: string[] | null;
  image_url: string;
  image_alt: string;
  featured: boolean;
  published: boolean;
  sort_order: number;
  name_ar?: string | null;
  summary_ar?: string | null;
  description_ar?: string | null;
  applications_ar?: string[] | null;
  formats_ar?: string[] | null;
  image_alt_ar?: string | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  cost_price?: number | string | null;
  stock?: number | null;
  status?: "active" | "hidden" | "sold_out" | null;
  unit?: string | null;
  unit_ar?: string | null;
  min_qty?: number | null;
  sku?: string | null;
  images?: string[] | null;
  feed_excluded?: boolean | null;
};

function num(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fromRow(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    summary: row.summary,
    description: row.description,
    applications: row.applications ?? [],
    formats: row.formats ?? [],
    image: row.image_url,
    imageAlt: row.image_alt,
    featured: row.featured,
    sortOrder: row.sort_order,
    published: row.published,
    ar: {
      name: row.name_ar ?? undefined,
      summary: row.summary_ar ?? undefined,
      description: row.description_ar ?? undefined,
      applications: row.applications_ar ?? undefined,
      formats: row.formats_ar ?? undefined,
      imageAlt: row.image_alt_ar ?? undefined,
    },
    price: num(row.price),
    compareAtPrice: num(row.compare_at_price),
    costPrice: num(row.cost_price),
    stock: row.stock ?? null,
    status: row.status ?? "active",
    unit: row.unit ?? null,
    unitAr: row.unit_ar ?? null,
    minQty: row.min_qty ?? 1,
    sku: row.sku ?? null,
    images: row.images ?? [],
    feedExcluded: row.feed_excluded ?? false,
  };
}

function mergeProducts(rows: ProductRow[]) {
  const merged = new Map(catalogProducts.map((product) => [product.slug, product]));

  for (const row of rows) {
    if (!categoryBySlug(row.category)) continue;
    if (!row.published || row.status === "hidden") {
      merged.delete(row.slug);
      continue;
    }
    merged.set(row.slug, fromRow(row));
  }

  return [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr"));
}

export async function getPublicProducts() {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  // Prefer the server key: it reads the shop columns (price, stock…) directly.
  const db = getDb();
  if (db) {
    const { data, error } = await db.from("products").select("*");
    if (!error && data) return mergeProducts(data as ProductRow[]);
  }

  const supabase = createPublicClient();
  if (!supabase) return catalogProducts;

  const { data, error } = await supabase.rpc("public_products");

  if (error || !data) return catalogProducts;
  return mergeProducts(data as ProductRow[]);
}

/** Every product including hidden ones, for the admin. Not cached. */
export async function getAllProductsForAdmin() {
  const db = getDb();
  const merged = new Map(catalogProducts.map((product) => [product.slug, { ...product, inDatabase: false }]));
  if (db) {
    const { data } = await db.from("products").select("*");
    for (const row of (data ?? []) as ProductRow[]) {
      if (!categoryBySlug(row.category)) continue;
      merged.set(row.slug, { ...fromRow(row), inDatabase: true });
    }
  }
  return [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr"));
}

export async function getLocalizedProducts(locale: Locale) {
  const products = await getPublicProducts();
  return products.map((product) => localizeProduct(product, locale));
}

export async function getProduct(slug: string, locale: Locale) {
  const products = await getLocalizedProducts(locale);
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getFeaturedProducts(locale: Locale, limit = 6) {
  const products = await getLocalizedProducts(locale);
  return products.filter((product) => product.featured).slice(0, limit);
}
