"use client";

import {
  Boxes,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Map,
  Menu,
  Megaphone,
  MessageSquareQuote,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Counts = { open: number; drafts: number; quotes: number };

const sections = (counts: Counts) => [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: counts.open },
  { href: "/admin/drafts", label: "Drafts", icon: FileText, badge: counts.drafts },
  { href: "/admin/quotes", label: "Quote requests", icon: MessageSquareQuote, badge: counts.quotes },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/customers", label: "Customers & CRM", icon: Users },
  { href: "/admin/visitors", label: "Visitors & Map", icon: Map, soon: true },
  { href: "/admin/marketing", label: "Google Ads & Merchant", icon: Megaphone, soon: true },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-adm-accent text-[#140a04]">
        <ClipboardList className="size-4" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-wide">ROMA PACK</span>
        <span className="block text-[11px] text-adm-muted">Admin</span>
      </span>
    </span>
  );
}

export function AdminShell({ children, counts, demo, signOut }: { children: ReactNode; counts: Counts; demo: boolean; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Admin">
      {sections(counts).map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-adm-raised text-adm-text" : "text-adm-muted hover:bg-white/[0.03] hover:text-adm-text",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={cn("size-4", active ? "text-adm-accent" : "")} aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.soon ? <span className="text-[10px] uppercase tracking-wider text-adm-muted/70">Soon</span> : null}
            {item.badge ? (
              <span className="rounded-full bg-adm-accent px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#140a04]">{item.badge}</span>
            ) : null}
          </Link>
        );
      })}
      <div className="my-3 border-t border-adm-line" />
      <a
        href="/fr"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-adm-muted hover:bg-white/[0.03] hover:text-adm-text"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        View shop
      </a>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-adm-muted hover:bg-white/[0.03] hover:text-adm-text"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </form>
    </nav>
  );

  return (
    <div className="admin-root min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-adm-line bg-adm-panel py-5 lg:flex">
        <div className="px-6 pb-6">
          <Logo />
        </div>
        {nav}
        <p className="px-6 pt-4 text-[11px] text-adm-muted/70">
          <Lock className="me-1 inline size-3" aria-hidden="true" />
          Session expires after 12 h
        </p>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-adm-line bg-adm-panel/95 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-adm-line p-2" aria-label="Open menu">
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-adm-panel py-5">
            <div className="flex items-center justify-between px-6 pb-6">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-adm-line p-2" aria-label="Close menu">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        {demo ? (
          <div className="mb-6 rounded-xl border border-adm-amber/30 bg-adm-amber/10 px-4 py-3 text-sm text-adm-amber">
            <strong>Demo mode.</strong> No database is connected, so you are looking at sample data and nothing is saved. Add the Supabase keys in Vercel to go live.
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
