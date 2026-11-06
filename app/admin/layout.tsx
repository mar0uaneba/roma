import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "../globals.css";
import { fontVariables } from "@/app/fonts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Administration · Roma Pack", template: "%s · Admin Roma Pack" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${fontVariables} h-full antialiased`}>
      <body className="admin-root min-h-full font-sans">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
