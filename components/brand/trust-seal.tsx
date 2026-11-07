import { cn } from "@/lib/utils";

const SEAL_TEXT = "ROMA PACK · SARL AU · RABAT · MAROC · ICE 003990345000040 · ";

/** Rotating circular seal with the company's legal identity. Pure SVG + CSS. */
export function TrustSeal({ id, label, className }: { id: string; label: string; className?: string }) {
  const pathId = `seal-${id}`;
  return (
    <div className={cn("relative size-28", className)} role="img" aria-label={label} dir="ltr">
      <svg viewBox="0 0 120 120" className="seal-spin absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <path id={pathId} d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
        </defs>
        <text fill="currentColor" fontSize="7.2" fontWeight="500" textLength="292" lengthAdjust="spacing">
          <textPath href={`#${pathId}`}>{SEAL_TEXT}</textPath>
        </text>
      </svg>
      <div className="absolute inset-[24%] flex items-center justify-center rounded-full border border-current/25">
        <svg viewBox="0 0 32 32" aria-hidden="true" className="size-1/2">
          <path d="M8 23.5V13.2a8 8 0 0 1 16 0v10.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12.2 23.5v-8.2a3.8 3.8 0 0 1 7.6 0v8.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
}
