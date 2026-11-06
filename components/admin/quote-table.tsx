"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateQuoteStatus } from "@/app/actions/admin";
import { statusLabels, quoteStatuses, type QuoteStatus } from "@/lib/validations";

export type QuoteRow = {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string | null;
  sector: string;
  product: string | null;
  quantity: string | null;
  message: string;
  status: QuoteStatus;
  created_at: string;
  locale?: string | null;
};

export function QuoteTable({ quotes, canWrite }: { quotes: QuoteRow[]; canWrite: boolean }) {
  const router = useRouter();

  if (quotes.length === 0) {
    return <p className="text-sm text-muted">Aucune demande enregistrée.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card">
      <table className="w-full min-w-[46rem] text-start text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Entreprise</th>
            <th className="px-4 py-3 font-medium">Besoin</th>
            <th className="px-4 py-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id} className="border-b border-line align-top last:border-0">
              <td className="px-4 py-4 text-muted">{quote.created_at.slice(0, 16).replace("T", " ")}</td>
              <td className="px-4 py-4">
                <p className="font-medium">
                  {quote.company}
                  {quote.locale === "ar" ? (
                    <span className="ms-2 rounded-full bg-ink px-2 py-0.5 text-[10px] uppercase tracking-wider text-background">AR</span>
                  ) : null}
                </p>
                <p>{quote.contact_name}</p>
                <p className="text-muted">{quote.email}</p>
                <p className="text-muted">{quote.phone}</p>
              </td>
              <td className="px-4 py-4">
                <p>{quote.sector}{quote.city ? ` · ${quote.city}` : ""}</p>
                <p className="text-muted">{quote.product || "Référence non précisée"} · {quote.quantity || "Quantité non précisée"}</p>
                <p className="mt-2 max-w-md whitespace-pre-wrap" dir="auto">{quote.message}</p>
              </td>
              <td className="px-4 py-4">
                <label className="sr-only" htmlFor={`status-${quote.id}`}>Statut de {quote.company}</label>
                <select
                  id={`status-${quote.id}`}
                  className="h-10 rounded-md border border-line bg-background px-2"
                  value={quote.status}
                  disabled={!canWrite}
                  onChange={async (event) => {
                    const result = await updateQuoteStatus(quote.id, event.target.value);
                    if (!result.ok) {
                      toast.error(result.message);
                      return;
                    }
                    toast.success(`Statut : ${statusLabels[event.target.value as QuoteStatus]}`);
                    router.refresh();
                  }}
                >
                  {quoteStatuses.map((status) => (
                    <option key={status} value={status}>{statusLabels[status]}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
