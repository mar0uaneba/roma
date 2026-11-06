import { isAdmin } from "@/lib/admin/auth";
import { dateTime, orderStatusMeta, paymentMeta, toCsv } from "@/lib/admin/format";
import { listOrders, orderTabs, type OrderTab } from "@/lib/shop/repo";

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const tab = orderTabs.includes(url.searchParams.get("tab") as OrderTab) ? (url.searchParams.get("tab") as OrderTab) : "all";
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);
  const orders = await listOrders({ tab, q });

  const rows: unknown[][] = [
    ["Number", "Date", "Status", "Payment", "Customer", "Company", "Phone", "E-mail", "City", "Address", "Items", "Subtotal", "Shipping", "Discount", "Total", "Cost", "Carrier", "Tracking"],
    ...orders.map((order) => [
      order.number,
      dateTime(order.createdAt),
      orderStatusMeta[order.status].label,
      paymentMeta[order.paymentStatus].label,
      order.customerName,
      order.customerCompany,
      order.customerPhone,
      order.customerEmail,
      order.customerCity,
      order.customerAddress,
      order.items.map((item) => `${item.quantity} × ${item.name}`).join(" | "),
      order.subtotal.toFixed(2),
      order.shipping.toFixed(2),
      order.discount.toFixed(2),
      order.total.toFixed(2),
      order.costTotal.toFixed(2),
      order.carrier,
      order.trackingNumber,
    ]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="roma-pack-orders-${tab}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
