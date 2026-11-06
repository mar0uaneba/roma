"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/admin";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/demandes", label: "Demandes" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/reglages", label: "Réglages" },
];

export function AdminNav({ email, setup }: { email?: string | null; setup: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-line bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-5 lg:block">
        <Link href="/fr" className="text-ink" aria-label="Voir le site">
          <Logo />
        </Link>
        <p className="mt-4 hidden text-xs uppercase tracking-[0.16em] text-muted lg:block">Administration</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-3" aria-label="Administration">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm lg:rounded-md",
                active ? "bg-ink text-background" : "text-foreground hover:bg-ink/5",
              )}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden px-5 pb-6 text-sm text-muted lg:block">
        {setup ? <p>Mode configuration. Les commandes sont enregistrées localement.</p> : <p>{email}</p>}
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/fr" className="underline">Voir le site</Link>
          {setup ? null : (
            <form action={signOut}>
              <button type="submit" className="underline">Se déconnecter</button>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}

export function AdminShell({
  children,
  email,
  setup,
}: {
  children: ReactNode;
  email?: string | null;
  setup: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#efeae2] lg:grid lg:grid-cols-[16rem_1fr]">
      <AdminNav email={email} setup={setup} />
      <div className="min-w-0 px-5 py-8 md:px-8">
        {setup ? (
          <p className="mb-6 rounded-md border border-gold/40 bg-[#f7f1e4] px-4 py-3 text-sm leading-6">
            Supabase n&apos;est pas configuré. Les demandes et le catalogue ne sont pas enregistrés en base. Les commandes sont conservées dans un fichier local sur cette machine.
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
