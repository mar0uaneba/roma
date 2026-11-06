import "server-only";
import { Resend } from "resend";
import { isResendConfigured } from "@/lib/supabase/env";
import type { QuoteInput } from "@/lib/validations";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export async function sendQuoteNotification(quote: QuoteInput) {
  if (!isResendConfigured()) {
    return { state: "unconfigured" as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fields: [string, string][] = [
    ["Entreprise", quote.company],
    ["Contact", quote.contactName],
    ["E-mail", quote.email],
    ["Téléphone", quote.phone],
    ["Ville", quote.city || "—"],
    ["Secteur", quote.sector],
    ["Produit", quote.product || "—"],
    ["Quantité", quote.quantity || "—"],
    ["Langue du site", quote.locale === "ar" ? "Arabe" : "Français"],
  ];

  const text = [...fields.map(([label, value]) => `${label} : ${value}`), "", quote.message].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#161411">
<h2 style="margin:0 0 12px">Nouvelle demande de devis</h2>
<table cellpadding="6" style="border-collapse:collapse">${fields
    .map(([label, value]) => `<tr><td style="color:#6d645b">${label}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`)
    .join("")}</table>
<p style="white-space:pre-wrap;margin-top:16px" dir="auto">${escapeHtml(quote.message)}</p>
</div>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.QUOTE_NOTIFY_EMAIL!,
    replyTo: quote.email,
    subject: `Demande de devis — ${quote.company}`,
    text,
    html,
  });

  if (error) return { state: "failed" as const, detail: error.message };
  return { state: "sent" as const };
}
