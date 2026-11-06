"use client";

import { useSyncExternalStore } from "react";

/* Cart kept in the visitor's browser. Prices are always recomputed on the server at checkout. */

export type CartLine = { slug: string; quantity: number };

const KEY = "rp_cart_v1";
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    cache = Array.isArray(parsed)
      ? parsed
          .filter((line): line is CartLine => typeof line?.slug === "string" && Number.isInteger(line?.quantity) && line.quantity > 0)
          .slice(0, 50)
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private mode: the cart still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cart = {
  add(slug: string, quantity: number) {
    const lines = [...read()];
    const existing = lines.find((line) => line.slug === slug);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, 100_000);
    else lines.push({ slug, quantity });
    write(lines.map((line) => ({ ...line })));
  },
  set(slug: string, quantity: number) {
    write(read().map((line) => (line.slug === slug ? { ...line, quantity: Math.max(1, Math.min(quantity, 100_000)) } : line)));
  },
  remove(slug: string) {
    write(read().filter((line) => line.slug !== slug));
  },
  keepOnly(slugs: string[]) {
    const lines = read();
    const kept = lines.filter((line) => slugs.includes(line.slug));
    if (kept.length !== lines.length) write(kept);
    return kept.length !== lines.length;
  },
  clear() {
    write([]);
  },
};
