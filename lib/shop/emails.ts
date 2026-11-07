import "server-only";
import { Resend } from "resend";
import type { Locale } from "@/lib/i18n/config";
import { isResendConfigured } from "@/lib/supabase/env";
import { formatMoney } from "@/lib/shop/money";
import { logEmail } from "@/lib/shop/repo";
import type { Order } from "@/lib/shop/types";
import { site, whatsappHref } from "@/lib/site";

/* Customer e-mails go out in the customer's language (French or Arabic). */

const copy = {
  fr: {
    hello: (name: string) => `Bonjour ${name || ""},`.replace(" ,", ","),
    signoff: "Cordialement,",
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
    signoff: "مع خالص التحية،",
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

/** Keeps numbers, e-mails and Latin values in the right order inside Arabic text. */
const ltr = (value: string) => `<span dir="ltr" style="direction:ltr;unicode-bidi:embed">&#8294;${value}&#8297;</span>`;

const esc = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const para = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px;line-height:1.6">${esc(block).replace(/\n/g, "<br>")}</p>`)
    .join("");

const brand = {
  ink: "#0e0d0c",
  paper: "#fbf8f2",
  canvas: "#efe8dc",
  line: "#e3dacb",
  text: "#2a2622",
  muted: "#6d645b",
  red: "#c5161d",
  gold: "#a68456",
};

const trustLine = {
  fr: ["Paiement à la livraison", "Devis gratuit", "Société enregistrée au Maroc"],
  ar: ["الدفع عند التسليم", "عرض سعر مجاني", "شركة مسجّلة بالمغرب"],
} as const;

const footerNote = {
  fr: "Vous recevez cet e-mail suite à un échange avec Roma Pack.",
  ar: "توصلتم بهذه الرسالة في إطار تواصلكم مع روما باك.",
} as const;

type LayoutOptions = { eyebrow?: string; title?: string; preheader?: string };

/**
 * Branded e-mail shell, in the website's style: ink header with the wordmark,
 * red-to-gold rule, paper body, trust strip and the company's legal identity.
 * Table-based with inline styles so it renders in Gmail, Outlook and phones.
 */
function layout(locale: Locale, inner: string, options: LayoutOptions = {}) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const sans = locale === "ar" ? "Tahoma,'Segoe UI',Arial,sans-serif" : "'Helvetica Neue',Helvetica,Arial,sans-serif";
  const serif = locale === "ar" ? sans : "Georgia,'Times New Roman',serif";
  const tagline = locale === "ar" ? "مواد التغليف الاحترافية · الرباط" : "Emballages professionnels · Rabat";
  const site_ = site.url.replace(/^https?:\/\//, "");
  const head =
    (options.eyebrow
      ? `<p style="margin:0 0 10px;font-family:${sans};font-size:11px;letter-spacing:${locale === "ar" ? "0" : "3px"};text-transform:uppercase;color:${brand.gold}">${esc(options.eyebrow)}</p>`
      : "") +
    (options.title
      ? `<h1 style="margin:0 0 22px;font-family:${serif};font-size:26px;line-height:1.25;font-weight:normal;color:${brand.ink}">${esc(options.title)}</h1>`
      : "");
  const trust = trustLine[locale]
    .map(
      (item) =>
        `<td style="padding:14px 6px;font-family:${sans};font-size:12px;color:${brand.muted};text-align:center"><span style="color:${brand.gold};font-weight:bold">&#10003;</span>&nbsp;${esc(item)}</td>`,
    )
    .join("");

  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(options.title ?? "Roma Pack")}</title></head>
<body style="margin:0;padding:0;background:${brand.canvas};-webkit-text-size-adjust:100%">
${options.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(options.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.canvas}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${brand.paper};border:1px solid ${brand.line}">
<tr><td style="background:${brand.ink};padding:26px 34px" dir="ltr">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;width:58px"><img src="${esc(site.url)}/brand/emblem-96.png" width="46" height="46" alt="Roma Pack" style="display:block;border:0;border-radius:50%"></td>
    <td style="vertical-align:middle">
      <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:6px;color:#f4efe6;line-height:1">ROMA</div>
      <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:7px;color:${brand.gold};margin-top:5px">PACK</div>
    </td>
    <td style="vertical-align:middle;text-align:right;font-family:${sans};font-size:11px;letter-spacing:1px;color:#a59d92" dir="${dir}">${esc(tagline)}</td>
  </tr></table>
</td></tr>
<tr><td style="padding:0;font-size:0;line-height:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="ltr"><tr><td width="72%" style="height:3px;background:${brand.red}"></td><td width="28%" style="height:3px;background:${brand.gold}"></td></tr></table></td></tr>
<tr><td style="padding:38px 34px 30px;font-family:${sans};font-size:15px;line-height:1.7;color:${brand.text};text-align:${align}" dir="${dir}">${head}${inner}</td></tr>
<tr><td style="padding:0 34px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${brand.line};border-bottom:1px solid ${brand.line}"><tr>${trust}</tr></table></td></tr>
<tr><td style="padding:22px 34px 26px;font-family:${sans};font-size:12px;line-height:1.6;color:${brand.muted};text-align:center" dir="ltr">
  <a href="${esc(site.url)}" style="color:${brand.ink};text-decoration:none;font-weight:bold;letter-spacing:1px">${esc(site_)}</a>${site.phone ? ` &nbsp;·&nbsp; <a href="tel:${esc(site.phone.replace(/[^\d+]/g, ""))}" style="color:${brand.muted};text-decoration:none">${esc(site.phone)}</a>` : ""}<br>
  ${esc(site.legalName)} · SARL AU · ICE ${site.ice} · RC ${site.rc} Rabat<br>
  <span style="color:#a59d92" dir="${dir}">${esc(footerNote[locale])}</span>
</td></tr>
</table></td></tr></table></body></html>`;
}

/** Key/value card used to recall a request or an order inside an e-mail. */
function recapCard(locale: Locale, title: string, rows: [string, string | null | undefined][]) {
  const side = locale === "ar" ? "right" : "left";
  const body = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:${brand.muted};font-size:13px;width:38%;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;font-size:14px;color:${brand.ink};vertical-align:top" dir="auto">${esc(String(value))}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:#f4efe6;border-${side}:3px solid ${brand.red}">
<tr><td style="padding:16px 20px">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:${locale === "ar" ? "0" : "2px"};text-transform:uppercase;color:${brand.gold}">${esc(title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
</td></tr></table>`;
}

/** Quoted original message, shown under a reply like in a mail thread. */
function quotedMessage(locale: Locale, label: string, text: string) {
  const side = locale === "ar" ? "right" : "left";
  return `<div style="margin:24px 0 0;padding:12px 16px;border-${side}:2px solid ${brand.line};color:${brand.muted};font-size:13px" dir="auto"><p style="margin:0 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase">${esc(label)}</p>${esc(text).replace(/\n/g, "<br>")}</div>`;
}

function signature(locale: Locale) {
  const name = locale === "ar" ? "فريق روما باك" : "L'équipe Roma Pack";
  const role = locale === "ar" ? "مواد التغليف · الرباط" : "Négoce d'emballages · Rabat";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr>
<td style="width:3px;background:${brand.red}"></td>
<td style="padding:2px 14px">
<div style="font-family:Georgia,serif;font-size:16px;color:${brand.ink}">${esc(name)}</div>
<div style="font-size:12px;color:${brand.muted}">${esc(role)}${site.phone ? ` · ${ltr(esc(site.phone))}` : ""}</div>
</td></tr></table>`;
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

function button(href: string, label: string, variant: "primary" | "whatsapp" | "ink" = "primary") {
  const bg = variant === "whatsapp" ? "#1f6b45" : variant === "ink" ? brand.ink : brand.red;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 26px"><tr><td style="background:${bg}"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;color:#fff8f4;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:1px">${esc(label)}</a></td></tr></table>`;
}

export type CustomerEmail = { subject: string; html: string; kind: string };

export function orderReceivedEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "order_received",
    subject: t.receivedSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.receivedBody) + itemsTable(order, order.locale) + para(t.questions) + para(t.signoff) + signature(order.locale)),
  };
}

