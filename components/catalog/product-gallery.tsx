"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Main photo with thumbnails. Falls back to a single image when there are no extras. */
export function ProductGallery({ images, alt, label }: { images: string[]; alt: string; label: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="lg:sticky lg:top-28">
      <div
        data-spotlight=""
        className="spotlight spotlight-light group relative aspect-[4/5] overflow-hidden bg-line shadow-[0_50px_90px_-50px_rgba(14,13,12,0.55)]"
      >
        {current ? (
          <Image
            key={current}
            src={current}
            alt={alt}
            fill
            priority={active === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="media-zoom rise object-cover"
          />
        ) : null}
        <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-ink/10" />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label={label}>
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${label} ${index + 1}`}
              aria-pressed={index === active}
              className={cn(
                "relative aspect-square overflow-hidden border bg-line transition-[border-color,opacity] duration-300",
                index === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
