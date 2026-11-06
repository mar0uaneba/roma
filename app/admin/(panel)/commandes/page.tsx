import { connection } from "next/server";
import { Suspense } from "react";
import { OrderBoard } from "@/components/admin/order-board";
import { listOrders } from "@/lib/orders";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement des commandes…</p>}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  await connection();
  const { orders, source } = await listOrders();
  return <OrderBoard orders={orders} local={source === "local"} />;
}
