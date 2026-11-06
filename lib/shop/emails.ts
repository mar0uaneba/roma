import "server-only";
import { Resend } from "resend";
import type { Locale } from "@/lib/i18n/config";
import { isResendConfigured } from "@/lib/supabase/env";
import { formatMoney } from "@/lib/shop/money";
import { logEmail } from "@/lib/shop/repo";
import type { Order } from "@/lib/shop/types";
import { site } from "@/lib/site";

/* Customer e-mails go out in the customer's language (French or Arabic). */

const copy = {
  fr: {
    hello: (name: string) => `Bonjour ${name || ""},`.replace(" ,", ","),
    signoff: "Cordialement,\nL'équipe Roma Pack",
    order: "Commande",
    qty: "Qté",
    subtotal: "Sous-total",
    shipping: "Livraison",
    shippingTbd: "À confirmer",
    discount: "Remise",
    total: "Total",
    cod: "Paiement à la livraison",
    receivedSubject: (n: string) => `Nous avons bien reçu votre commande ${n}`,
    receivedBody: "Merci pour votre commande. Nous vous appelons pour la confirmer, puis nous préparons l'envoi. Vous payez à la livraison.",
    offerSubject: (n: string, total: string) => `Votre offre Roma Pack ${n} · ${total}`,
    offerBody: "Voici l'offre préparée pour vous. Confirmez-la en un clic : le paiement se fait à la livraison.",
    offerButton: (total: string) => `Confirmer la commande · ${total}`,
    offerValid: (date: string) => `Offre valable jusqu'au ${date}.`,
    shippedSubject: (n: string) => `Votre commande ${n} est expédiée`,
    shippedBody: (carrier: string) => `Votre commande a été remise à ${carrier}.`,
    tracking: "Numéro de suivi",
    slotSubject: (n: string) => `Votre créneau de livraison · ${n}`,
    slotBody: (slot: string) => `Votre commande sera livrée : ${slot}.`,
    cancelSubject: (n: string) => `Annulation de votre commande ${n}`,
    cancelBody: "Votre commande a été annulée.",
    reason: "Motif",
    confirmedSubject: (n: string) => `Commande ${n} confirmée`,
    confirmedBody: "Votre commande est confirmée. Nous la préparons et vous informons de l'expédition.",
    questions: "Une question ? Répondez simplement à cet e-mail.",
  },
  ar: {
    hello: (name: string) => `مرحباً ${name || ""}،`,
    signoff: "مع خالص التحية،\nفريق روما باك",
    order: "الطلب",
    qty: "الكمية",
    subtotal: "المجموع الفرعي",
    shipping: "التوصيل",
    shippingTbd: "سيُحدَّد",
    discount: "الخصم",
    total: "المجموع",
    cod: "الدفع عند الاستلام",
    receivedSubject: (n: string) => `توصلنا بطلبكم ${n}`,
    receivedBody: "شكراً على طلبكم. سنتصل بكم لتأكيده ثم نُحضّر الإرسال. الدفع يتم عند الاستلام.",
    offerSubject: (n: string, total: string) => `عرض روما باك ${n} · ${total}`,
    offerBody: "هذا هو العرض الذي أعددناه لكم. أكّدوه بنقرة واحدة، والدفع عند الاستلام.",
    offerButton: (total: string) => `تأكيد الطلب · ${total}`,
    offerValid: (date: string) => `العرض صالح إلى غاية ${date}.`,
    shippedSubject: (n: string) => `تم شحن طلبكم ${n}`,
    shippedBody: (carrier: string) => `تم تسليم طلبكم إلى ${carrier}.`,
    tracking: "رقم التتبع",
    slotSubject: (n: string) => `موعد التسليم · ${n}`,
    slotBody: (slot: string) => `سيتم تسليم طلبكم: ${slot}.`,
    cancelSubject: (n: string) => `إلغاء طلبكم ${n}`,
    cancelBody: "تم إلغاء طلبكم.",
    reason: "السبب",
    confirmedSubject: (n: string) => `تم تأكيد الطلب ${n}`,
    confirmedBody: "تم تأكيد طلبكم. نحن نُحضّره وسنخبركم عند الشحن.",
    questions: "لديكم سؤال؟ يكفي الرد على هذه الرسالة.",
  },
} as const;

const esc = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const para = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px;line-height:1.6">${esc(block).replace(/\n/g, "<br>")}</p>`)
    .join("");

function layout(locale: Locale, inner: string) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const font = locale === "ar" ? "Tahoma,Arial,sans-serif" : "Helvetica,Arial,sans-serif";
  return `<!doctype html><html lang="${locale}" dir="${dir}"><body style="margin:0;background:#f4efe6;padding:24px 12px;font-family:${font};color:#161411">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fbf7f1;border:1px solid #ddd4c6">
<tr><td style="background:#0e0d0c;padding:20px 28px;color:#f4efe6;font-family:Georgia,serif;font-size:20px;letter-spacing:3px" dir="ltr">ROMA <span style="color:#c5161d">PACK</span></td></tr>
<tr><td style="padding:28px" dir="${dir}">${inner}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #ddd4c6;color:#6d645b;font-size:12px" dir="ltr">${esc(site.legalName)} · ICE ${site.ice} · Rabat${site.phone ? ` · ${esc(site.phone)}` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: Order, locale: Locale) {
  const t = copy[locale];
  const align = locale === "ar" ? "left" : "right";
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #ddd4c6">${esc(item.name)}${item.unit ? `<br><span style="color:#6d645b;font-size:12px">${esc(item.unit)}</span>` : ""}</td><td style="padding:8px;border-bottom:1px solid #ddd4c6;text-align:center" dir="ltr">${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #ddd4c6;text-align:${align}" dir="ltr">${formatMoney(item.lineTotal, locale)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, strong = false) =>
    `<tr><td colspan="2" style="padding:6px 0;${strong ? "font-weight:bold" : "color:#6d645b"}">${label}</td><td style="padding:6px 0;text-align:${align};${strong ? "font-weight:bold" : ""}" dir="ltr">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0 18px">
