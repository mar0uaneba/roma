import { Lock } from "lucide-react";
import { loginAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Notice } from "@/components/admin/ui";

export function LoginScreen({ error, configured }: { error?: string; configured: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-adm-accent text-[#140a04]">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-xl font-semibold">Roma Pack admin</h1>
          <p className="mt-1 text-sm text-adm-muted">Sign in to manage orders, products and customers.</p>
        </div>
        <form action={loginAction} className="space-y-4 rounded-2xl border border-adm-line bg-adm-panel p-6">
          {error ? <Notice tone="red">{error}</Notice> : null}
          {!configured ? (
            <Notice tone="amber" title="Password not set">
              Add <code className="text-adm-text">ADMIN_PASSWORD</code> (8+ characters) in Vercel → Settings → Environment Variables, then redeploy.
            </Notice>
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-adm-muted">Password</span>
            <input name="password" type="password" autoComplete="current-password" required autoFocus className="admin-input" />
          </label>
          <SubmitButton className="w-full" pendingLabel="Checking…">
            Sign in
          </SubmitButton>
          <p className="text-center text-xs text-adm-muted">Session lasts 12 hours. 5 wrong attempts lock the form for 15 minutes.</p>
        </form>
      </div>
    </div>
  );
}
