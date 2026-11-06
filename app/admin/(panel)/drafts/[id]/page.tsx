import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { confirmDraftAction, deleteDraftAction, newOfferLinkAction, sendOfferAction } from "@/app/actions/admin";
import { CopyButton, SubmitButton } from "@/components/admin/client";
import { Card, Flash, KeyValue, Loading, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { dateTime, mad, paymentMethodLabel } from "@/lib/admin/format";
import { getOrder, listOrderEmails } from "@/lib/shop/repo";
import { headers } from "next/headers";

export const metadata = { title: "Draft" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function Page(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Draft {...props} />
    </Suspense>
  );
}

async function origin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function Draft({ params, searchParams }: Props) {
  await connection();
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const found = await getOrder(id);
  if (!found) notFound();
  const { order, events } = found;
  if (order.status !== "draft") redirect(`/admin/orders/${order.id}`);

  const emails = await listOrderEmails(order.id);
  const expired = order.offerExpiresAt ? Date.parse(order.offerExpiresAt) < Date.now() : false;
  const link = order.offerToken ? `${await origin()}/${order.locale}/offre/${order.offerToken}` : null;

  return (
    <>
      <Link href="/admin/drafts" className="mb-4 inline-flex items-center gap-1 text-sm text-adm-muted hover:text-adm-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Drafts
      </Link>
      <PageHeader
        title={`Draft ${order.number}`}
        description={`${order.customerName}${order.customerCompany ? ` · ${order.customerCompany}` : ""} · created ${dateTime(order.createdAt)} · ${paymentMethodLabel(order)}`}
      />
      <Flash ok={query.ok} err={query.err} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <form action={sendOfferAction}>
              <input type="hidden" name="id" value={order.id} />
              <SubmitButton className="h-14 w-full text-base" pendingLabel="Sending offer…">
                <Send className="size-5" aria-hidden="true" />
                Send offer e-mail with confirm button · {mad(order.total)}
              </SubmitButton>
            </form>
            {!order.customerEmail ? (
              <div className="mt-3">
                <Notice tone="amber">No e-mail address: copy the link below and send it by WhatsApp or SMS.</Notice>
              </div>
            ) : (
              <p className="mt-3 text-sm text-adm-muted">
                Goes to {order.customerEmail} in {order.locale === "ar" ? "Arabic" : "French"}. The customer confirms online and pays on delivery.
              </p>
            )}

            <div className="mt-6 border-t border-adm-line pt-5">
              <p className="text-xs uppercase tracking-[0.12em] text-adm-muted">Offer link · valid 14 days</p>
              {link ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-adm-bg px-3 py-2 text-xs text-adm-text">{link}</code>
                  <CopyButton value={link} />
                  {expired ? <StatusBadge tone="red">Expired</StatusBadge> : <StatusBadge tone="green">until {dateTime(order.offerExpiresAt)}</StatusBadge>}
                </div>
              ) : (
                <p className="mt-2 text-sm text-adm-muted">No link yet. Sending the offer creates one, or create it alone:</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={newOfferLinkAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <SubmitButton variant="secondary" size="sm" pendingLabel="Creating…">
                    New link only
                  </SubmitButton>
                </form>
                <form action={confirmDraftAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <SubmitButton variant="secondary" size="sm" confirm="Turn this draft into a confirmed order?" pendingLabel="Confirming…">
                    Customer agreed · confirm order
                  </SubmitButton>
                </form>
                <form action={deleteDraftAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <SubmitButton variant="danger" size="sm" confirm="Delete this draft?" pendingLabel="Deleting…">
                    Delete draft
                  </SubmitButton>
                </form>
              </div>
            </div>
          </Card>

          <Card title="Items" padded={false}>
            <ul className="divide-y divide-adm-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <span>
                    {item.name}
                    <span className="block text-xs text-adm-muted">
                      {item.unit ?? "unit"} · {mad(item.unitPrice)} · cost {mad(item.unitCost)}
                    </span>
                  </span>
                  <span className="text-adm-muted">× {item.quantity}</span>
                  <span className="w-28 text-end tabular-nums">{mad(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-adm-line px-5 py-4">
              <KeyValue
                items={[
                  ["Subtotal", mad(order.subtotal)],
                  ["Shipping", mad(order.shipping)],
                  ["Discount", order.discount ? `− ${mad(order.discount)}` : "—"],
                  ["Total", <strong key="t">{mad(order.total)}</strong>],
                  ["Gross margin", <span key="m" className="text-adm-green">{mad(order.subtotal - order.discount - order.costTotal)}</span>],
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer" action={order.customerId ? <Link href={`/admin/customers/${order.customerId}`} className="text-xs text-adm-accent">CRM →</Link> : null}>
            <KeyValue
              items={[
                ["Name", order.customerName],
                ["Company", order.customerCompany ?? "—"],
                ["E-mail", order.customerEmail ?? "—"],
                ["Phone", order.customerPhone ?? "—"],
                ["City", order.customerCity ?? "—"],
                ["Language", order.locale === "ar" ? "Arabic" : "French"],
              ]}
            />
            {order.internalNote ? <p className="mt-3 whitespace-pre-wrap rounded-lg bg-adm-raised p-3 text-sm">{order.internalNote}</p> : null}
          </Card>
          <Card title="History">
            <ul className="space-y-2 text-sm">
              {events.map((event) => (
                <li key={event.id}>
                  {event.message}
                  <span className="block text-xs text-adm-muted">{dateTime(event.createdAt)}</span>
                </li>
              ))}
              {emails.map((email) => (
                <li key={email.id}>
                  <Link href={`/admin/emails/${email.id}`} className="hover:text-adm-accent">
                    ✉ {email.subject}
                  </Link>
                  <span className="block text-xs text-adm-muted">
                    {email.status} · {dateTime(email.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
