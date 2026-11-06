import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { Card, Empty, Loading, Notice, PageHeader, Stat, StatusBadge, Table } from "@/components/admin/ui";
import { dateTime, mad, orderStatusMeta } from "@/lib/admin/format";
import { listOrders } from "@/lib/shop/repo";

export const metadata = { title: "Payments" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Payments />
    </Suspense>
  );
}

async function Payments() {
  await connection();
  await requireAdmin();
  const orders = await listOrders({ tab: "all" });
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const toCollect = orders.filter((order) => order.paymentStatus === "unpaid" && ["confirmed", "shipped"].includes(order.status));
  const overdue = orders.filter((order) => order.paymentStatus === "unpaid" && order.status === "delivered");
  const paidThisMonth = orders.filter((order) => order.paidAt && Date.parse(order.paidAt) >= monthStart.getTime());
  const refunds = orders.filter((order) => order.refundedAmount > 0);
  const sum = (list: typeof orders) => list.reduce((total, order) => total + order.total - order.refundedAmount, 0);

  const rows = [...overdue, ...toCollect];

  return (
    <>
      <PageHeader title="Payments" description="Cash on delivery and bank transfers. Card payments are not used: Stripe does not serve businesses registered in Morocco." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Cash to collect" value={mad(sum(toCollect))} hint={`${toCollect.length} order(s) confirmed or on the way`} />
        <Stat label="Delivered, not marked paid" value={mad(sum(overdue))} hint={`${overdue.length} order(s) to check with the carrier`} tone={overdue.length ? "red" : "default"} />
        <Stat label="Received this month" value={mad(sum(paidThisMonth))} tone="green" />
        <Stat label="Refunded (all time)" value={mad(refunds.reduce((total, order) => total + order.refundedAmount, 0))} />
      </div>
      {overdue.length ? (
        <div className="mb-4">
          <Notice tone="amber" title="Check these with the carrier">
            Delivered orders without a recorded payment usually mean the carrier still holds the cash.
          </Notice>
        </div>
      ) : null}
      <Card title="Open payments" padded={false}>
        {rows.length === 0 ? (
          <div className="p-5">
            <Empty title="Nothing to collect" />
          </div>
        ) : (
          <Table head={["Order", "Customer", "Status", "Carrier", "Since", "Amount"]}>
            {rows.map((order) => (
              <tr key={order.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-adm-accent">
                    {order.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={orderStatusMeta[order.status].tone}>{orderStatusMeta[order.status].label}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-adm-muted">{order.carrier ?? "—"}</td>
                <td className="px-4 py-3 text-adm-muted">{dateTime(order.deliveredAt ?? order.shippedAt ?? order.confirmedAt)}</td>
                <td className="px-4 py-3 text-end font-medium tabular-nums">{mad(order.total)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <p className="mt-4 text-sm text-adm-muted">
        Online card payments (CMI) can be added once your bank gives you a CMI merchant account.
      </p>
    </>
  );
}
