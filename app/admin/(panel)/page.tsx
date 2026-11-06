import { Suspense } from "react";
import { CategoryChart, QuoteChart } from "@/components/admin/charts";
import { categories } from "@/lib/catalog";
import { getAdminContext } from "@/lib/admin";
import { getPublicProducts } from "@/lib/products";
import type { QuoteStatus } from "@/lib/validations";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement des indicateurs…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const [context, products] = await Promise.all([getAdminContext(), getPublicProducts()]);
  let quotes: { status: QuoteStatus; created_at: string }[] = [];

  if (context.supabase && context.role === "admin") {
    const { data } = await context.supabase
      .from("quote_requests")
      .select("status, created_at")
      .order("created_at", { ascending: true });
    quotes = (data ?? []) as { status: QuoteStatus; created_at: string }[];
  }

  const byDay = new Map<string, number>();
  for (const quote of quotes) {
    const day = quote.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const categoryData = categories.map((category) => ({
    name: category.name,
    total: products.filter((product) => product.category === category.slug).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-ink">Tableau de bord</h1>
        <p className="mt-2 text-sm text-muted">
          La répartition du catalogue correspond aux références publiées. Les demandes n&apos;apparaissent qu&apos;une fois enregistrées.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Nouvelles" value={context.configured ? count(quotes, "new") : "—"} />
        <Stat label="En cours" value={context.configured ? count(quotes, "in_review") : "—"} />
        <Stat label="Devis envoyés" value={context.configured ? count(quotes, "quoted") : "—"} />
        <Stat label="Références publiées" value={String(products.length)} />
      </div>
      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">Demandes par jour</h2>
        <div className="mt-4">
          <QuoteChart data={[...byDay.entries()].map(([day, total]) => ({ day, total }))} />
        </div>
      </section>
      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">Catalogue publié par gamme</h2>
        <div className="mt-4">
          <CategoryChart data={categoryData} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-4xl text-ink">{value}</p>
    </div>
  );
}

function count(quotes: { status: QuoteStatus }[], status: QuoteStatus) {
  return String(quotes.filter((quote) => quote.status === status).length);
}
