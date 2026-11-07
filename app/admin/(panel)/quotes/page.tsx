import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { quoteToDraftAction, setQuoteStatusAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Card, Empty, Flash, Loading, PageHeader, StatusBadge, buttonClass, type Tone } from "@/components/admin/ui";
import { dateTime } from "@/lib/admin/format";
import { listQuotes } from "@/lib/shop/repo";

export const metadata = { title: "Quote requests" };

type Search = Promise<Record<string, string | string[] | undefined>>;

const statusMeta: Record<string, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "orange" },
  in_review: { label: "In progress", tone: "blue" },
  quoted: { label: "Offer sent", tone: "green" },
  closed: { label: "Closed", tone: "gray" },
};

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <Quotes searchParams={searchParams} />
    </Suspense>
  );
}

async function Quotes({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const [params, quotes] = await Promise.all([searchParams, listQuotes()]);

  return (
    <>
      <PageHeader
        title="Quote requests"
        description="Requests from the website quote form. Open one to reply by e-mail in the customer's language, or turn it into a priced draft offer."
      />
      <Flash ok={params.ok} err={params.err} />
      {quotes.length === 0 ? (
        <Empty title="No quote requests yet" />
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">
                      <Link href={`/admin/quotes/${quote.id}`} className="hover:text-adm-accent">
                        {quote.company}
                      </Link>
                    </h2>
                    <StatusBadge tone={statusMeta[quote.status]?.tone ?? "gray"}>{statusMeta[quote.status]?.label ?? quote.status}</StatusBadge>
                    {quote.locale === "ar" ? <StatusBadge tone="gray">AR</StatusBadge> : null}
                    {quote.repliedAt ? <StatusBadge tone="green">Replied {dateTime(quote.repliedAt)}</StatusBadge> : null}
                    <span className="text-xs text-adm-muted">{dateTime(quote.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-adm-muted">
                    {quote.contactName} · <a href={`mailto:${quote.email}`} className="hover:text-adm-text">{quote.email}</a> ·{" "}
                    <a href={`tel:${quote.phone.replace(/\s/g, "")}`} className="hover:text-adm-text">{quote.phone}</a>
                    {quote.city ? ` · ${quote.city}` : ""}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="text-adm-muted">{quote.sector}</span> · {quote.product || "No reference"} · {quote.quantity || "No quantity"}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-adm-raised p-3 text-sm" dir="auto">
                    {quote.message}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 lg:w-56">
                  <Link href={`/admin/quotes/${quote.id}`} className={buttonClass("primary", "sm", "w-full")}>
                    {quote.repliedAt ? "Open conversation" : "Reply"}
                  </Link>
                  {quote.draftOrderId ? (
                    <Link href={`/admin/drafts/${quote.draftOrderId}`} className="text-sm text-adm-accent">
                      Open draft →
                    </Link>
                  ) : (
                    <form action={quoteToDraftAction}>
                      <input type="hidden" name="id" value={quote.id} />
                      <SubmitButton size="sm" variant="secondary" className="w-full">
                        Create draft offer
                      </SubmitButton>
                    </form>
                  )}
                  <form action={setQuoteStatusAction} className="flex gap-2">
                    <input type="hidden" name="id" value={quote.id} />
                    <select name="status" defaultValue={quote.status} className="admin-input py-1.5 text-xs" aria-label="Status">
                      {Object.entries(statusMeta).map(([value, meta]) => (
                        <option key={value} value={value}>
                          {meta.label}
                        </option>
                      ))}
                    </select>
                    <SubmitButton size="sm" variant="secondary">
                      Set
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
