"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteOrder, saveOrder } from "@/app/actions/admin";
import type { Order } from "@/lib/order-types";
import { orderStatuses, orderStatusLabels, type OrderStatus } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 });

const emptyForm = {
  id: "",
  company: "",
  contactName: "",
  phone: "",
  email: "",
  product: "",
  quantity: 1,
  unitPrice: 0,
  status: "brouillon" as OrderStatus,
  notes: "",
};

export function OrderBoard({ orders, local }: { orders: Order[]; local: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "toutes">("toutes");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "toutes" || order.status === status;
      const matchesQuery =
        !needle ||
        `${order.reference} ${order.company} ${order.product} ${order.contactName}`.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  const active = orders.filter((order) => order.status !== "annulee");
  const total = active.reduce((sum, order) => sum + order.quantity * order.unitPrice, 0);

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(order: Order) {
    setForm({
      id: order.id,
      company: order.company,
      contactName: order.contactName,
      phone: order.phone,
      email: order.email,
      product: order.product,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      status: order.status,
      notes: order.notes,
    });
    setOpen(true);
  }

  async function onSave() {
    setPending(true);
    const result = await saveOrder({
      ...form,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(form.id ? "Commande mise à jour." : "Commande créée.");
    setOpen(false);
    router.refresh();
  }

  async function onStatus(order: Order, next: OrderStatus) {
    const result = await saveOrder({
      id: order.id,
      company: order.company,
      contactName: order.contactName,
      phone: order.phone,
      email: order.email,
      product: order.product,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      status: next,
      notes: order.notes,
    });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const result = await deleteOrder(pendingDelete.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Commande supprimée.");
    setPendingDelete(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-ink">Commandes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {local
              ? "Enregistrement local sur cet ordinateur. Branchez Supabase pour partager les commandes."
              : "Commandes enregistrées dans Supabase."}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>Nouvelle commande</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Commandes" value={String(orders.length)} />
        <Summary label="Hors annulées" value={String(active.length)} />
        <Summary label="Montant" value={money.format(total)} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
          <Filter active={status === "toutes"} onClick={() => setStatus("toutes")}>Toutes</Filter>
          {orderStatuses.map((item) => (
            <Filter key={item} active={status === item} onClick={() => setStatus(item)}>
              {orderStatusLabels[item]}
            </Filter>
          ))}
        </div>
        <label className="sr-only" htmlFor="recherche-commande">Rechercher une commande</label>
        <input
          id="recherche-commande"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Client, référence, produit"
          className="h-11 w-full rounded-sm border border-line bg-card px-3 text-sm outline-none focus:border-accent lg:max-w-xs"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-sm border border-line bg-card px-4 py-8 text-sm text-muted">Aucune commande pour ce filtre.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line bg-card">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-medium">{order.reference}</p>
                    <p className="text-muted">{order.createdAt.slice(0, 10)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{order.company}</p>
                    <p className="text-muted">{order.contactName}</p>
                    <p className="text-muted">{order.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{order.product}</p>
                    <p className="text-muted">{order.quantity} × {money.format(order.unitPrice)}</p>
                  </td>
                  <td className="px-4 py-4 font-medium">{money.format(order.quantity * order.unitPrice)}</td>
                  <td className="px-4 py-4">
                    <label className="sr-only" htmlFor={`statut-${order.id}`}>Statut de {order.reference}</label>
                    <select
                      id={`statut-${order.id}`}
                      className="h-10 rounded-sm border border-line bg-background px-2"
                      value={order.status}
                      onChange={(event) => void onStatus(order, event.target.value as OrderStatus)}
                    >
                      {orderStatuses.map((item) => (
                        <option key={item} value={item}>{orderStatusLabels[item]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-3">
                      <button type="button" className="underline" onClick={() => openEdit(order)}>Modifier</button>
                      <button type="button" className="text-accent underline" onClick={() => setPendingDelete(order)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog.Root open={pendingDelete !== null} onOpenChange={(next) => { if (!next) setPendingDelete(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 bg-card p-6 shadow-xl focus:outline-none">
            <Dialog.Title className="font-serif text-3xl text-ink">Supprimer la commande</Dialog.Title>
            <p className="mt-3 text-sm text-muted">
              {pendingDelete ? `${pendingDelete.reference} — ${pendingDelete.company}` : ""} sera retirée de la liste.
            </p>
            <div className="mt-6 flex gap-3">
              <Button type="button" onClick={() => void confirmDelete()}>Supprimer</Button>
              <Dialog.Close className="text-sm underline">Annuler</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100%-2rem,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-card p-6 shadow-xl focus:outline-none">
            <Dialog.Title className="font-serif text-3xl text-ink">
              {form.id ? "Modifier la commande" : "Nouvelle commande"}
            </Dialog.Title>
            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void onSave();
              }}
            >
              <Field label="Client" htmlFor="company">
                <Input id="company" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} required />
              </Field>
              <Field label="Contact" htmlFor="contactName">
                <Input id="contactName" value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} required />
              </Field>
              <Field label="Téléphone" htmlFor="phone">
                <Input id="phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
              </Field>
              <Field label="E-mail" htmlFor="email">
                <Input id="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </Field>
              <Field label="Produit" htmlFor="product" className="sm:col-span-2">
                <Input id="product" value={form.product} onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))} required />
              </Field>
              <Field label="Quantité" htmlFor="quantity">
                <Input id="quantity" type="number" min={1} value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} required />
              </Field>
              <Field label="Prix unitaire (MAD)" htmlFor="unitPrice">
                <Input id="unitPrice" type="number" min={0} step="0.01" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} required />
              </Field>
              <Field label="Statut" htmlFor="status">
                <select
                  id="status"
                  className="h-12 w-full rounded-sm border border-line bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as OrderStatus }))}
                >
                  {orderStatuses.map((item) => (
                    <option key={item} value={item}>{orderStatusLabels[item]}</option>
                  ))}
                </select>
              </Field>
              <p className="self-end text-sm text-muted">Total {money.format(Number(form.quantity) * Number(form.unitPrice) || 0)}</p>
              <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
                <Textarea id="notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </Field>
              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
                <Dialog.Close className="text-sm underline">Annuler</Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-card px-5 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-ink">{value}</p>
    </div>
  );
}

function Filter({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-sm border px-3 py-2 text-sm",
        active ? "border-ink bg-ink text-background" : "border-line bg-card",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, htmlFor, children, className }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
