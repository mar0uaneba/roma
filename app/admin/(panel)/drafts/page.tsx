import { Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { Card, Empty, Flash, Loading, PageHeader, StatusBadge, Table, buttonClass } from "@/components/admin/ui";
import { dateTime, mad } from "@/lib/admin/format";
import { listOrders } from "@/lib/shop/repo";

export const metadata = { title: "Drafts" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <Drafts searchParams={searchParams} />
    </Suspense>
  );
}

async function Drafts({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const [params, drafts] = await Promise.all([searchParams, listOrders({ drafts: true })]);

  return (
    <>
      <PageHeader
        title="Drafts"
        description="Orders prepared for phone, WhatsApp or e-mail customers. Send an offer link; the customer confirms and pays on delivery."
        actions={
          <Link href="/admin/drafts/new" className={buttonClass("primary")}>
            <Plus className="size-4" aria-hidden="true" /> New draft
          </Link>
        }
      />
      <Flash ok={params.ok} err={params.err} />
      <Card padded={false}>
        {drafts.length === 0 ? (
          <div className="p-5">
            <Empty title="No drafts">Create one for a customer who ordered by phone or from a quote request.</Empty>
          </div>
        ) : (
          <Table head={["Draft", "Customer", "Created", "Offer", "Total"]}>
            {drafts.map((draft) => {
              const expired = draft.offerExpiresAt ? Date.parse(draft.offerExpiresAt) < Date.now() : false;
              return (
                <tr key={draft.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/drafts/${draft.id}`} className="font-medium hover:text-adm-accent">
                      {draft.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {draft.customerName}
                    <span className="block text-xs text-adm-muted">{draft.customerEmail ?? draft.customerPhone}</span>
                  </td>
                  <td className="px-4 py-3 text-adm-muted">{dateTime(draft.createdAt)}</td>
                  <td className="px-4 py-3">
                    {draft.offerSentAt ? (
                      <StatusBadge tone={expired ? "red" : "blue"}>{expired ? "Link expired" : `Sent ${dateTime(draft.offerSentAt)}`}</StatusBadge>
                    ) : (
                      <StatusBadge tone="gray">Not sent</StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end font-medium tabular-nums">{mad(draft.total)}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
