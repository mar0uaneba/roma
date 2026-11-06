"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createDraftAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/admin/client";
import { Card, Field, buttonClass } from "@/components/admin/ui";
import { computeTotals, formatMoney } from "@/lib/shop/money";

export type PickerProduct = {
  slug: string;
  name: string;
  image: string;
  unit: string | null;
  price: number | null;
  cost: number | null;
  category: string;
};

type Line = {
  key: string;
  productSlug: string | null;
  name: string;
  image: string | null;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export type DraftPrefill = {
  quoteId?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  city?: string;
  locale?: "fr" | "ar";
  internalNote?: string;
};

const mad = (value: number) => formatMoney(value, "en");
let counter = 0;

export function DraftForm({ products, prefill = {}, defaultShipping }: { products: PickerProduct[]; prefill?: DraftPrefill; defaultShipping: number | null }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [shipping, setShipping] = useState(defaultShipping ?? 0);
  const [discount, setDiscount] = useState(0);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => !needle || `${product.name} ${product.category} ${product.slug}`.toLowerCase().includes(needle)).slice(0, 8);
  }, [products, query]);

  const totals = computeTotals(lines, shipping, discount);

  function add(product: PickerProduct | null) {
    counter += 1;
    setLines((current) => [
      ...current,
      {
        key: `l${counter}`,
        productSlug: product?.slug ?? null,
        name: product?.name ?? "",
        image: product?.image ?? null,
        unit: product?.unit ?? null,
        quantity: 1,
        unitPrice: product?.price ?? 0,
        unitCost: product?.cost ?? 0,
      },
    ]);
    setQuery("");
  }

  function update(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  const items = JSON.stringify(
    lines.map(({ productSlug, name, image, unit, quantity, unitPrice, unitCost }) => ({ productSlug, name, image, unit, quantity, unitPrice, unitCost })),
  );

  return (
    <form action={createDraftAction} className="grid gap-6 xl:grid-cols-3">
      <input type="hidden" name="items" value={items} />
      {prefill.quoteId ? <input type="hidden" name="quoteId" value={prefill.quoteId} /> : null}

      <div className="space-y-6 xl:col-span-2">
        <Card title="Products">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-adm-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a product to add…"
              className="admin-input pl-9"
              aria-label="Search products"
            />
          </div>
          {query ? (
            <ul className="mt-2 overflow-hidden rounded-lg border border-adm-line">
              {matches.map((product) => (
                <li key={product.slug}>
                  <button
                    type="button"
                    onClick={() => add(product)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm hover:bg-adm-raised"
                  >
                    <span>
                      {product.name}
                      <span className="block text-xs text-adm-muted">{product.unit ?? product.category}</span>
                    </span>
                    <span className="text-xs text-adm-muted">{product.price ? mad(product.price) : "no price"}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 ? <li className="px-3 py-2 text-sm text-adm-muted">No product found.</li> : null}
            </ul>
          ) : null}
          <button type="button" onClick={() => add(null)} className={`${buttonClass("ghost", "sm")} mt-2`}>
            <Plus className="size-3.5" aria-hidden="true" /> Custom line
          </button>

          {lines.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.1em] text-adm-muted">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Unit price</th>
                    <th className="pb-2 font-medium">Unit cost</th>
                    <th className="pb-2 text-end font-medium">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-adm-line">
                  {lines.map((line) => (
                    <tr key={line.key}>
                      <td className="py-2 pe-3">
                        <input value={line.name} onChange={(event) => update(line.key, { name: event.target.value })} className="admin-input" placeholder="Description" />
                        <input
                          value={line.unit ?? ""}
                          onChange={(event) => update(line.key, { unit: event.target.value || null })}
                          className="admin-input mt-1 py-1 text-xs"
                          placeholder="Unit, e.g. carton de 100"
                        />
                      </td>
                      <td className="w-24 py-2 pe-3">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) => update(line.key, { quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)) })}
                          className="admin-input"
                        />
                      </td>
                      <td className="w-32 py-2 pe-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(event) => update(line.key, { unitPrice: Math.max(0, Number(event.target.value) || 0) })}
                          className="admin-input"
                        />
                      </td>
                      <td className="w-28 py-2 pe-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitCost}
                          onChange={(event) => update(line.key, { unitCost: Math.max(0, Number(event.target.value) || 0) })}
                          className="admin-input"
                        />
                      </td>
                      <td className="w-28 py-2 text-end tabular-nums">{mad(line.quantity * line.unitPrice)}</td>
                      <td className="w-10 py-2 text-end">
                        <button
                          type="button"
                          onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                          className="rounded-md p-2 text-adm-muted hover:bg-adm-red/10 hover:text-adm-red"
                          aria-label={`Remove ${line.name || "line"}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-adm-muted">No products yet. Search above or add a custom line.</p>
          )}
        </Card>

        <Card title="Customer">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name *">
              <input name="name" defaultValue={prefill.name} required className="admin-input" />
            </Field>
            <Field label="Company">
              <input name="company" defaultValue={prefill.company} className="admin-input" />
            </Field>
            <Field label="E-mail" hint="Needed to send the offer by e-mail">
              <input name="email" type="email" defaultValue={prefill.email} className="admin-input" />
            </Field>
            <Field label="Phone">
              <input name="phone" defaultValue={prefill.phone} className="admin-input" />
            </Field>
            <Field label="City">
              <input name="city" defaultValue={prefill.city} className="admin-input" />
            </Field>
            <Field label="Address">
              <input name="address" className="admin-input" />
            </Field>
            <Field label="Customer language">
              <select name="locale" defaultValue={prefill.locale ?? "fr"} className="admin-input">
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
              </select>
            </Field>
            <Field label="Payment">
              <select name="paymentMethod" defaultValue="cod" className="admin-input">
                <option value="cod">Cash on delivery</option>
                <option value="transfer">Bank transfer</option>
              </select>
            </Field>
          </div>
          <Field label="Note shown on the order (from the customer)" className="mt-3">
            <input name="customerNote" className="admin-input" />
          </Field>
          <Field label="Internal note" className="mt-3">
            <textarea name="internalNote" defaultValue={prefill.internalNote} className="admin-input" />
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Totals" className="xl:sticky xl:top-6">
          <div className="space-y-3">
            <Field label="Shipping (MAD)">
              <input
                name="shipping"
                type="number"
                min={0}
                step="0.01"
                value={shipping}
                onChange={(event) => setShipping(Math.max(0, Number(event.target.value) || 0))}
                className="admin-input"
              />
            </Field>
            <Field label="Discount (MAD)">
              <input
                name="discount"
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(Math.max(0, Number(event.target.value) || 0))}
                className="admin-input"
              />
            </Field>
            <dl className="space-y-1.5 border-t border-adm-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-adm-muted">Subtotal</dt>
                <dd className="tabular-nums">{mad(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-adm-muted">Shipping</dt>
                <dd className="tabular-nums">{mad(totals.shipping)}</dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-adm-muted">Discount</dt>
                  <dd className="tabular-nums">− {mad(totals.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{mad(totals.total)}</dd>
              </div>
              <div className="flex justify-between text-xs">
                <dt className="text-adm-muted">Gross margin</dt>
                <dd className="tabular-nums text-adm-green">{mad(totals.subtotal - totals.discount - totals.costTotal)}</dd>
              </div>
            </dl>
            <SubmitButton className="w-full" pendingLabel="Creating…">
              Create draft
            </SubmitButton>
            <p className="text-xs text-adm-muted">Next step: send the offer by e-mail or copy the link for WhatsApp.</p>
          </div>
        </Card>
      </div>
    </form>
  );
}
