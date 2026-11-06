import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { Card, KeyValue, Loading, PageHeader, StatusBadge } from "@/components/admin/ui";
import { dateTime } from "@/lib/admin/format";
import { getEmail } from "@/lib/shop/repo";

export const metadata = { title: "E-mail" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <EmailPreview params={params} />
    </Suspense>
  );
}

async function EmailPreview({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireAdmin();
  const { id } = await params;
  const email = await getEmail(id);
  if (!email) notFound();
  const back = email.customerId ? `/admin/customers/${email.customerId}` : email.orderId ? `/admin/orders/${email.orderId}` : "/admin";

  return (
    <>
      <Link href={back} className="mb-4 inline-flex items-center gap-1 text-sm text-adm-muted hover:text-adm-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Link>
      <PageHeader title={email.subject} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Preview" className="xl:col-span-2" padded={false}>
          {/* Stored HTML is rendered in a sandbox: no scripts, no same-origin access. */}
          <iframe title="E-mail preview" sandbox="" srcDoc={email.html} className="h-[70vh] w-full rounded-b-xl bg-white" />
        </Card>
        <Card title="Details">
          <KeyValue
            items={[
              ["To", email.toEmail],
              ["Sent", dateTime(email.createdAt)],
              ["Type", email.kind],
              ["Status", <StatusBadge key="s" tone={email.status === "sent" ? "green" : email.status === "failed" ? "red" : "gray"}>{email.status}</StatusBadge>],
              ...(email.error ? ([["Detail", email.error]] as [string, string][]) : []),
            ]}
          />
        </Card>
      </div>
    </>
  );
}
