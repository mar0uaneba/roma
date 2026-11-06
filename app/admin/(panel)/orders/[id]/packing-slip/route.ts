import { isAdmin } from "@/lib/admin/auth";
import { dateTime, toCsv } from "@/lib/admin/format";
import { getOrder } from "@/lib/shop/repo";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const found = await getOrder(id);
  if (!found) return new Response("Not found", { status: 404 });
  const { order } = found;

  const rows: unknown[][] = [
    ["Packing slip", order.number],
    ["Date", dateTime(order.createdAt)],
    ["Customer", order.customerName],
    ["Company", order.customerCompany],
    ["Phone", order.customerPhone],
    ["City", order.customerCity],
    ["Address", order.customerAddress],
    ["Delivery slot", order.deliverySlot],
    ["Supplier ref.", order.supplierRef],
    [],
    ["Qty", "Product", "Unit", "Packed"],
    ...order.items.map((item) => [item.quantity, item.name, item.unit, ""]),
    [],
    ["Cash to collect", order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? order.total.toFixed(2) + " MAD" : "0"],
    ["Note", order.deliveryNote],
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="packing-slip-${order.number}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
