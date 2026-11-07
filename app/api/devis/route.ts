import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/lib/db";
import { sendQuoteNotification } from "@/lib/email";
import { quoteReceivedEmail, sendCustomerEmail } from "@/lib/shop/emails";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { createPublicClient } from "@/lib/supabase/public";
import { isResendConfigured, isSupabaseConfigured } from "@/lib/supabase/env";
import { quoteSchema } from "@/lib/validations";

type Persisted = "saved" | "unconfigured" | "failed";
type Emailed = "sent" | "unconfigured" | "failed" | "skipped";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: getDictionary("fr").quoteResult.unreadable }, { status: 400 });
  }

  const requested = (payload as { locale?: string } | null)?.locale;
  const locale: Locale = isLocale(requested) ? requested : "fr";
  const t = getDictionary(locale).quoteResult;

  const parsed = quoteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: t.invalid, fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const quote = parsed.data;
  if (quote.companyWebsite) {
    // Honeypot filled: answer as if saved, store nothing.
    return NextResponse.json({ ok: true, persisted: "ignored", emailed: "skipped", message: t.savedSent });
  }

  let persisted: Persisted = isSupabaseConfigured() || isDbConfigured() ? "failed" : "unconfigured";
  let quoteId: string | null = null;
  const row = {
    company: quote.company,
    contact_name: quote.contactName,
    email: quote.email,
    phone: quote.phone,
    city: quote.city || null,
    sector: quote.sector,
    product: quote.product || null,
    quantity: quote.quantity || null,
    message: quote.message,
  };

  const db = getDb();
  if (db) {
    // Server key: the row id comes back, so the team alert can link straight to the request.
    const { data, error } = await db.from("quote_requests").insert({ ...row, locale }).select("id, created_at").single();
    if (!error && data) {
      persisted = "saved";
      quoteId = String(data.id);
    } else if (error) {
      console.error("quote insert failed", error.message);
    }
  } else if (isSupabaseConfigured()) {
    const supabase = createPublicClient()!;
    let { error } = await supabase.from("quote_requests").insert({ ...row, locale });
    // Before migration 003 the `locale` column does not exist: store the request anyway.
    if (error && /locale/i.test(error.message)) {
      ({ error } = await supabase.from("quote_requests").insert(row));
    }
    persisted = error ? "failed" : "saved";
    if (error) console.error("quote insert failed", error.message);
  }

  let emailed: Emailed = "skipped";
  if (persisted === "saved") {
    const summary = { ...quote, id: quoteId ?? undefined, locale, createdAt: new Date().toISOString() };
    if (!isResendConfigured()) {
      emailed = "unconfigured";
    } else {
      const origin = new URL(request.url).origin;
      const adminUrl = quoteId ? `${origin}/admin/quotes/${quoteId}` : `${origin}/admin/quotes`;
      const [team] = await Promise.allSettled([
        sendQuoteNotification(summary, adminUrl),
        // Acknowledgement to the customer, in their language, kept in the request's history.
        sendCustomerEmail(quote.email, quoteReceivedEmail(summary), { customerId: null, orderId: null, quoteId }),
      ]);
      emailed = team.status === "fulfilled" ? team.value.state : "failed";
    }
  }

  const message =
    persisted === "saved"
      ? emailed === "sent"
        ? t.savedSent
        : emailed === "unconfigured"
          ? t.savedNoEmail
          : t.savedEmailFailed
      : persisted === "unconfigured"
        ? t.unconfigured
        : t.failed;

  return NextResponse.json({ ok: persisted !== "failed", persisted, emailed, message });
}
