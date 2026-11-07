import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { quoteToDraftAction, replyQuoteAction, setQuoteStatusAction } from "@/app/actions/admin";
import { ReplyComposer } from "@/components/admin/reply-composer";
import { SubmitButton } from "@/components/admin/client";
import { Card, Flash, KeyValue, Loading, Notice, PageHeader, StatusBadge, buttonClass, type Tone } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { dateTime } from "@/lib/admin/format";
import { isResendConfigured } from "@/lib/supabase/env";
import { defaultQuoteReplySubject } from "@/lib/shop/emails";
import { getQuote, listQuoteEmails } from "@/lib/shop/repo";

export const metadata = { title: "Quote request" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const statusMeta: Record<string, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "orange" },
  in_review: { label: "In progress", tone: "blue" },
  quoted: { label: "Offer sent", tone: "green" },
  closed: { label: "Closed", tone: "gray" },
};

const kindLabel: Record<string, string> = {
  "quote-received": "Automatic acknowledgement",
  "quote-reply": "Your reply",
};

/** wa.me needs international digits: 06… / 07… become 2126… / 2127…. */
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return `212${digits.slice(1)}`;
  return digits;
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <QuoteDetail {...props} />
    </Suspense>
  );
}

async function QuoteDetail({ params, searchParams }: Props) {
  await connection();
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const quote = await getQuote(id);
  if (!quote) notFound();
  const emails = await listQuoteEmails(quote.id);
  const status = statusMeta[quote.status] ?? { label: quote.status, tone: "gray" as Tone };
  const wa = whatsappNumber(quote.phone);

  return (
    <>
      <Link href="/admin/quotes" className="mb-4 inline-flex items-center gap-1 text-sm text-adm-muted hover:text-adm-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Quote requests
      </Link>
      <PageHeader
        title={quote.company}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            {quote.contactName} · received {dateTime(quote.createdAt)}
            {quote.repliedAt ? ` · replied ${dateTime(quote.repliedAt)}` : ""}
          </span>
        }
      />
      <Flash ok={query.ok} err={query.err} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Request">
            <KeyValue
              items={[
                ["Sector", quote.sector],
                ["Product", quote.product ?? "—"],
                ["Quantity", quote.quantity ?? "—"],
                ["City", quote.city ?? "—"],
                ["Language", quote.locale === "ar" ? "Arabic" : "French"],
              ]}
            />
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-adm-raised p-4 text-sm leading-6" dir="auto">
              {quote.message}
            </p>
          </Card>

          <Card title="Reply by e-mail">
            {!isResendConfigured() ? (
              <div className="mb-4">
                <Notice tone="amber">E-mail sending is not configured: the reply is saved in the history but not sent.</Notice>
              </div>
            ) : null}
            <ReplyComposer
              quoteId={quote.id}
              locale={quote.locale}
              defaultSubject={defaultQuoteReplySubject(quote)}
              customerName={quote.contactName}
              customerEmail={quote.email}
              context={{ product: quote.product, quantity: quote.quantity, phone: quote.phone, city: quote.city }}
              action={replyQuoteAction}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <KeyValue
              items={[
                ["Company", quote.company],
                ["Contact", quote.contactName],
                ["E-mail", quote.email],
                ["Phone", <span key="p" dir="ltr">{quote.phone}</span>],
              ]}
            />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <a href={`tel:${quote.phone.replace(/[^\d+]/g, "")}`} className={buttonClass("secondary", "sm")}>
                <Phone className="size-3.5" aria-hidden="true" /> Call
              </a>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
                <MessageCircle className="size-3.5" aria-hidden="true" /> WhatsApp
              </a>
              <a href={`mailto:${quote.email}`} className={buttonClass("secondary", "sm")}>
                <Mail className="size-3.5" aria-hidden="true" /> Mail
              </a>
            </div>
          </Card>

          <Card title="Status">
            <form action={setQuoteStatusAction} className="flex gap-2">
              <input type="hidden" name="id" value={quote.id} />
              <select name="status" defaultValue={quote.status} className="admin-input" aria-label="Status">
                {Object.entries(statusMeta).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <SubmitButton variant="secondary">Set</SubmitButton>
            </form>
            <div className="mt-4 border-t border-adm-line pt-4">
              {quote.draftOrderId ? (
                <Link href={`/admin/drafts/${quote.draftOrderId}`} className="text-sm text-adm-accent">
                  Open draft offer →
                </Link>
              ) : (
                <form action={quoteToDraftAction}>
                  <input type="hidden" name="id" value={quote.id} />
                  <SubmitButton variant="secondary" className="w-full">
                    Create a priced draft offer
                  </SubmitButton>
                  <p className="mt-2 text-xs text-adm-muted">Builds an order with prices; the customer confirms it online and pays on delivery.</p>
                </form>
              )}
            </div>
          </Card>

          <Card title="History">
            <ul className="space-y-3 text-sm">
              <li>
                Request received
                <span className="block text-xs text-adm-muted">{dateTime(quote.createdAt)}</span>
              </li>
              {[...emails].reverse().map((email) => (
                <li key={email.id}>
                  <Link href={`/admin/emails/${email.id}`} className="hover:text-adm-accent">
                    ✉ {kindLabel[email.kind] ?? email.subject}
                  </Link>
                  <span className="block text-xs text-adm-muted">
                    <StatusBadge tone={email.status === "sent" ? "green" : email.status === "failed" ? "red" : "gray"}>{email.status}</StatusBadge>{" "}
                    {dateTime(email.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-adm-muted">Customer answers arrive in your mailbox ({"reply-to"} address), not here.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
