import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getAdminContext } from "@/lib/admin";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="px-8 py-16 text-sm text-muted">Chargement de l&apos;administration…</div>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: ReactNode }) {
  const context = await getAdminContext();
  if (context.configured && context.role !== "admin") {
    redirect("/admin/login?erreur=acces");
  }

  return (
    <AdminShell email={context.email} setup={!context.configured}>
      {children}
    </AdminShell>
  );
}
