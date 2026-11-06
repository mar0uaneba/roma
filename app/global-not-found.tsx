import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/app/fonts";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Page introuvable · Roma Pack",
};

export default function GlobalNotFound() {
  return (
    <html lang="fr" dir="ltr" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ink font-sans text-background">
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-5 py-24">
          <Logo />
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">404</p>
            <h1 className="mt-4 font-serif text-5xl leading-tight md:text-6xl">Cette page n&apos;est pas au catalogue.</h1>
            <p dir="rtl" lang="ar" className="mt-4 text-2xl text-background/70" style={{ fontFamily: "var(--font-kufi)" }}>
              هذه الصفحة غير موجودة في الكتالوج.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/fr" className="inline-flex h-12 items-center bg-accent px-6 text-sm font-medium text-accent-foreground hover:bg-accent-strong">
              Accueil
            </Link>
            <Link
              href="/ar"
              className="inline-flex h-12 items-center border border-background/40 px-6 text-sm hover:bg-background hover:text-ink"
              style={{ fontFamily: "var(--font-plex-ar)" }}
            >
              الصفحة الرئيسية
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
