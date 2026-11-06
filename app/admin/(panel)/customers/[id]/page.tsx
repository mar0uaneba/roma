import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { emailCustomerAction, saveCustomerAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Card, Empty, Field, Flash, Loading, Notice, PageHeader, Stat, StatusBadge, Table } from "@/components/admin/ui";
import { dateOnly, dateTime, mad, orderStatusMeta, stageMeta } from "@/lib/admin/format";
import { getCustomer } from "@/lib/shop/repo";
import { customerStages } from "@/lib/shop/types";

export const metadata = { title: "Customer" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function Page(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <CustomerPage {...props} />
    </Suspense>
  );
}

async function CustomerPage({ params, searchParams }: Props) {
  await connection();
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const found = await getCustomer(id);
  if (!found) notFound();
  const { customer, orders, emails } = found;
  const real = orders.filter((order) => !["draft", "cancelled"].includes(order.status));
  const revenue = real.filter((order) => order.status !== "refunded").reduce((sum, order) => sum + order.total, 0);
  const margin = real.reduce((sum, order) => sum + order.subtotal - order.discount - order.costTotal, 0);

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-adm-muted hover:text-adm-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Customers
      </Link>
      <PageHeader
        title={customer.name || customer.email || "Customer"}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={stageMeta[customer.stage].tone}>{stageMeta[customer.stage].label}</StatusBadge>
            {customer.company ? <span>{customer.company}</span> : null}
            <span>· since {dateOnly(customer.createdAt)}</span>
            <span>· writes in {customer.locale === "ar" ? "Arabic" : "French"}</span>
          </span>
        }
      />
      <Flash ok={query.ok} err={query.err} />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={String(real.length)} />
        <Stat label="Revenue" value={mad(revenue)} />
        <Stat label="Average order" value={real.length ? mad(revenue / real.length) : "—"} />
        <Stat label="Gross margin" value={mad(margin)} tone={margin >= 0 ? "green" : "red"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Orders" padded={false}>
            {orders.length === 0 ? (
              <div className="p-5">
                <Empty title="No orders yet" />
              </div>
            ) : (
              <Table head={["Order", "Date", "Status", "Total"]}>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={order.status === "draft" ? `/admin/drafts/${order.id}` : `/admin/orders/${order.id}`} className="font-medium hover:text-adm-accent">
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-adm-muted">{dateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={orderStatusMeta[order.status].tone}>{orderStatusMeta[order.status].label}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums">{mad(order.total)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Write an e-mail">
            {!customer.email ? (
              <Notice tone="amber">No e-mail address. Add one below, or call {customer.phone ?? "the customer"}.</Notice>
            ) : (
              <form action={emailCustomerAction} className="space-y-3">
                <input type="hidden" name="id" value={customer.id} />
                <Field label="Subject">
                  <input name="subject" required className="admin-input" dir="auto" />
                </Field>
                <Field label={`Message — greeting and sign-off are added in ${customer.locale === "ar" ? "Arabic" : "French"}; replies come back to your contact address`}>
                  <textarea name="message" required className="admin-input min-h-36" dir={customer.locale === "ar" ? "rtl" : "ltr"} />
                </Field>
                <SubmitButton variant="secondary" pendingLabel="Sending…">
                  <Mail className="size-4" aria-hidden="true" /> Send
                </SubmitButton>
              </form>
            )}
          </Card>

          <Card title="E-mail history" padded={false}>
            {emails.length === 0 ? (
              <div className="p-5">
                <Empty title="No e-mails yet" />
              </div>
            ) : (
              <ul className="divide-y divide-adm-line text-sm">
                {emails.map((email) => (
                  <li key={email.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <Link href={`/admin/emails/${email.id}`} className="min-w-0 truncate hover:text-adm-accent">
                      {email.subject}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-adm-muted">
                      <StatusBadge tone={email.status === "sent" ? "green" : email.status === "failed" ? "red" : "gray"}>{email.status}</StatusBadge>
                      {dateTime(email.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title="CRM">
          <form action={saveCustomerAction} className="space-y-3">
            <input type="hidden" name="id" value={customer.id} />
            <Field label="Name">
              <input name="name" defaultValue={customer.name} className="admin-input" />
            </Field>
            <Field label="Company">
              <input name="company" defaultValue={customer.company ?? ""} className="admin-input" />
            </Field>
            <Field label="E-mail">
              <input value={customer.email ?? ""} readOnly className="admin-input opacity-60" aria-readonly="true" />
            </Field>
            <Field label="Phone">
              <input name="phone" defaultValue={customer.phone ?? ""} className="admin-input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input name="city" defaultValue={customer.city ?? ""} className="admin-input" />
              </Field>
              <Field label="Language">
                <select name="locale" defaultValue={customer.locale} className="admin-input">
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                </select>
              </Field>
            </div>
            <Field label="Address">
              <input name="address" defaultValue={customer.address ?? ""} className="admin-input" />
            </Field>
            <Field label="Stage">
              <select name="stage" defaultValue={customer.stage} className="admin-input">
                {customerStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stageMeta[stage].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tags" hint="Comma separated, e.g. pâtisserie, gros volume">
              <input name="tags" defaultValue={customer.tags.join(", ")} className="admin-input" />
            </Field>
            <Field label="Notes">
              <textarea name="notes" defaultValue={customer.notes ?? ""} className="admin-input min-h-28" />
            </Field>
            <SubmitButton variant="secondary" pendingLabel="Saving…">
              Save customer
            </SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
