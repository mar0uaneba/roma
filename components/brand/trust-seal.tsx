import Image from "next/image";
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
      <div className="absolute inset-[22%] overflow-hidden rounded-full border border-current/25 bg-white">
        <Image src="/brand/emblem.png" alt="" fill sizes="64px" className="object-cover" />
      </div>
    </div>
  );
}
