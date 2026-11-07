import "server-only";
import { Resend } from "resend";
import { teamQuoteEmail, type QuoteSummary } from "@/lib/shop/emails";
import { isResendConfigured } from "@/lib/supabase/env";

/** Alerts the team about a new quote request, with a link to answer it in the admin. */
export async function sendQuoteNotification(quote: QuoteSummary, adminUrl: string | null) {
  if (!isResendConfigured()) {
    return { state: "unconfigured" as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const email = teamQuoteEmail(quote, adminUrl);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.QUOTE_NOTIFY_EMAIL!,
    replyTo: quote.email,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  if (error) return { state: "failed" as const, detail: error.message };
  return { state: "sent" as const };
}
