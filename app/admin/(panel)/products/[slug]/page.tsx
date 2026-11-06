import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense, type ReactNode } from "react";
import { saveProductAction, uploadProductImageAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Card, Field, Flash, Loading, Notice, PageHeader } from "@/components/admin/ui";
import { mad } from "@/lib/admin/format";
import { categories, type Product } from "@/lib/catalog";
import { isDbConfigured } from "@/lib/db";
import { getAllProductsForAdmin } from "@/lib/products";

export const metadata = { title: "Product" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function Page(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <ProductPage {...props} />
    </Suspense>
  );
}

const blank: Product & { inDatabase: boolean } = {
  slug: "",
  name: "",
  category: "patisserie",
  summary: "",
  description: "",
  applications: [],
  formats: [],
  image: "/images/plain-box.jpg",
  imageAlt: "",
  featured: false,
  sortOrder: 100,
  published: true,
  status: "active",
  inDatabase: false,
};

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

async function ProductPage({ params, searchParams }: Props) {
  await connection();
  await requireAdmin();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const isNew = slug === "new";
  const all = await getAllProductsForAdmin();
  const product = isNew ? blank : all.find((item) => item.slug === slug);
  if (!product) notFound();
  const editable = isDbConfigured();
  const margin = product.price && product.costPrice ? product.price - product.costPrice : null;

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-adm-muted hover:text-adm-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Products
      </Link>
      <PageHeader
        title={isNew ? "New product" : product.name}
        description={isNew ? "Create a product. Add a price to make it orderable online." : `/${product.slug}${product.inDatabase ? "" : " · from the built-in catalogue (saving copies it to the database)"}`}
        actions={
          isNew ? null : (
            <a href={`/fr/produits/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-adm-muted hover:text-adm-text">
              View on site <ExternalLink className="inline size-3.5" aria-hidden="true" />
            </a>
          )
        }
      />
      <Flash ok={query.ok} err={query.err} />
      {!editable ? (
        <div className="mb-4">
          <Notice tone="amber">Demo mode: connect the database to save products.</Notice>
        </div>
      ) : null}

      <form action={saveProductAction} className="grid gap-6 xl:grid-cols-3">
        <input type="hidden" name="originalSlug" value={isNew ? "" : product.slug} />
        <div className="space-y-6 xl:col-span-2">
          <Card title="Product (French)">
            <Grid>
              <Field label="Name *">
                <input name="name" defaultValue={product.name} required className="admin-input" />
              </Field>
              <Field label="Slug (URL)" hint="Lowercase, no accents. Left empty: generated from the name.">
                <input name="slug" defaultValue={product.slug} className="admin-input" />
              </Field>
              <Field label="Category">
                <select name="category" defaultValue={product.category} className="admin-input">
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sales unit" hint="e.g. carton de 100, lot de 250">
                <input name="unit" defaultValue={product.unit ?? ""} className="admin-input" />
              </Field>
            </Grid>
            <Field label="Summary" className="mt-3">
              <textarea name="summary" defaultValue={product.summary} className="admin-input" />
            </Field>
            <Field label="Description" className="mt-3">
              <textarea name="description" defaultValue={product.description} className="admin-input min-h-32" />
            </Field>
            <Grid>
              <Field label="Uses (one per line)" className="mt-3">
                <textarea name="applications" defaultValue={product.applications.join("\n")} className="admin-input" />
              </Field>
              <Field label="Formats (one per line)" className="mt-3">
                <textarea name="formats" defaultValue={product.formats.join("\n")} className="admin-input" />
              </Field>
            </Grid>
          </Card>

          <Card title="Arabic version (optional)">
            <div dir="rtl" lang="ar" className="space-y-3">
              <Grid>
                <Field label="الاسم">
                  <input name="nameAr" defaultValue={product.ar?.name ?? ""} className="admin-input" />
                </Field>
                <Field label="وحدة البيع">
                  <input name="unitAr" defaultValue={product.unitAr ?? ""} className="admin-input" />
                </Field>
              </Grid>
              <Field label="الملخص">
                <textarea name="summaryAr" defaultValue={product.ar?.summary ?? ""} className="admin-input" />
              </Field>
              <Field label="الوصف">
                <textarea name="descriptionAr" defaultValue={product.ar?.description ?? ""} className="admin-input min-h-32" />
              </Field>
              <Grid>
                <Field label="الاستعمالات (سطر لكل واحد)">
                  <textarea name="applicationsAr" defaultValue={(product.ar?.applications ?? []).join("\n")} className="admin-input" />
                </Field>
                <Field label="المقاسات (سطر لكل واحد)">
                  <textarea name="formatsAr" defaultValue={(product.ar?.formats ?? []).join("\n")} className="admin-input" />
                </Field>
              </Grid>
              <Field label="النص البديل للصورة">
                <input name="imageAltAr" defaultValue={product.ar?.imageAlt ?? ""} className="admin-input" />
              </Field>
            </div>
          </Card>

          <Card title="Photos">
            <div className="flex flex-wrap gap-3">
              {[product.image, ...(product.images ?? [])].map((src, index) => (
                <figure key={`${src}-${index}`} className="w-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-square w-28 rounded-lg object-cover" loading="lazy" />
                  <figcaption className="mt-1 text-[11px] text-adm-muted">{index === 0 ? "Main" : `Extra ${index}`}</figcaption>
                </figure>
              ))}
            </div>
            {(product.images ?? []).length === 0 ? <p className="mt-3 text-xs text-adm-amber">Only one photo. Products with several photos sell better.</p> : null}
            <Grid>
              <Field label="Main photo URL" className="mt-4">
                <input name="image" defaultValue={product.image} className="admin-input" />
              </Field>
              <Field label="Main photo alt text" className="mt-4">
                <input name="imageAlt" defaultValue={product.imageAlt} className="admin-input" />
              </Field>
            </Grid>
            <Field label="Extra photo URLs (one per line)" className="mt-3">
              <textarea name="images" defaultValue={(product.images ?? []).join("\n")} className="admin-input" />
            </Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Price and stock" className="xl:sticky xl:top-6">
            <div className="space-y-3">
              <Field label="Price (MAD)" hint="Empty = on quote only">
                <input name="price" inputMode="decimal" defaultValue={product.price ?? ""} className="admin-input" />
              </Field>
              <Field label="Compare-at price (MAD)" hint="Shown struck through">
                <input name="compareAtPrice" inputMode="decimal" defaultValue={product.compareAtPrice ?? ""} className="admin-input" />
              </Field>
              <Field label="Purchase price / cost (MAD)" hint="Used for margins, never shown on the site">
                <input name="costPrice" inputMode="decimal" defaultValue={product.costPrice ?? ""} className="admin-input" />
              </Field>
              {margin !== null ? (
                <p className="text-sm text-adm-green">
                  Margin {mad(margin)} per unit ({((margin / (product.price || 1)) * 100).toFixed(0)} %)
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock" hint="Empty = not tracked">
                  <input name="stock" inputMode="numeric" defaultValue={product.stock ?? ""} className="admin-input" />
                </Field>
                <Field label="Min. quantity">
                  <input name="minQty" inputMode="numeric" defaultValue={product.minQty ?? 1} className="admin-input" />
                </Field>
              </div>
              <Field label="SKU">
                <input name="sku" defaultValue={product.sku ?? ""} className="admin-input" />
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={product.status ?? "active"} className="admin-input">
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="sold_out">Sold out</option>
                </select>
              </Field>
              <Field label="Sort order">
                <input name="sortOrder" inputMode="numeric" defaultValue={product.sortOrder} className="admin-input" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-adm-muted">
                <input type="checkbox" name="featured" defaultChecked={product.featured} className="size-4 accent-[var(--color-adm-accent)]" />
                Featured on the homepage
              </label>
              <label className="flex items-center gap-2 text-sm text-adm-muted">
                <input type="checkbox" name="feedExcluded" defaultChecked={product.feedExcluded} className="size-4 accent-[var(--color-adm-accent)]" />
                Exclude from Google feed
              </label>
              <SubmitButton className="w-full" pendingLabel="Saving…">
                Save product
              </SubmitButton>
            </div>
          </Card>
        </div>
      </form>

      {!isNew && product.inDatabase ? (
        <form action={uploadProductImageAction} className="mt-6 max-w-xl">
          <Card title="Upload a photo">
            <input type="hidden" name="slug" value={product.slug} />
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm text-adm-muted file:me-3 file:rounded-md file:border-0 file:bg-adm-raised file:px-3 file:py-2 file:text-adm-text" />
            <label className="mt-3 flex items-center gap-2 text-sm text-adm-muted">
              <input type="checkbox" name="main" className="size-4 accent-[var(--color-adm-accent)]" /> Use as main photo
            </label>
            <SubmitButton variant="secondary" className="mt-3" pendingLabel="Uploading…">
              Upload
            </SubmitButton>
            <p className="mt-2 text-xs text-adm-muted">JPG, PNG, WebP or AVIF, up to 4 MB. Stored in Supabase Storage (bucket product-images).</p>
          </Card>
        </form>
      ) : null}
    </>
  );
}
