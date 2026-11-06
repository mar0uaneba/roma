import { Suspense } from "react";
import { QuoteTable, type QuoteRow } from "@/components/admin/quote-table";
import { getAdminContext } from "@/lib/admin";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement des demandes…</p>}>
      <Quotes />
    </Suspense>
  );
}

async function Quotes() {
  const context = await getAdminContext();
  let quotes: QuoteRow[] = [];

  if (context.supabase && context.role === "admin") {
    const { data } = await context.supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    quotes = (data ?? []) as QuoteRow[];
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Demandes</h1>
      <QuoteTable quotes={quotes} canWrite={context.role === "admin"} />
    </div>
  );
}
