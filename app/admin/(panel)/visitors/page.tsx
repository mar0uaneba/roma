import { Card, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Visitors" };

export default function Page() {
  return (
    <>
      <PageHeader title="Visitors & Map" description="Coming in phase 2." />
      <Card>
        <ul className="list-inside list-disc space-y-2 text-sm text-adm-muted">
          <li>Visitors counted without cookies and without storing IP addresses.</li>
          <li>Live Morocco map by region and city, with visitors on the site right now.</li>
          <li>Top pages, sources, devices, and the path each visitor took before ordering.</li>
          <li>Block abusive visitors (only a one-way hash of the IP is kept).</li>
        </ul>
      </Card>
    </>
  );
}
