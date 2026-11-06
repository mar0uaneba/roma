import { Suspense, type ReactNode } from "react";
import { signOutAction } from "@/app/actions/admin";
import { CleanFlashParams } from "@/components/admin/client";
import { AdminShell } from "@/components/admin/shell";
import { Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { countOrders, isDemo, listQuotes } from "@/lib/shop/repo";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="admin-root min-h-screen p-8"><Loading /></div>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [counts, quotes] = await Promise.all([countOrders().catch(() => null), listQuotes().catch(() => [])]);
  return (
    <AdminShell
      demo={isDemo()}
      signOut={signOutAction}
      counts={{ open: counts?.open ?? 0, drafts: counts?.drafts ?? 0, quotes: quotes.filter((quote) => quote.status === "new").length }}
    >
      <CleanFlashParams />
      {children}
    </AdminShell>
  );
}
