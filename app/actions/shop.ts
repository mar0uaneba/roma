"use server";

import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { notifyTeam, orderConfirmedEmail, sendCustomerEmail } from "@/lib/shop/emails";
import { addEvent, getOrderByToken, updateOrder } from "@/lib/shop/repo";

/** The customer accepts an offer sent from the admin. Public: the unguessable token is the authorization. */
export async function acceptOfferAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const lang = String(form.get("lang") ?? "fr");
  const locale = isLocale(lang) ? lang : "fr";
  const order = await getOrderByToken(token);
  if (!order || order.status !== "draft") redirect(`/${locale}/offre/${encodeURIComponent(token)}`);
  if (order.offerExpiresAt && Date.parse(order.offerExpiresAt) < Date.now()) redirect(`/${locale}/offre/${encodeURIComponent(token)}`);

  await updateOrder(order.id, { status: "confirmed", source: "offer", confirmed_at: new Date().toISOString() });
  await addEvent(order.id, "status", "Offer accepted by the customer online");
  const confirmed = { ...order, status: "confirmed" as const };
  await sendCustomerEmail(order.customerEmail, orderConfirmedEmail(confirmed), { customerId: order.customerId, orderId: order.id });
  await notifyTeam(`Offre acceptée ${order.number}`, `${order.customerName} a confirmé l'offre ${order.number}. À expédier.`);
  redirect(`/${locale}/commande/merci?n=${encodeURIComponent(order.number)}`);
}
