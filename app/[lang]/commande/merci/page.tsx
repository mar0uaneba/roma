import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { format, getDictionary, isLocale, localePath, type Locale } from "@/lib/i18n";
import { whatsappHref } from "@/lib/site";

export const metadata: Metadata = { robots: { index: false } };

export default async function Page({ params, searchParams }: PageProps<"/[lang]/commande/merci">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center px-5 py-32">
      <Suspense fallback={null}>
        <Thanks lang={lang} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Thanks({ lang, searchParams }: { lang: Locale; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = getDictionary(lang);
  const query = await searchParams;
  const number = typeof query.n === "string" ? query.n.replace(/[^A-Z0-9-]/gi, "").slice(0, 20) : "";
  const whatsapp = whatsappHref(`${t.contact.whatsappMessage} (${number})`);
  return (
    <>
      <CheckCircle2 className="size-12 text-[#1f6b45]" aria-hidden="true" />
      <h1 className="mt-6 font-serif text-5xl leading-tight text-ink">{t.shop.thanksTitle}</h1>
      {number ? <p className="mt-5 text-lg text-muted">{format(t.shop.thanksText, { number })}</p> : null}
      {query.e === "1" ? <p className="mt-2 text-muted">{t.shop.thanksEmail}</p> : null}
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={localePath(lang)}>{t.shop.backHome}</Link>
        </Button>
        {whatsapp ? (
          <Button asChild size="lg" variant="outline">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              {t.common.writeWhatsapp}
            </a>
          </Button>
        ) : null}
      </div>
    </>
  );
}