<tr><th style="text-align:inherit;padding-bottom:6px;color:#6d645b;font-weight:normal">${t.order} ${esc(order.number)}</th><th style="padding-bottom:6px;color:#6d645b;font-weight:normal">${t.qty}</th><th></th></tr>
${rows}
${line(t.subtotal, formatMoney(order.subtotal, locale))}
${line(t.shipping, order.shipping > 0 || order.status !== "pending" ? formatMoney(order.shipping, locale) : t.shippingTbd)}
${order.discount > 0 ? line(t.discount, `− ${formatMoney(order.discount, locale)}`) : ""}
${line(t.total, formatMoney(order.total, locale), true)}
${line(t.cod, "")}
</table>`;
}

function button(href: string, label: string) {
  return `<p style="margin:22px 0"><a href="${esc(href)}" style="display:inline-block;background:#c5161d;color:#fff8f4;text-decoration:none;padding:14px 22px;font-weight:bold">${esc(label)}</a></p>`;
}

export type CustomerEmail = { subject: string; html: string; kind: string };

export function orderReceivedEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "order_received",
    subject: t.receivedSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.receivedBody) + itemsTable(order, order.locale) + para(t.questions) + para(t.signoff)),
  };
}

export function orderConfirmedEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "confirmed",
    subject: t.confirmedSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.confirmedBody) + itemsTable(order, order.locale) + para(t.signoff)),
  };
}

export function offerEmail(order: Order, link: string): CustomerEmail {
  const t = copy[order.locale];
  const total = formatMoney(order.total, order.locale);
  const until = order.offerExpiresAt
    ? new Date(order.offerExpiresAt).toLocaleDateString(order.locale === "ar" ? "ar-MA-u-nu-latn" : "fr-MA", { day: "numeric", month: "long" })
    : null;
  return {
    kind: "offer",
    subject: t.offerSubject(order.number, total),
    html: layout(
      order.locale,
      para(t.hello(order.customerName)) +
        para(t.offerBody) +
        itemsTable(order, order.locale) +
        button(link, t.offerButton(total)) +
        (until ? para(t.offerValid(until)) : "") +
        para(t.questions) +
        para(t.signoff),
    ),
  };
}

export function shippedEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  const tracking = order.trackingNumber ? `<p style="margin:0 0 14px">${t.tracking} : <strong dir="ltr">${esc(order.trackingNumber)}</strong></p>` : "";
  return {
    kind: "shipped",
    subject: t.shippedSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.shippedBody(order.carrier ?? "transporteur")) + tracking + para(t.signoff)),
  };
}

export function deliverySlotEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "delivery_slot",
    subject: t.slotSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.slotBody(order.deliverySlot ?? "")) + para(t.questions) + para(t.signoff)),
  };
}

export function cancelledEmail(order: Order, reason: string | null): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "cancelled",
    subject: t.cancelSubject(order.number),
    html: layout(
      order.locale,
      para(t.hello(order.customerName)) + para(t.cancelBody) + (reason ? para(`${t.reason} : ${reason}`) : "") + para(t.questions) + para(t.signoff),
    ),
  };
}

/** Free message written in the admin. Greeting and sign-off are added in the customer's language. */
export function messageEmail(locale: Locale, name: string, subject: string, message: string): CustomerEmail {
  const t = copy[locale];
  return { kind: "message", subject, html: layout(locale, para(t.hello(name)) + para(message) + para(t.signoff)) };
}

export type SendResult = { state: "sent" | "skipped" | "failed"; detail?: string };

/** Sends (when Resend is configured) and always records the e-mail in the log. */
export async function sendCustomerEmail(
  to: string | null,
  email: CustomerEmail,
  refs: { customerId: string | null; orderId: string | null },
): Promise<SendResult> {
  if (!to) return { state: "skipped", detail: "No e-mail address" };
  let result: SendResult;
  if (!isResendConfigured()) {
    result = { state: "skipped", detail: "Resend is not configured" };
  } else {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to,
        replyTo: process.env.REPLY_TO_EMAIL || process.env.QUOTE_NOTIFY_EMAIL || undefined,
        subject: email.subject,
        html: email.html,
      });
      result = error ? { state: "failed", detail: error.message } : { state: "sent" };
    } catch (error) {
      result = { state: "failed", detail: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  await logEmail({
    customerId: refs.customerId,
    orderId: refs.orderId,
    toEmail: to,
    subject: email.subject,
    html: email.html,
    kind: email.kind,
    status: result.state,
    error: result.detail ?? null,
  });
  return result;
}

/** Internal notification to the team when an order arrives from the shop. */
export async function notifyTeam(subject: string, text: string) {
  if (!isResendConfigured()) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL!, to: process.env.QUOTE_NOTIFY_EMAIL!, subject, text });
  } catch {
    // The order is already stored; a failed notification must not block the customer.
  }
}
