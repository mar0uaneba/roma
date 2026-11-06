import { ArrowLeft, FileDown, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import {
  cancelOrderAction,
  confirmOrderAction,
  deliverOrderAction,
  emailOrderCustomerAction,
  markPaidAction,
  refundOrderAction,
  saveFreightAction,
  saveNoteAction,
  shipOrderAction,
} from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Card, Field, Flash, KeyValue, Loading, Notice, PageHeader, StatusBadge, buttonClass } from "@/components/admin/ui";
import { dateTime, mad, orderStatusMeta, paymentMeta, paymentMethodLabel } from "@/lib/admin/format";
import { getOrder, listOrderEmails } from "@/lib/shop/repo";
import type { Order } from "@/lib/shop/types";

export const metadata = { title: "Order" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const carriers = ["Amana", "CTM Messagerie", "Sendit", "Ozon Express", "Cathedis", "Own delivery", "Other"];

export default function Page(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <OrderPage {...props} />
    </Suspense>
  );
}

function Checkbox({ name, label, defaultChecked = false }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-adm-muted">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[var(--color-adm-accent)]" />
      {label}
    </label>
  );
}

function StatusActions({ order }: { order: Order }) {
  const hasEmail = Boolean(order.customerEmail);
  const notifyLabel = hasEmail ? `E-mail the customer (${order.locale.toUpperCase()})` : "No e-mail on file";

  return (
    <div className="space-y-5">
      {order.status === "pending" ? (
        <form action={confirmOrderAction} className="space-y-3">
          <input type="hidden" name="id" value={order.id} />
          <p className="text-sm text-adm-muted">Call the customer to confirm quantities, address and delivery fee, then confirm.</p>
          <Checkbox name="notify" label={notifyLabel} defaultChecked={hasEmail} />
          <SubmitButton pendingLabel="Confirming…">Confirm order</SubmitButton>
        </form>
      ) : null}

      {order.status === "confirmed" || order.status === "pending" ? (
        <form action={shipOrderAction} className="space-y-3 border-t border-adm-line pt-5 first:border-0 first:pt-0">
          <input type="hidden" name="id" value={order.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Carrier">
              <select name="carrier" className="admin-input" defaultValue="Amana">
                {carriers.map((carrier) => (
                  <option key={carrier}>{carrier}</option>
                ))}
              </select>
            </Field>
            <Field label="Tracking number">
              <input name="tracking" className="admin-input" placeholder="Optional" />
            </Field>
          </div>
          <Checkbox name="notify" label={notifyLabel} defaultChecked={hasEmail} />
          <SubmitButton variant={order.status === "confirmed" ? "primary" : "secondary"} pendingLabel="Saving…">
            Mark as shipped
          </SubmitButton>
        </form>
      ) : null}

      {order.status === "shipped" ? (
        <form action={deliverOrderAction} className="space-y-3">
          <input type="hidden" name="id" value={order.id} />
          <Checkbox name="paid" label={order.paymentMethod === "cod" ? `Cash collected (${mad(order.total)})` : "Payment received"} defaultChecked={order.paymentMethod === "cod"} />
          <SubmitButton pendingLabel="Saving…">Mark as delivered</SubmitButton>
        </form>
      ) : null}

      {order.paymentStatus === "unpaid" && ["confirmed", "shipped", "delivered"].includes(order.status) ? (
        <form action={markPaidAction} className="border-t border-adm-line pt-5 first:border-0 first:pt-0">
          <input type="hidden" name="id" value={order.id} />
          <SubmitButton variant="secondary" pendingLabel="Saving…">
            Record payment received
          </SubmitButton>
        </form>
      ) : null}

      {["pending", "confirmed", "shipped"].includes(order.status) ? (
        <details className="border-t border-adm-line pt-5 first:border-0 first:pt-0">
          <summary className="cursor-pointer text-sm text-adm-red">Cancel order…</summary>
          <form action={cancelOrderAction} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={order.id} />
            <Field label="Reason (sent to the customer if notified)">
              <input name="reason" className="admin-input" placeholder="e.g. Out of stock, customer unreachable" />
            </Field>
            <Checkbox name="notify" label={notifyLabel} defaultChecked={false} />
            <SubmitButton variant="danger" confirm="Cancel this order?" pendingLabel="Cancelling…">
              Cancel order
            </SubmitButton>
          </form>
        </details>
      ) : null}

      {(order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded") && order.status !== "refunded" ? (
        <details className="border-t border-adm-line pt-5 first:border-0 first:pt-0">
          <summary className="cursor-pointer text-sm text-adm-muted">Refund…</summary>
          <form action={refundOrderAction} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={order.id} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Type">
                <select name="mode" className="admin-input" defaultValue="full">
                  <option value="full">Full ({mad(order.total - order.refundedAmount)})</option>
                  <option value="partial">Partial</option>
                </select>
              </Field>
              <Field label="Amount (partial)">
                <input name="amount" inputMode="decimal" className="admin-input" placeholder="0.00" />
              </Field>
              <Field label="Paid back by">
                <select name="method" className="admin-input">
                  <option>Cash</option>
                  <option>Bank transfer</option>
                  <option>Credit note</option>
                </select>
              </Field>
            </div>
            <SubmitButton variant="danger" confirm="Record this refund?" pendingLabel="Saving…">
              Record refund
            </SubmitButton>
          </form>
        </details>
      ) : null}

      {["delivered", "cancelled", "refunded"].includes(order.status) && order.paymentStatus !== "unpaid" ? (
        <p className="text-sm text-adm-muted">No further status actions.</p>
      ) : null}
    </div>
  );
}

async function OrderPage({ params, searchParams }: Props) {
  await connection();
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const found = await getOrder(id);
  if (!found) notFound();
  const { order, events } = found;
  if (order.status === "draft") {
    return (
      <Notice tone="blue">
        This is a draft. <Link href={`/admin/drafts/${order.id}`} className="underline">Open it in Drafts</Link>.
      </Notice>
    );
  }
  const emails = await listOrderEmails(order.id);
  const margin = order.subtotal - order.discount - order.costTotal;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-adm-muted hover:text-adm-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Orders
      </Link>
      <PageHeader
        title={`Order ${order.number}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={orderStatusMeta[order.status].tone}>{orderStatusMeta[order.status].label}</StatusBadge>
            <StatusBadge tone={paymentMeta[order.paymentStatus].tone}>{paymentMeta[order.paymentStatus].label}</StatusBadge>
            {order.damageFlag ? <StatusBadge tone="red">Damage reported</StatusBadge> : null}
            <span>
              {dateTime(order.createdAt)} · {paymentMethodLabel(order)} · source {order.source} · {order.locale === "ar" ? "Arabic" : "French"}
            </span>
          </span>
        }
        actions={
          <a href={`/admin/orders/${order.id}/packing-slip`} className={buttonClass("secondary")}>
            <FileDown className="size-4" aria-hidden="true" /> Packing slip
          </a>
        }
      />
      <Flash ok={query.ok} err={query.err} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Items" padded={false}>
            <ul className="divide-y divide-adm-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-adm-raised">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.image ? <img src={item.image} alt="" className="size-full object-cover" loading="lazy" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-adm-muted">
                      {item.unit ?? "unit"} · {mad(item.unitPrice)}
                      {item.productSlug ? (
                        <>
                          {" · "}
                          <Link href={`/admin/products/${item.productSlug}`} className="hover:text-adm-text">
                            product
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <p className="text-sm text-adm-muted tabular-nums">× {item.quantity}</p>
                  <p className="w-28 text-end font-medium tabular-nums">{mad(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-adm-line px-5 py-4">
              <KeyValue
                items={[
                  ["Subtotal", mad(order.subtotal)],
                  ["Shipping", mad(order.shipping)],
                  ...(order.discount > 0 ? ([["Discount", `− ${mad(order.discount)}`]] as [string, string][]) : []),
                  ...(order.refundedAmount > 0 ? ([["Refunded", `− ${mad(order.refundedAmount)}`]] as [string, string][]) : []),
                  ["Total", <strong key="t">{mad(order.total)}</strong>],
                ]}
              />
            </div>
          </Card>

          <Card title="Status">
            <StatusActions order={order} />
            {order.carrier ? (
              <p className="mt-5 border-t border-adm-line pt-4 text-sm text-adm-muted">
                Carrier: <span className="text-adm-text">{order.carrier}</span>
                {order.trackingNumber ? (
                  <>
                    {" "}· Tracking: <span className="text-adm-text">{order.trackingNumber}</span>
                  </>
                ) : null}
              </p>
            ) : null}
            {order.cancelReason ? <p className="mt-3 text-sm text-adm-red">Cancelled: {order.cancelReason}</p> : null}
          </Card>

          <Card title="Freight">
            <form action={saveFreightAction} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Supplier reference">
                  <input name="supplierRef" defaultValue={order.supplierRef ?? ""} className="admin-input" />
                </Field>
                <Field label="Delivery slot" hint="e.g. Tuesday 12 Nov, 9h–12h">
                  <input name="deliverySlot" defaultValue={order.deliverySlot ?? ""} className="admin-input" />
                </Field>
              </div>
              <Field label="Delivery note">
                <textarea name="deliveryNote" defaultValue={order.deliveryNote ?? ""} className="admin-input" />
              </Field>
              <div className="flex flex-wrap gap-5">
                <Checkbox name="damage" label="Damage reported" defaultChecked={order.damageFlag} />
                <Checkbox name="sendSlot" label="E-mail the delivery slot to the customer" />
              </div>
              <SubmitButton variant="secondary" pendingLabel="Saving…">
                Save freight details
              </SubmitButton>
            </form>
          </Card>

          <Card title="Write to the customer">
            <form action={emailOrderCustomerAction} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              {!order.customerEmail ? <Notice tone="amber">No e-mail address on this order. Use the phone number instead.</Notice> : null}
              <Field label="Subject">
                <input name="subject" className="admin-input" defaultValue={order.locale === "ar" ? `طلبكم ${order.number}` : `Votre commande ${order.number}`} />
              </Field>
              <Field label={`Message (${order.locale === "ar" ? "Arabic" : "French"} greeting and sign-off are added automatically)`}>
                <textarea name="message" className="admin-input min-h-32" dir={order.locale === "ar" ? "rtl" : "ltr"} />
              </Field>
              <SubmitButton variant="secondary" pendingLabel="Sending…">
                <Mail className="size-4" aria-hidden="true" /> Send e-mail
              </SubmitButton>
            </form>
            {emails.length ? (
              <ul className="mt-5 divide-y divide-adm-line border-t border-adm-line text-sm">
                {emails.map((email) => (
                  <li key={email.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/admin/emails/${email.id}`} className="truncate hover:text-adm-accent">
                      {email.subject}
                    </Link>
                    <span className="shrink-0 text-xs text-adm-muted">
                      {email.status} · {dateTime(email.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer" action={order.customerId ? <Link href={`/admin/customers/${order.customerId}`} className="text-xs text-adm-accent">CRM →</Link> : null}>
            <p className="font-medium">{order.customerName}</p>
            {order.customerCompany ? <p className="text-sm text-adm-muted">{order.customerCompany}</p> : null}
            <div className="mt-3 space-y-1.5 text-sm">
              {order.customerPhone ? (
                <a href={`tel:${order.customerPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-adm-accent">
                  <Phone className="size-3.5 text-adm-muted" aria-hidden="true" /> {order.customerPhone}
                </a>
              ) : null}
              {order.customerPhone ? (
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/\D/g, "").replace(/^0/, "212")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-adm-green hover:underline"
                >
                  Open WhatsApp
                </a>
              ) : null}
              {order.customerEmail ? (
                <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 hover:text-adm-accent">
                  <Mail className="size-3.5 text-adm-muted" aria-hidden="true" /> {order.customerEmail}
                </a>
              ) : null}
              <p className="pt-2 text-adm-muted">
                {[order.customerAddress, order.customerCity].filter(Boolean).join(", ") || "No address"}
              </p>
              {order.customerNote ? <p className="rounded-lg bg-adm-raised p-3 text-adm-text">“{order.customerNote}”</p> : null}
            </div>
          </Card>

          <Card title="Margin">
            <KeyValue
              items={[
                ["Revenue (excl. shipping)", mad(order.subtotal - order.discount)],
                ["Purchase cost", mad(order.costTotal)],
                ["Gross margin", <span key="m" className={margin >= 0 ? "text-adm-green" : "text-adm-red"}>{mad(margin)}</span>],
                ["Margin rate", order.subtotal > 0 ? `${((margin / (order.subtotal - order.discount || 1)) * 100).toFixed(1)} %` : "—"],
              ]}
            />
            {order.costTotal === 0 ? <p className="mt-3 text-xs text-adm-muted">Add purchase prices on products to see real margins.</p> : null}
          </Card>

          <Card title="Internal note">
            <form action={saveNoteAction} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <textarea name="note" defaultValue={order.internalNote ?? ""} className="admin-input" placeholder="Only visible to the team" />
              <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
                Save note
              </SubmitButton>
            </form>
          </Card>

          <Card title="History">
            <ol className="space-y-3 border-s border-adm-line ps-4">
              {events.map((event) => (
                <li key={event.id} className="relative text-sm">
                  <span className="absolute -start-[1.3rem] top-1.5 size-2 rounded-full bg-adm-accent" aria-hidden="true" />
                  <p>{event.message}</p>
                  <p className="text-xs text-adm-muted">{dateTime(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
