import { Search } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { Card, Empty, Flash, Loading, PageHeader, StatusBadge, Table, Tabs, buttonClass } from "@/components/admin/ui";
import { dateOnly, mad, stageMeta } from "@/lib/admin/format";
import { listCustomers } from "@/lib/shop/repo";
import { customerStages, type CustomerStage } from "@/lib/shop/types";

export const metadata = { title: "Customers" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}

async function Customers({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const stage = customerStages.includes(params.stage as CustomerStage) ? (params.stage as CustomerStage) : undefined;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const [customers, all] = await Promise.all([listCustomers({ stage, q }), listCustomers()]);

  return (
    <>
      <PageHeader title="Customers & CRM" description="Every customer who ordered, asked for an offer, or was added from a draft." />
      <Flash ok={params.ok} err={params.err} />
      <Tabs
        active={stage ?? "all"}
        items={[
          { key: "all", label: "All", href: "/admin/customers", count: all.length },
          ...customerStages.map((key) => ({
            key,
            label: stageMeta[key].label,
            href: `/admin/customers?stage=${key}`,
            count: all.filter((customer) => customer.stage === key).length,
          })),
        ]}
      />
      <form className="mb-4 flex max-w-md gap-2" action="/admin/customers">
        {stage ? <input type="hidden" name="stage" value={stage} /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-adm-muted" aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Name, company, phone, e-mail…" className="admin-input pl-9" />
        </div>
        <button type="submit" className={buttonClass("secondary")}>
          Search
        </button>
      </form>
      <Card padded={false}>
        {customers.length === 0 ? (
          <div className="p-5">
            <Empty title="No customers here" />
          </div>
        ) : (
          <Table head={["Customer", "Contact", "City", "Stage", "Orders", "Revenue", "Last order"]} minWidth="56rem">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${customer.id}`} className="font-medium hover:text-adm-accent">
                    {customer.name || customer.email || customer.phone}
                  </Link>
                  {customer.company ? <span className="block text-xs text-adm-muted">{customer.company}</span> : null}
                </td>
                <td className="px-4 py-3 text-xs text-adm-muted">
                  {customer.email ?? "—"}
                  <span className="block">{customer.phone ?? ""}</span>
                </td>
                <td className="px-4 py-3 text-adm-muted">{customer.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={stageMeta[customer.stage].tone}>{stageMeta[customer.stage].label}</StatusBadge>
                  {customer.tags.map((tag) => (
                    <span key={tag} className="ms-1 text-[11px] text-adm-muted">
                      #{tag}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 tabular-nums">{customer.orders}</td>
                <td className="px-4 py-3 tabular-nums">{mad(customer.revenue)}</td>
                <td className="px-4 py-3 text-adm-muted">{dateOnly(customer.lastOrderAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
