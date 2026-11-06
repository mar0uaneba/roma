import { Card, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Google Ads & Merchant" };

export default function Page() {
  return (
    <>
      <PageHeader title="Google Ads & Merchant" description="Coming in phase 3." />
      <Card>
        <ul className="list-inside list-disc space-y-2 text-sm text-adm-muted">
          <li>Google Merchant Center product feed built from active, priced products (exclusions set per product).</li>
          <li>Ad spend imported to compute profit after ads on the Overview.</li>
          <li>Abandoned checkout reminders by e-mail.</li>
        </ul>
      </Card>
    </>
  );
}
