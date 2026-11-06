import { CheckCircle2, Circle, Rocket } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { publishSiteAction } from "@/app/actions/admin";
import { AutoRefresh, SubmitButton } from "@/components/admin/client";
import { AreaChart, BarList, Card, Empty, Flash, Loading, PageHeader, Stat, StatusBadge, Table } from "@/components/admin/ui";
import { dateTime, dayKey, mad, orderStatusMeta, percentChange } from "@/lib/admin/format";
import { isAdminPasswordSet } from "@/lib/admin/session";
import { isDbConfigured } from "@/lib/db";
import { getSettings, ordersSince } from "@/lib/shop/repo";
import type { Order } from "@/lib/shop/types";
import { site } from "@/lib/site";
import { isResendConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Overview" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

const counted = (order: Order) => !["cancelled", "refunded", "draft"].includes(order.status);

async function Overview({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const [params, settings] = await Promise.all([searchParams, getSettings()]);
  const now = Date.now();
  const DAY = 86_400_000;
  const orders = await ordersSince(new Date(now - 60 * DAY).toISOString());

  const current = orders.filter((order) => Date.parse(order.createdAt) >= now - 30 * DAY);
  const previous = orders.filter((order) => Date.parse(order.createdAt) < now - 30 * DAY);
  const revenue = (list: Order[]) => list.filter(counted).reduce((sum, order) => sum + order.total, 0);
  const cost = (list: Order[]) => list.filter(counted).reduce((sum, order) => sum + order.costTotal, 0);

  const days = Array.from({ length: 30 }, (_, index) => dayKey(new Date(now - (29 - index) * DAY).toISOString()));
  const byDay = new Map(days.map((day) => [day, 0]));
  const ordersByDay = new Map(days.map((day) => [day, 0]));
  for (const order of current.filter(counted)) {
    const key = dayKey(order.createdAt);
    byDay.set(key, (byDay.get(key) ?? 0) + order.total);
    ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
  }
  const revenueSeries = days.map((day) => byDay.get(day) ?? 0);
  const orderSeries = days.map((day) => ordersByDay.get(day) ?? 0);

  const revenueNow = revenue(current);
  const costNow = cost(current);
  const margin = revenueNow - costNow;
  const marginRate = revenueNow > 0 ? (margin / revenueNow) * 100 : 0;
  const open = orders.filter((order) => order.status === "pending" || order.status === "confirmed").length;

  const products = new Map<string, { name: string; quantity: number; revenue: number; profit: number; slug: string | null }>();
  for (const order of current.filter(counted)) {
    for (const item of order.items) {
      const key = item.productSlug ?? item.name;
      const entry = products.get(key) ?? { name: item.name, quantity: 0, revenue: 0, profit: 0, slug: item.productSlug };
      entry.quantity += item.quantity;
      entry.revenue += item.lineTotal;
      entry.profit += item.quantity * (item.unitPrice - item.unitCost);
      products.set(key, entry);
    }
  }
  const bestsellers = [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const profitable = [...products.values()].sort((a, b) => b.profit - a.profit).slice(0, 5);
  const latest = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  const checklist: [string, boolean, string][] = [
    ["Admin password", isAdminPasswordSet(), "ADMIN_PASSWORD in Vercel"],
    ["Database connected", isDbConfigured(), "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, then run supabase/setup.sql"],
    ["E-mails (Resend)", isResendConfigured(), "RESEND_API_KEY, RESEND_FROM_EMAIL, QUOTE_NOTIFY_EMAIL"],
    ["Deploy hook", Boolean(process.env.VERCEL_DEPLOY_HOOK_URL), "VERCEL_DEPLOY_HOOK_URL (Vercel → Settings → Git → Deploy Hooks)"],
    ["Legal notice complete", Boolean(site.phone && site.email && site.address), "NEXT_PUBLIC_PHONE, NEXT_PUBLIC_CONTACT_EMAIL, NEXT_PUBLIC_ADDRESS"],
    ["WhatsApp number", Boolean(site.whatsapp), "NEXT_PUBLIC_WHATSAPP_NUMBER"],
    ["Shipping fee set", settings.shippingFee !== null, "Settings → Shop"],
    ["Demo mode off", isDbConfigured(), "Turns off automatically once the database is connected"],
  ];
  const done = checklist.filter(([, ok]) => ok).length;

  return (
    <>
      <AutoRefresh seconds={60} />
      <PageHeader
        title="Overview"
        description="Last 30 days, compared with the 30 days before. Times are Morocco time."
        actions={
          <form action={publishSiteAction}>
            <SubmitButton variant="primary" pendingLabel="Publishing…">
              <Rocket className="size-4" aria-hidden="true" />
              Publish
            </SubmitButton>
          </form>
        }
      />
      <Flash ok={params.ok} err={params.err} />

      {done < checklist.length ? (
        <Card title={`Setup checklist · ${done}/${checklist.length}`} className="mb-6">
          <ul className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
            {checklist.map(([label, ok, hint]) => (
              <li key={label} className="flex gap-3 text-sm">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-adm-green" aria-hidden="true" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-adm-muted" aria-hidden="true" />
                )}
                <span>
                  <span className={ok ? "text-adm-muted line-through decoration-adm-muted/40" : ""}>{label}</span>
                  {!ok ? <span className="block text-xs text-adm-muted">{hint}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue" value={mad(revenueNow)} delta={percentChange(revenueNow, revenue(previous))} series={revenueSeries} />
        <Stat
          label="Orders"
          value={String(current.filter(counted).length)}
          delta={percentChange(current.filter(counted).length, previous.filter(counted).length)}
          series={orderSeries}
        />
        <Stat label="Open orders" value={String(open)} hint="To confirm or to ship" />
        <Stat label="Visitors" value="—" hint="Visitor tracking arrives in phase 2" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Gross margin" value={mad(margin)} hint={`${marginRate.toFixed(1)} % of revenue`} tone={margin >= 0 ? "green" : "red"} />
        <Stat label="Purchase cost" value={mad(costNow)} hint="From purchase prices on products" />
        <Stat label="Profit after ads" value={mad(margin)} hint="Ad spend is added with Google Ads (phase 3)" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Revenue, last 30 days" className="xl:col-span-2">
          <AreaChart data={days.map((day, index) => ({ label: day.slice(5), value: revenueSeries[index] ?? 0 }))} format={mad} />
        </Card>
        <Card title="Visitors map">
          <Empty title="Morocco map — phase 2">Live visitors by city, counted without cookies.</Empty>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Latest orders" className="xl:col-span-2" padded={false} action={<Link href="/admin/orders" className="text-xs text-adm-accent">All orders →</Link>}>
          {latest.length === 0 ? (
            <div className="p-5">
              <Empty title="No orders yet" />
            </div>
          ) : (
            <Table head={["Order", "Customer", "Date", "Status", "Total"]}>
              {latest.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-adm-text hover:text-adm-accent">
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {order.customerName}
                    <span className="block text-xs text-adm-muted">{order.customerCity}</span>
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
        <div className="space-y-6">
          <Card title="Bestsellers">
            <BarList
              items={bestsellers.map((item) => ({
                label: item.name,
                value: item.quantity,
                href: item.slug ? `/admin/products/${item.slug}` : undefined,
              }))}
              format={(value) => `${value} pcs`}
            />
          </Card>
          <Card title="Most profitable">
            <BarList items={profitable.map((item) => ({ label: item.name, value: Math.max(item.profit, 0) }))} format={mad} />
          </Card>
        </div>
      </div>
    </>
  );
}
