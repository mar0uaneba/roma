import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { defaultQuoteReplySubject, quoteReplyEmail } from "@/lib/shop/emails";
import { getQuote } from "@/lib/shop/repo";

/** Renders the reply exactly as the customer will receive it, before sending. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) return new Response("Quote not found", { status: 404 });
  const query = request.nextUrl.searchParams;
  const subject = query.get("subject")?.trim() || defaultQuoteReplySubject(quote);
  const message = query.get("message")?.trim() || "…";
  const email = quoteReplyEmail(quote, subject, message);
  return new Response(email.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:",
    },
  });
}
