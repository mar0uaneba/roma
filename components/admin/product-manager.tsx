"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProduct, importEditorialCatalog, saveProduct } from "@/app/actions/admin";
import { categories, type CategorySlug } from "@/lib/catalog";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ManagedProduct = {
  slug: string;
  name: string;
  category: CategorySlug;
  summary: string;
  description: string;
  applications: string;
  formats: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  inDatabase: boolean;
  nameAr: string;
  summaryAr: string;
  descriptionAr: string;
  applicationsAr: string;
  formatsAr: string;
  imageAltAr: string;
};

const empty: ManagedProduct = {
  slug: "",
  name: "",
  category: "patisserie",
  summary: "",
  description: "",
  applications: "",
  formats: "",
  image: "/images/plain-box.jpg",
  imageAlt: "",
  featured: false,
  published: true,
  sortOrder: 100,
  inDatabase: false,
  nameAr: "",
  summaryAr: "",
  descriptionAr: "",
  applicationsAr: "",
  formatsAr: "",
  imageAltAr: "",
};

export function ProductManager({ products, canWrite }: { products: ManagedProduct[]; canWrite: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState<ManagedProduct>(products[0] ?? empty);
  const [pending, setPending] = useState(false);
  const sorted = useMemo(() => [...products].sort((a, b) => a.sortOrder - b.sortOrder), [products]);

  async function onSave() {
    if (!canWrite) return;
    setPending(true);
    const result = await saveProduct({ ...current, sortOrder: Number(current.sortOrder) });
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Produit enregistré.");
    router.refresh();
  }

  async function onDelete() {
    if (!canWrite || !current.inDatabase) return;
    if (!window.confirm("Retirer ce produit de la base ?")) return;
    const result = await deleteProduct(current.slug);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Produit retiré de la base.");
    router.refresh();
  }

  async function onImport() {
    if (!canWrite) return;
    const result = await importEditorialCatalog();
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Catalogue éditorial importé.");
    router.refresh();
  }

  async function onUpload(file: File) {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      toast.error("Supabase n'est pas configuré.");
      return;
    }
    const path = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error("Envoi impossible. Vérifiez le bucket product-images.");
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setCurrent((value) => ({ ...value, image: data.publicUrl }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div>
        <div className="mb-3 flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setCurrent(empty)} disabled={!canWrite}>
            Nouveau
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onImport} disabled={!canWrite}>
            Importer
          </Button>
        </div>
        <ul className="space-y-1">
          {sorted.map((product) => (
            <li key={product.slug}>
              <button
                type="button"
                onClick={() => setCurrent(product)}
                className={`w-full rounded-md px-3 py-2 text-start text-sm ${current.slug === product.slug ? "bg-ink text-background" : "hover:bg-card"}`}
              >
                {product.name}
                <span className="mt-0.5 block text-xs opacity-70">
                  {product.inDatabase ? "Base" : "Éditorial"} · {product.published ? "publié" : "masqué"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <form
        className="space-y-4 rounded-lg border border-line bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={current.name}
              onChange={(event) =>
                setCurrent((value) => ({
                  ...value,
                  name: event.target.value,
                  slug: value.inDatabase ? value.slug : slugify(event.target.value),
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={current.slug} onChange={(event) => setCurrent((value) => ({ ...value, slug: slugify(event.target.value) }))} />
          </label>
          <label className="space-y-2 text-sm">
            <Label htmlFor="category">Gamme</Label>
            <select
              id="category"
              className="h-12 w-full rounded-md border border-line bg-background px-3 text-sm"
              value={current.category}
              onChange={(event) => setCurrent((value) => ({ ...value, category: event.target.value as CategorySlug }))}
            >
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <Label htmlFor="sort">Ordre</Label>
            <Input id="sort" type="number" value={current.sortOrder} onChange={(event) => setCurrent((value) => ({ ...value, sortOrder: Number(event.target.value) }))} />
          </label>
        </div>
        <label className="block space-y-2 text-sm">
          <Label htmlFor="summary">Résumé</Label>
          <Textarea id="summary" value={current.summary} onChange={(event) => setCurrent((value) => ({ ...value, summary: event.target.value }))} />
        </label>
        <label className="block space-y-2 text-sm">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={current.description} onChange={(event) => setCurrent((value) => ({ ...value, description: event.target.value }))} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <Label htmlFor="applications">Usages, séparés par des virgules</Label>
            <Input id="applications" value={current.applications} onChange={(event) => setCurrent((value) => ({ ...value, applications: event.target.value }))} />
          </label>
          <label className="space-y-2 text-sm">
            <Label htmlFor="formats">Formats, séparés par des virgules</Label>
            <Input id="formats" value={current.formats} onChange={(event) => setCurrent((value) => ({ ...value, formats: event.target.value }))} />
          </label>
          <label className="space-y-2 text-sm">
            <Label htmlFor="image">Image</Label>
            <Input id="image" value={current.image} onChange={(event) => setCurrent((value) => ({ ...value, image: event.target.value }))} />
          </label>
          <label className="space-y-2 text-sm">
            <Label htmlFor="imageAlt">Texte alternatif</Label>
            <Input id="imageAlt" value={current.imageAlt} onChange={(event) => setCurrent((value) => ({ ...value, imageAlt: event.target.value }))} />
          </label>
        </div>
        <fieldset dir="rtl" lang="ar" className="space-y-4 rounded-md border border-line bg-background/60 p-4">
          <legend className="px-2 text-sm font-medium" dir="ltr">Version arabe (facultatif — le français s&apos;affiche si un champ est vide)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <Label htmlFor="nameAr">الاسم</Label>
              <Input id="nameAr" value={current.nameAr} onChange={(event) => setCurrent((value) => ({ ...value, nameAr: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm">
              <Label htmlFor="imageAltAr">النص البديل للصورة</Label>
              <Input id="imageAltAr" value={current.imageAltAr} onChange={(event) => setCurrent((value) => ({ ...value, imageAltAr: event.target.value }))} />
            </label>
          </div>
          <label className="block space-y-2 text-sm">
            <Label htmlFor="summaryAr">الملخص</Label>
            <Textarea id="summaryAr" value={current.summaryAr} onChange={(event) => setCurrent((value) => ({ ...value, summaryAr: event.target.value }))} />
          </label>
          <label className="block space-y-2 text-sm">
            <Label htmlFor="descriptionAr">الوصف</Label>
            <Textarea id="descriptionAr" value={current.descriptionAr} onChange={(event) => setCurrent((value) => ({ ...value, descriptionAr: event.target.value }))} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <Label htmlFor="applicationsAr">الاستعمالات، مفصولة بفواصل</Label>
              <Input id="applicationsAr" value={current.applicationsAr} onChange={(event) => setCurrent((value) => ({ ...value, applicationsAr: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm">
              <Label htmlFor="formatsAr">المقاسات، مفصولة بفواصل</Label>
              <Input id="formatsAr" value={current.formatsAr} onChange={(event) => setCurrent((value) => ({ ...value, formatsAr: event.target.value }))} />
            </label>
          </div>
        </fieldset>
        <label className="block text-sm">
          Envoyer une image
          <input
            type="file"
            accept="image/*"
            className="mt-2 block text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
            }}
            disabled={!canWrite}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={current.featured} onChange={(event) => setCurrent((value) => ({ ...value, featured: event.target.checked }))} />
          Mettre en avant
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={current.published} onChange={(event) => setCurrent((value) => ({ ...value, published: event.target.checked }))} />
          Publié
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={!canWrite || pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
          {current.inDatabase ? (
            <Button type="button" variant="outline" onClick={onDelete} disabled={!canWrite}>Retirer de la base</Button>
          ) : null}
        </div>
        {canWrite ? null : <p className="text-sm text-muted">Connectez Supabase pour enregistrer des modifications.</p>}
      </form>
    </div>
  );
}
