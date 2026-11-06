import { Download, Plus, Search } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { bulkProductStatusAction, importCatalogAction, publishSiteAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Card, Empty, Flash, Loading, Notice, PageHeader, StatusBadge, Table, Tabs, buttonClass, type Tone } from "@/components/admin/ui";
import { mad } from "@/lib/admin/format";
import { getCategory } from "@/lib/catalog";
import { isDbConfigured } from "@/lib/db";
import { getAllProductsForAdmin } from "@/lib/products";

export const metadata = { title: "Products" };

type Search = Promise<Record<string, string | string[] | undefined>>;

const statusMeta: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "green" },
  hidden: { label: "Hidden", tone: "gray" },
  sold_out: { label: "Sold out", tone: "red" },
};

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const filter = typeof params.status === "string" ? params.status : "all";
  const all = await getAllProductsForAdmin();
  const products = all.filter(
    (product) =>
      (filter === "all" ||
        (filter === "no_price" ? !product.price : filter === "one_photo" ? (product.images ?? []).length === 0 : filter === "feed_excluded" ? product.feedExcluded : (product.status ?? "active") === filter)) &&
      (!q || `${product.name} ${product.slug} ${product.sku ?? ""}`.toLowerCase().includes(q)),
  );
  const count = (predicate: (product: (typeof all)[number]) => boolean) => all.filter(predicate).length;

  return (
    <>
      <PageHeader
        title="Products"
        description="Products with a price can be bought online (cash on delivery). Without a price they stay “on quote”."
        actions={
          <>
            <form action={importCatalogAction}>
              <SubmitButton variant="secondary" pendingLabel="Importing…">
                <Download className="size-4" aria-hidden="true" /> Import catalogue
              </SubmitButton>
            </form>
            <form action={publishSiteAction}>
              <SubmitButton variant="secondary" pendingLabel="Publishing…">
                Publish changes
              </SubmitButton>
            </form>
            <Link href="/admin/products/new" className={buttonClass("primary")}>
              <Plus className="size-4" aria-hidden="true" /> New product
            </Link>
          </>
        }
      />
      <Flash ok={params.ok} err={params.err} />
      {!isDbConfigured() ? (
        <div className="mb-4">
          <Notice tone="amber">Products are read from the built-in catalogue. Connect the database to edit prices, stock and photos.</Notice>
        </div>
      ) : null}
      <Tabs
        active={filter}
        items={[
          { key: "all", label: "All", href: "/admin/products", count: all.length },
          { key: "active", label: "Active", href: "/admin/products?status=active", count: count((p) => (p.status ?? "active") === "active") },
          { key: "hidden", label: "Hidden", href: "/admin/products?status=hidden", count: count((p) => p.status === "hidden") },
          { key: "sold_out", label: "Sold out", href: "/admin/products?status=sold_out", count: count((p) => p.status === "sold_out") },
          { key: "no_price", label: "No price", href: "/admin/products?status=no_price", count: count((p) => !p.price) },
          { key: "one_photo", label: "Only one photo", href: "/admin/products?status=one_photo", count: count((p) => (p.images ?? []).length === 0) },
          { key: "feed_excluded", label: "Excluded from feed", href: "/admin/products?status=feed_excluded", count: count((p) => Boolean(p.feedExcluded)) },
        ]}
      />
      <form className="mb-4 flex max-w-md gap-2" action="/admin/products">
        {filter !== "all" ? <input type="hidden" name="status" value={filter} /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-adm-muted" aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Name, slug, SKU…" className="admin-input pl-9" />
        </div>
        <button type="submit" className={buttonClass("secondary")}>
          Search
        </button>
      </form>

      <form action={bulkProductStatusAction}>
        <Card padded={false}>
          {products.length === 0 ? (
            <div className="p-5">
              <Empty title="No product in this view" />
            </div>
          ) : (
            <Table head={["", "Product", "Price", "Cost", "Margin", "Stock", "Status"]} minWidth="54rem">
              {products.map((product) => {
                const margin = product.price && product.costPrice ? ((product.price - product.costPrice) / product.price) * 100 : null;
                const meta = statusMeta[product.status ?? "active"]!;
                return (
                  <tr key={product.slug} className="hover:bg-white/[0.02]">
                    <td className="w-10 px-4 py-3">
                      <input type="checkbox" name="slug" value={product.slug} className="size-4 accent-[var(--color-adm-accent)]" aria-label={`Select ${product.name}`} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${product.slug}`} className="flex items-center gap-3 hover:text-adm-accent">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image} alt="" className="size-10 rounded-md object-cover" loading="lazy" />
                        <span>
                          <span className="font-medium">{product.name}</span>
                          <span className="block text-xs text-adm-muted">
                            {getCategory(product.category, "fr")?.name} · {product.unit ?? "—"}
                            {product.inDatabase ? "" : " · catalogue"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {product.price ? mad(product.price) : <span className="text-adm-muted">On quote</span>}
                      {product.compareAtPrice ? <span className="block text-xs text-adm-muted line-through">{mad(product.compareAtPrice)}</span> : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-adm-muted">{product.costPrice ? mad(product.costPrice) : "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{margin === null ? "—" : <span className={margin >= 0 ? "text-adm-green" : "text-adm-red"}>{margin.toFixed(0)} %</span>}</td>
                    <td className="px-4 py-3 tabular-nums">{product.stock ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      {product.feedExcluded ? <span className="ms-2 text-[11px] text-adm-muted">no feed</span> : null}
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-adm-muted">With selected:</span>
          <SubmitButton name="status" value="active" size="sm" variant="secondary">
            Publish
          </SubmitButton>
          <SubmitButton name="status" value="hidden" size="sm" variant="secondary">
            Hide
          </SubmitButton>
          <SubmitButton name="status" value="sold_out" size="sm" variant="secondary">
            Mark sold out
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
