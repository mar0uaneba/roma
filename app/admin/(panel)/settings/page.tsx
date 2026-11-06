import { CheckCircle2, Circle } from "lucide-react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { Suspense } from "react";
import { saveSettingsAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Card, Field, Flash, Loading, PageHeader } from "@/components/admin/ui";
import { isAdminPasswordSet } from "@/lib/admin/session";
import { isDbConfigured } from "@/lib/db";
import { getSettings } from "@/lib/shop/repo";
import { site } from "@/lib/site";
import { isResendConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Settings" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<Loading />}>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}

async function Settings({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireAdmin();
  const [params, settings] = await Promise.all([searchParams, getSettings()]);
  const env: [string, boolean, string][] = [
    ["ADMIN_PASSWORD", isAdminPasswordSet(), "Admin login (8+ characters). ADMIN_SESSION_SECRET is optional."],
    ["Supabase", isDbConfigured(), "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"],
    ["Resend", isResendConfigured(), "RESEND_API_KEY, RESEND_FROM_EMAIL, QUOTE_NOTIFY_EMAIL (+ REPLY_TO_EMAIL)"],
    ["Deploy hook", Boolean(process.env.VERCEL_DEPLOY_HOOK_URL), "VERCEL_DEPLOY_HOOK_URL"],
    ["Public phone", Boolean(site.phone), "NEXT_PUBLIC_PHONE"],
    ["Public e-mail", Boolean(site.email), "NEXT_PUBLIC_CONTACT_EMAIL"],
    ["Address", Boolean(site.address), "NEXT_PUBLIC_ADDRESS (+ NEXT_PUBLIC_ADDRESS_AR)"],
    ["WhatsApp", Boolean(site.whatsapp), "NEXT_PUBLIC_WHATSAPP_NUMBER, digits only, e.g. 2126XXXXXXXX"],
  ];

  return (
    <>
      <PageHeader title="Settings" />
      <Flash ok={params.ok} err={params.err} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Shop">
          <form action={saveSettingsAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Shipping fee (MAD)" hint="Empty: confirmed by phone">
                <input name="shippingFee" inputMode="decimal" defaultValue={settings.shippingFee ?? ""} className="admin-input" />
              </Field>
              <Field label="Free shipping from (MAD)">
                <input name="freeShippingFrom" inputMode="decimal" defaultValue={settings.freeShippingFrom ?? ""} className="admin-input" />
              </Field>
              <Field label="Minimum order (MAD)">
                <input name="minOrder" inputMode="decimal" defaultValue={settings.minOrder ?? ""} className="admin-input" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-adm-muted">
              <input type="checkbox" name="transferEnabled" defaultChecked={settings.transferEnabled} className="size-4 accent-[var(--color-adm-accent)]" />
              Offer bank transfer at checkout (in addition to cash on delivery)
            </label>
            <Field label="Bank details shown for transfers (RIB)">
              <textarea name="bankDetails" defaultValue={settings.bankDetails} className="admin-input" placeholder="Bank, account holder, RIB" />
            </Field>
            <SubmitButton pendingLabel="Saving…">Save shop settings</SubmitButton>
          </form>
        </Card>
        <Card title="Environment (Vercel → Settings → Environment Variables)">
          <ul className="space-y-3">
            {env.map(([label, ok, hint]) => (
              <li key={label} className="flex gap-3 text-sm">
                {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-adm-green" aria-hidden="true" /> : <Circle className="mt-0.5 size-4 shrink-0 text-adm-muted" aria-hidden="true" />}
                <span>
                  {label}
                  <span className="block text-xs text-adm-muted">{hint}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-adm-muted">Secret keys are never shown here. After changing variables, redeploy from Vercel.</p>
        </Card>
      </div>
    </>
  );
}
