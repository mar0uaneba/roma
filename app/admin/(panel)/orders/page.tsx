import { Download, Plus, Search } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { AutoRefresh } from "@/components/admin/client";
import { Card, Empty, Flash, Loading, PageHeader, StatusBadge, Table, Tabs, buttonClass } from "@/components/admin/ui";
import { dateTime, mad, orderStatusMeta, paymentMeta, paymentMethodLabel } from "@/lib/admin/format";
import { listOrders, orderTabs, type OrderTab } from "@/lib/shop/repo";

export const metadata = { title: "Orders" };

type Search = Promise<Record<string, string | string[] | undefined>>;

const tabLabels: Record<OrderTab, string> = {
  all: "All",
  to_ship: "To ship",
  pending: "To confirm",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const tab = orderTabs.includes(params.tab as OrderTab) ? (params.tab as OrderTab) : "all";
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const [orders, all] = await Promise.all([listOrders({ tab, q }), listOrders({ tab: "all" })]);
  const count = (status: string) => all.filter((order) => order.status === status).length;
  const query = (next: string) => `/admin/orders?tab=${next}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <AutoRefresh seconds={45} />
      <PageHeader
        title="Orders"
        description="Shop orders are paid on delivery. Confirm by phone, ship, then mark delivered and paid."
        actions={
          <>
            <a href={`/admin/orders/export?tab=${tab}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={buttonClass("secondary")}>
              <Download className="size-4" aria-hidden="true" />
              CSV
            </a>
            <Link href="/admin/drafts/new" className={buttonClass("primary")}>
              <Plus className="size-4" aria-hidden="true" />
              Create order
            </Link>
          </>
        }
      />
      <Flash ok={params.ok} err={params.err} />
      <Tabs
        active={tab}
        items={orderTabs.map((key) => ({
          key,
          label: tabLabels[key],
          href: query(key),
          count: key === "pending" ? count("pending") : key === "to_ship" ? count("confirmed") : undefined,
        }))}
      />
      <form className="mb-4 flex max-w-md items-center gap-2" action="/admin/orders">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-adm-muted" aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Number, name, phone, city…" className="admin-input pl-9" />
        </div>
        <button className={buttonClass("secondary")} type="submit">
          Search
        </button>
      </form>
      <Card padded={false}>
        {orders.length === 0 ? (
          <div className="p-5">
            <Empty title={q ? "No order matches this search" : "No orders here yet"} />
          </div>
        ) : (
          <Table head={["Order", "Customer", "Items", "Date", "Status", "Payment", "Total"]} minWidth="56rem">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-adm-accent">
                    {order.number}
                  </Link>
                  {order.locale === "ar" ? <span className="ms-2 text-[10px] text-adm-muted">AR</span> : null}
                </td>
                <td className="px-4 py-3">
                  {order.customerName}
                  <span className="block text-xs text-adm-muted">
                    {[order.customerCompany, order.customerCity].filter(Boolean).join(" · ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-adm-muted">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="px-4 py-3 text-adm-muted">{dateTime(order.createdAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={orderStatusMeta[order.status].tone}>{orderStatusMeta[order.status].label}</StatusBadge>
                  {order.damageFlag ? <StatusBadge tone="red">Damage</StatusBadge> : null}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={paymentMeta[order.paymentStatus].tone}>{paymentMeta[order.paymentStatus].label}</StatusBadge>
                  <span className="mt-1 block text-[11px] text-adm-muted">{paymentMethodLabel(order)}</span>
                </td>
                <td className="px-4 py-3 text-end font-medium tabular-nums">{mad(order.total)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-adm-muted">
        Abandoned checkouts (e-mail entered, no order) arrive in phase 3 with automatic reminders.
      </p>
    </>
  );
}
