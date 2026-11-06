import { Suspense } from "react";
import { ProductManager, type ManagedProduct } from "@/components/admin/product-manager";
import { catalogProducts, categorySlugs, type CategorySlug, type Product } from "@/lib/catalog";
import { getAdminContext } from "@/lib/admin";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement des produits…</p>}>
      <Products />
    </Suspense>
  );
}

async function Products() {
  const context = await getAdminContext();
  const canWrite = context.role === "admin" && Boolean(context.supabase);
  const managed = new Map<string, ManagedProduct>(catalogProducts.map((product) => [product.slug, toManaged(product, false)]));

  if (context.supabase && context.role === "admin") {
    const { data } = await context.supabase.from("products").select("*").order("sort_order");
    for (const row of data ?? []) {
      if (!isCategory(row.category)) continue;
      managed.set(row.slug, {
        slug: row.slug,
        name: row.name,
        category: row.category,
        summary: row.summary,
        description: row.description,
        applications: (row.applications ?? []).join(", "),
        formats: (row.formats ?? []).join(", "),
        image: row.image_url,
        imageAlt: row.image_alt,
        featured: row.featured,
        published: row.published,
        sortOrder: row.sort_order,
        inDatabase: true,
        nameAr: row.name_ar ?? "",
        summaryAr: row.summary_ar ?? "",
        descriptionAr: row.description_ar ?? "",
        applicationsAr: (row.applications_ar ?? []).join("، "),
        formatsAr: (row.formats_ar ?? []).join("، "),
        imageAltAr: row.image_alt_ar ?? "",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-ink">Produits</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Le site public utilise le catalogue éditorial tant qu&apos;aucune ligne n&apos;est publiée en base. Un enregistrement remplace la référence du même slug. Masquer une référence éditoriale la retire du site.
        </p>
      </div>
      <ProductManager products={[...managed.values()]} canWrite={canWrite} />
    </div>
  );
}

function toManaged(product: Product, inDatabase: boolean): ManagedProduct {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    summary: product.summary,
    description: product.description,
    applications: product.applications.join(", "),
    formats: product.formats.join(", "),
    image: product.image,
    imageAlt: product.imageAlt,
    featured: product.featured,
    published: product.published,
    sortOrder: product.sortOrder,
    inDatabase,
    nameAr: product.ar?.name ?? "",
    summaryAr: product.ar?.summary ?? "",
    descriptionAr: product.ar?.description ?? "",
    applicationsAr: (product.ar?.applications ?? []).join("، "),
    formatsAr: (product.ar?.formats ?? []).join("، "),
    imageAltAr: product.ar?.imageAlt ?? "",
  };
}

function isCategory(value: string): value is CategorySlug {
  return categorySlugs.includes(value as CategorySlug);
}
