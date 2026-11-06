import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { DraftForm, type DraftPrefill } from "@/components/admin/draft-form";
import { Flash, Loading, Notice, PageHeader } from "@/components/admin/ui";
import { getCategory } from "@/lib/catalog";
import { getAllProductsForAdmin } from "@/lib/products";
import { getQuote, getSettings, isDemo } from "@/lib/shop/repo";

export const metadata = { title: "New draft" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <NewDraft searchParams={searchParams} />
    </Suspense>
  );
}

async function NewDraft({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const [products, settings] = await Promise.all([getAllProductsForAdmin(), getSettings()]);
  const quote = typeof params.quote === "string" ? await getQuote(params.quote) : null;

  const prefill: DraftPrefill = quote
    ? {
        quoteId: quote.id,
        name: quote.contactName,
        company: quote.company,
        email: quote.email,
        phone: quote.phone,
        city: quote.city ?? undefined,
        locale: quote.locale,
        internalNote: [`From quote request: ${quote.product ?? "no reference"} · ${quote.quantity ?? "no quantity"}`, quote.message].join("\n"),
      }
    : {};

  return (
    <>
      <PageHeader title="New draft" description="Build an order for a customer, then send them an offer link to confirm it." />
      <Flash ok={params.ok} err={params.err} />
      {isDemo() ? (
        <div className="mb-4">
          <Notice tone="amber">Demo mode: you can try the form, but the draft will not be saved.</Notice>
        </div>
      ) : null}
      {quote ? (
        <div className="mb-4">
          <Notice tone="blue" title={`From quote request · ${quote.company}`}>
            {quote.message}
          </Notice>
        </div>
      ) : null}
      <DraftForm
        defaultShipping={settings.shippingFee}
        prefill={prefill}
        products={products
          .filter((product) => product.status !== "hidden")
          .map((product) => ({
            slug: product.slug,
            name: product.name,
            image: product.image,
            unit: product.unit ?? null,
            price: product.price ?? null,
            cost: product.costPrice ?? null,
            category: getCategory(product.category, "fr")?.name ?? product.category,
          }))}
      />
    </>
  );
}