export function orderConfirmedEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "confirmed",
    subject: t.confirmedSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.confirmedBody) + itemsTable(order, order.locale) + para(t.signoff) + signature(order.locale)),
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
        para(t.signoff) +
        signature(order.locale),
    ),
  };
}

export function shippedEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  const tracking = order.trackingNumber ? `<p style="margin:0 0 14px">${t.tracking} : <strong dir="ltr">${esc(order.trackingNumber)}</strong></p>` : "";
  return {
    kind: "shipped",
    subject: t.shippedSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.shippedBody(order.carrier ?? "transporteur")) + tracking + para(t.signoff) + signature(order.locale)),
  };
}

export function deliverySlotEmail(order: Order): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "delivery_slot",
    subject: t.slotSubject(order.number),
    html: layout(order.locale, para(t.hello(order.customerName)) + para(t.slotBody(order.deliverySlot ?? "")) + para(t.questions) + para(t.signoff) + signature(order.locale)),
  };
}

export function cancelledEmail(order: Order, reason: string | null): CustomerEmail {
  const t = copy[order.locale];
  return {
    kind: "cancelled",
    subject: t.cancelSubject(order.number),
    html: layout(
      order.locale,
      para(t.hello(order.customerName)) + para(t.cancelBody) + (reason ? para(`${t.reason} : ${reason}`) : "") + para(t.questions) + para(t.signoff) + signature(order.locale),
    ),
  };
}

