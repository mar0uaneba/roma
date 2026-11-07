import { ArrowUpRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { TrustSeal } from "@/components/brand/trust-seal";
import { localePath, type Locale } from "@/lib/i18n";
import { getTrust } from "@/lib/i18n/trust";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** "Identity sheet": the company's public legal data, styled like an official document. */
export function LegalCard({ lang, className, compact = false }: { lang: Locale; className?: string; compact?: boolean }) {
  const trust = getTrust(lang);
  const rows: [string, string, boolean?][] = [
    [trust.identityRows.legalName, site.legalName],
    [trust.identityRows.legalForm, trust.legalFormValue],
    [trust.identityRows.ice, site.ice, true],
    [trust.identityRows.rc, `${site.rc} · ${lang === "ar" ? "الرباط" : "Rabat"}`, true],
    [trust.identityRows.court, trust.courtValue],
    [trust.identityRows.capital, site.capital, true],
    [trust.identityRows.incorporated, trust.incorporatedValue],
    [trust.identityRows.activity, trust.activityValue],
  ];
  const shown = compact ? rows.filter((_, index) => [0, 1, 2, 3].includes(index)) : rows;

  return (
    <div
      className={cn(
        "paper relative overflow-hidden border border-line p-1.5 text-ink shadow-[0_40px_90px_-50px_rgba(14,13,12,0.55)]",
        className,
      )}
    >
      <div className="relative border border-gold/40 px-6 py-7 md:px-9 md:py-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold">
              <BadgeCheck className="size-4" aria-hidden="true" />
              {trust.verified}
            </p>
            <h3 className="mt-3 font-serif text-2xl md:text-3xl">{trust.identityCardTitle}</h3>
          </div>
          <TrustSeal id={compact ? "card-compact" : "card"} label={trust.sealLabel} className="-me-2 -mt-2 size-20 shrink-0 text-accent/80 md:size-24" />
        </div>
        <div className="hairline-gold mt-6" aria-hidden="true" />
        <dl className="mt-2">
          {shown.map(([label, value, numeric]) => (
            <div key={label} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 border-b border-dashed border-line py-3 text-sm last:border-b-0">
              <dt className="text-muted">{label}</dt>
              <dd className={cn("font-medium", numeric && "ltr-nums tabular-nums tracking-wide")}>{value}</dd>
            </div>
          ))}
        </dl>
        <Link
          href={localePath(lang, "/mentions-legales")}
          className="mt-5 inline-flex items-center gap-1.5 text-sm text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
        >
          {trust.identityLink}
          <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
