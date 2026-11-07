"use client";

import { useEffect } from "react";

/**
 * One listener for the whole page: any element with `data-spotlight` receives
 * --spot-x / --spot-y (pointer position inside it). CSS draws the glow.
 */
export function SpotlightTracker() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    let last: PointerEvent | null = null;

    const apply = () => {
      frame = 0;
      const event = last;
      if (!event || !(event.target instanceof Element)) return;
      const host = event.target.closest<HTMLElement>("[data-spotlight]");
      if (!host) return;
      const rect = host.getBoundingClientRect();
      host.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      host.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      last = event;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