/** Free message written in the admin. Greeting and sign-off are added in the customer's language. */
export function messageEmail(locale: Locale, name: string, subject: string, message: string): CustomerEmail {
  const t = copy[locale];
  return { kind: "message", subject, html: layout(locale, para(t.hello(name)) + para(message) + para(t.signoff) + signature(locale)) };
}

/* ── Quote requests ──────────────────────────────────────────────────── */

export type QuoteSummary = {
  id?: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  city?: string | null;
  sector: string;
  product?: string | null;
  quantity?: string | null;
  message: string;
  locale: Locale;
  createdAt?: string;
};

const quoteCopy = {
  fr: {
    yourRequest: "Votre demande",
    company: "Entreprise",
    product: "Produit",
    quantity: "Quantité",
    city: "Ville",
    sector: "Secteur",
    date: "Envoyée le",
    yourMessage: "Votre message",
    receivedSubject: "Nous avons bien reçu votre demande de devis",
    receivedEyebrow: "Demande de devis",
    receivedTitle: "Merci, votre demande est bien arrivée.",
    receivedBody:
      "Notre équipe étudie votre besoin et vous répond les jours ouvrés avec une proposition adaptée : références, quantités, prix et délai. Le devis est gratuit et sans engagement.",
    faster: "Pour aller plus vite, vous pouvez aussi nous écrire sur WhatsApp.",
    whatsapp: "Écrire sur WhatsApp",
    replyEyebrow: "Réponse à votre demande de devis",
    replyDefaultSubject: (company: string) => `Votre devis Roma Pack · ${company}`,
    catalog: "Voir le catalogue",
  },
  ar: {
    yourRequest: "طلبكم",
    company: "الشركة",
    product: "المنتج",
    quantity: "الكمية",
    city: "المدينة",
    sector: "القطاع",
    date: "تاريخ الإرسال",
    yourMessage: "رسالتكم",
    receivedSubject: "توصلنا بطلب عرض السعر",
    receivedEyebrow: "طلب عرض سعر",
    receivedTitle: "شكراً، وصلنا طلبكم.",
    receivedBody:
      "يدرس فريقنا حاجتكم ويرد عليكم في أيام العمل باقتراح مناسب: المراجع والكميات والأسعار والآجال. عرض السعر مجاني ودون التزام.",
    faster: "وللسرعة، يمكنكم أيضاً مراسلتنا عبر واتساب.",
    whatsapp: "راسلونا عبر واتساب",
    replyEyebrow: "رد على طلب عرض السعر",
    replyDefaultSubject: (company: string) => `عرض سعر روما باك · ${company}`,
    catalog: "تصفح الكتالوج",
  },
} as const;

function quoteDate(value: string | undefined, locale: Locale) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", { dateStyle: "long", timeZone: "Africa/Casablanca" }).format(new Date(value));
}

