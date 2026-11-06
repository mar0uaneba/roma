"use client";

import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, localePath } from "@/lib/i18n/config";
import { cart, useCart } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/money";

export type ShopProduct = { slug: string; name: string; image: string; unit: string | null; price: number; minQty: number };
export type ShopRules = { shippingFee: number | null; freeShippingFrom: number | null; minOrder: number | null; transferEnabled: boolean };

function useLines(products: ShopProduct[]) {
  const lines = useCart();
  const [removed, setRemoved] = useState(false);
  const bySlug = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);

  useEffect(() => {
    if (lines.length && cart.keepOnly([...bySlug.keys()])) setRemoved(true);
  }, [lines, bySlug]);

  const resolved = lines.flatMap((line) => {
    const product = bySlug.get(line.slug);
    return product ? [{ ...line, product, total: line.quantity * product.price }] : [];
  });
  const subtotal = resolved.reduce((sum, line) => sum + line.total, 0);
  return { resolved, subtotal, removed };
}

function shippingFor(rules: ShopRules, subtotal: number) {
  if (rules.freeShippingFrom !== null && subtotal >= rules.freeShippingFrom) return 0;
  return rules.shippingFee;
}

function Totals({ subtotal, rules }: { subtotal: number; rules: ShopRules }) {
  const { lang, t } = useI18n();
  const shipping = shippingFor(rules, subtotal);
  const money = (value: number) => formatMoney(value, lang);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">{t.shop.subtotal}</dt>
        <dd className="ltr-nums">{money(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">{t.shop.shipping}</dt>
        <dd className={shipping === null ? "text-muted" : "ltr-nums"}>{shipping === null ? t.shop.shippingTbd : shipping === 0 ? t.shop.shippingFree : money(shipping)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-medium text-ink">
        <dt>{t.shop.total}</dt>
        <dd className="ltr-nums">{money(subtotal + (shipping ?? 0))}</dd>
      </div>
    </dl>
  );
}

export function CartView({ products, rules }: { products: ShopProduct[]; rules: ShopRules }) {
  const { lang, t } = useI18n();
  const { resolved, subtotal, removed } = useLines(products);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const belowMin = rules.minOrder !== null && subtotal < rules.minOrder;

  if (!mounted) return <div className="min-h-[40vh]" />;

  if (resolved.length === 0) {
    return (
      <div className="border border-line bg-card p-10 text-center">
        <p className="font-serif text-3xl text-ink">{t.shop.emptyTitle}</p>
        <p className="mx-auto mt-3 max-w-md text-muted">{t.shop.emptyText}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={localePath(lang, "/produits")}>{t.common.viewCatalog}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={localePath(lang, "/contact")}>{t.common.requestQuote}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {removed ? <p className="mb-4 border border-gold/40 bg-[#f7f1e4] px-4 py-3 text-sm">{t.shop.unavailable}</p> : null}
        <ul className="divide-y divide-line border-y border-line">
          {resolved.map((line) => (
            <li key={line.slug} className="flex gap-4 py-5">
              <Link href={localePath(lang, `/produits/${line.slug}`)} className="relative size-24 shrink-0 overflow-hidden bg-line">
                <Image src={line.product.image} alt="" fill sizes="96px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link href={localePath(lang, `/produits/${line.slug}`)} className="font-serif text-xl text-ink hover:text-accent">
                    {line.product.name}
                  </Link>
                  <p className="text-sm text-muted">
                    <span className="ltr-nums">{formatMoney(line.product.price, lang)}</span>
                    {line.product.unit ? ` · ${format(t.shop.perUnit, { unit: line.product.unit })}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 items-center border border-ink/20">
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center disabled:opacity-40"
                      onClick={() => cart.set(line.slug, line.quantity - 1)}
                      disabled={line.quantity <= line.product.minQty}
                      aria-label="−"
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-10 text-center text-sm tabular-nums ltr-nums">{line.quantity}</span>
                    <button type="button" className="flex size-10 items-center justify-center" onClick={() => cart.set(line.slug, line.quantity + 1)} aria-label="+">
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="w-28 text-end font-medium ltr-nums">{formatMoney(line.total, lang)}</p>
                  <button type="button" onClick={() => cart.remove(line.slug)} className="p-2 text-muted hover:text-accent" aria-label={t.shop.remove}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href={localePath(lang, "/produits")} className="mt-6 inline-block text-sm underline decoration-accent underline-offset-4">
          {t.shop.continue}
        </Link>
      </div>
      <aside className="h-fit border border-line bg-card p-6 lg:sticky lg:top-28 lg:col-span-4">
        <Totals subtotal={subtotal} rules={rules} />
        {belowMin ? <p className="mt-4 text-sm text-accent">{format(t.shop.minOrder, { amount: formatMoney(rules.minOrder!, lang) })}</p> : null}
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href={belowMin ? "#" : localePath(lang, "/commande")} aria-disabled={belowMin} className={belowMin ? "pointer-events-none opacity-50" : ""}>
            {t.shop.checkout}
          </Link>
        </Button>
        <p className="mt-3 text-center text-xs text-muted">{t.shop.vatNote}</p>
      </aside>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function CheckoutForm({ products, rules }: { products: ShopProduct[]; rules: ShopRules }) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const { resolved, subtotal } = useLines(products);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && resolved.length === 0 && !pending) router.replace(localePath(lang, "/panier"));
  }, [mounted, resolved.length, pending, router, lang]);

  const shipping = shippingFor(rules, subtotal);
  const total = subtotal + (shipping ?? 0);

  async function submit(form: HTMLFormElement) {
    setPending(true);
    setError(null);
    const data = new FormData(form);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: lang,
          items: resolved.map((line) => ({ slug: line.slug, quantity: line.quantity })),
          name: data.get("name"),
          company: data.get("company"),
          phone: data.get("phone"),
          email: data.get("email"),
          city: data.get("city"),
          address: data.get("address"),
          note: data.get("note"),
          paymentMethod: data.get("paymentMethod") ?? "cod",
          website: data.get("website"),
        }),
      });
      const payload = (await response.json()) as { ok: boolean; number?: string; message?: string; emailed?: boolean };
      if (!response.ok || !payload.ok || !payload.number) {
        setError(payload.message ?? t.shop.error);
        setPending(false);
        return;
      }
      cart.clear();
      router.push(`${localePath(lang, "/commande/merci")}?n=${encodeURIComponent(payload.number)}${payload.emailed ? "&e=1" : ""}`);
    } catch {
      setError(t.shop.error);
      setPending(false);
    }
  }

  if (!mounted || resolved.length === 0) return <div className="min-h-[40vh]" />;

  return (
    <form
      className="grid gap-10 lg:grid-cols-12"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget);
      }}
    >
      <div className="space-y-8 lg:col-span-7">
        <fieldset className="space-y-5">
          <legend className="font-serif text-2xl text-ink">{t.shop.yourDetails}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={`${t.form.contactName} *`} htmlFor="name">
              <Input id="name" name="name" required autoComplete="name" minLength={2} maxLength={120} />
            </Field>
            <Field label={t.form.company} htmlFor="company">
              <Input id="company" name="company" autoComplete="organization" maxLength={120} />
            </Field>
            <Field label={`${t.form.phone} *`} htmlFor="phone">
              <Input id="phone" name="phone" type="tel" dir="ltr" required autoComplete="tel" placeholder="06 XX XX XX XX" minLength={8} maxLength={30} />
            </Field>
            <Field label={t.shop.emailOptional} htmlFor="email">
              <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" maxLength={180} />
            </Field>
          </div>
        </fieldset>
        <fieldset className="space-y-5">
          <legend className="font-serif text-2xl text-ink">{t.shop.deliveryAddress}</legend>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={`${t.form.city} *`} htmlFor="city">
              <Input id="city" name="city" required autoComplete="address-level2" maxLength={80} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={`${t.shop.address} *`} htmlFor="address">
                <Input id="address" name="address" required autoComplete="street-address" minLength={4} maxLength={240} />
              </Field>
            </div>
          </div>
          <Field label={t.shop.note} htmlFor="note">
            <Textarea id="note" name="note" maxLength={1000} className="min-h-24" />
          </Field>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="font-serif text-2xl text-ink">{t.shop.payment}</legend>
          <label className="flex cursor-pointer gap-3 border border-line bg-card p-4">
            <input type="radio" name="paymentMethod" value="cod" defaultChecked className="mt-1 accent-[var(--accent)]" />
            <span>
              <span className="font-medium">{t.shop.cod}</span>
              <span className="block text-sm text-muted">{t.shop.codHint}</span>
            </span>
          </label>
          {rules.transferEnabled ? (
            <label className="flex cursor-pointer gap-3 border border-line bg-card p-4">
              <input type="radio" name="paymentMethod" value="transfer" className="mt-1 accent-[var(--accent)]" />
              <span>
                <span className="font-medium">{t.shop.transfer}</span>
                <span className="block text-sm text-muted">{t.shop.transferHint}</span>
              </span>
            </label>
          ) : null}
        </fieldset>
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      <aside className="h-fit border border-line bg-card p-6 lg:sticky lg:top-28 lg:col-span-5">
        <h2 className="font-serif text-2xl text-ink">{t.shop.summary}</h2>
        <ul className="my-5 space-y-3 text-sm">
          {resolved.map((line) => (
            <li key={line.slug} className="flex justify-between gap-4">
              <span>
                <span className="ltr-nums">{line.quantity}</span> × {line.product.name}
              </span>
              <span className="shrink-0 ltr-nums">{formatMoney(line.total, lang)}</span>
            </li>
          ))}
        </ul>
        <Totals subtotal={subtotal} rules={rules} />
        {error ? (
          <p role="alert" className="mt-4 border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? t.shop.placing : format(t.shop.placeOrder, { total: formatMoney(total, lang) })}
        </Button>
        <p className="mt-3 text-xs leading-5 text-muted">{t.shop.terms}</p>
      </aside>
    </form>
  );
}