function quoteRecap(quote: QuoteSummary) {
  const q = quoteCopy[quote.locale];
  return recapCard(quote.locale, q.yourRequest, [
    [q.company, quote.company],
    [q.product, quote.product],
    [q.quantity, quote.quantity],
    [q.city, quote.city],
    [q.date, quoteDate(quote.createdAt, quote.locale)],
  ]);
}

function whatsappLink(locale: Locale, company: string) {
  return whatsappHref(locale === "ar" ? `مرحباً روما باك، بخصوص طلب عرض السعر لـ ${company}` : `Bonjour Roma Pack, au sujet de la demande de devis de ${company}`);
}

export function defaultQuoteReplySubject(quote: Pick<QuoteSummary, "company" | "locale">) {
  return quoteCopy[quote.locale].replyDefaultSubject(quote.company);
}

/** Sent automatically to the customer right after the quote form. */
export function quoteReceivedEmail(quote: QuoteSummary): CustomerEmail {
  const t = copy[quote.locale];
  const q = quoteCopy[quote.locale];
  const wa = whatsappLink(quote.locale, quote.company);
  return {
    kind: "quote-received",
    subject: q.receivedSubject,
    html: layout(
      quote.locale,
      para(t.hello(quote.contactName)) +
        para(q.receivedBody) +
        quoteRecap(quote) +
        (wa ? para(q.faster) + button(wa, q.whatsapp, "whatsapp") : button(`${site.url}/${quote.locale}/produits`, q.catalog, "ink")) +
        para(t.signoff) +
        signature(quote.locale),
      { eyebrow: q.receivedEyebrow, title: q.receivedTitle, preheader: q.receivedBody },
    ),
  };
}

/** Reply written in the admin. Greeting, recap of the request and signature are added. */
export function quoteReplyEmail(quote: QuoteSummary, subject: string, message: string): CustomerEmail {
  const t = copy[quote.locale];
  const q = quoteCopy[quote.locale];
  const wa = whatsappLink(quote.locale, quote.company);
  return {
    kind: "quote-reply",
    subject,
    html: layout(
      quote.locale,
      para(t.hello(quote.contactName)) +
        para(message) +
        (wa ? button(wa, q.whatsapp, "whatsapp") : "") +
        para(t.signoff) +
        signature(quote.locale) +
        quoteRecap(quote) +
        quotedMessage(quote.locale, q.yourMessage, quote.message),
      { eyebrow: q.replyEyebrow, title: subject, preheader: message.slice(0, 140) },
    ),
  };
}

/** Internal alert to the team, with a button that opens the request in the admin. */
export function teamQuoteEmail(quote: QuoteSummary, adminUrl: string | null): { subject: string; html: string; text: string } {
  const rows: [string, string | null | undefined][] = [
    ["Entreprise", quote.company],
    ["Contact", quote.contactName],
    ["E-mail", quote.email],
    ["Téléphone", quote.phone],
    ["Ville", quote.city],
    ["Secteur", quote.sector],
    ["Produit", quote.product],
    ["Quantité", quote.quantity],
    ["Langue", quote.locale === "ar" ? "Arabe" : "Français"],
  ];
  const text = [...rows.filter(([, value]) => value).map(([label, value]) => `${label} : ${value}`), "", quote.message, "", adminUrl ?? ""].join("\n");
  const html = layout(
    "fr",
    recapCard("fr", "Client", rows) +
      `<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${brand.gold}">Message</p>` +
      `<div style="padding:14px 18px;background:#ffffff;border:1px solid ${brand.line};white-space:pre-wrap" dir="auto">${esc(quote.message)}</div>` +
      (adminUrl ? button(adminUrl, "Ouvrir et répondre dans l'admin", "ink") : ""),
    { eyebrow: "Nouvelle demande de devis", title: quote.company, preheader: `${quote.contactName} · ${quote.product ?? quote.sector}` },
  );
  return { subject: `Nouvelle demande de devis · ${quote.company}`, html, text };
}

export type SendResult = { state: "sent" | "skipped" | "failed"; detail?: string };

/** Sends (when Resend is configured) and always records the e-mail in the log. */
export async function sendCustomerEmail(
  to: string | null,
  email: CustomerEmail,
  refs: { customerId: string | null; orderId: string | null; quoteId?: string | null },
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
    quoteId: refs.quoteId ?? null,
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
