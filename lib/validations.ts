import { z } from "zod";
import { categorySlugs } from "@/lib/catalog";

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} est trop court.`)
    .max(max, `${label} est trop long.`);

// Quote form messages are error keys, translated on the client (see `form.errors` in the dictionaries).
const quoteText = (key: string, min: number, max: number) =>
  z.string().trim().min(min, key).max(max, "tooLong");

export const quoteSchema = z.object({
  company: quoteText("company", 2, 120),
  contactName: quoteText("contactName", 2, 120),
  email: z
    .string()
    .trim()
    .max(180, "tooLong")
    .refine((value) => z.email().safeParse(value).success, "email"),
  phone: z.string().trim().min(8, "phone").max(30, "tooLong"),
  city: z.string().trim().max(80, "tooLong").optional().or(z.literal("")),
  sector: quoteText("sector", 2, 80),
  product: z.string().trim().max(160, "tooLong").optional().or(z.literal("")),
  quantity: z.string().trim().max(120, "tooLong").optional().or(z.literal("")),
  message: quoteText("message", 12, 4000),
  companyWebsite: z.string().max(200).optional().or(z.literal("")),
  locale: z.enum(["fr", "ar"]).optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug doit être en minuscules, sans accent."),
  name: requiredText("Le nom", 2, 140),
  category: z.enum(categorySlugs),
  summary: requiredText("Le résumé", 10, 240),
  description: requiredText("La description", 20, 4000),
  applications: requiredText("Les usages", 2, 400),
  formats: requiredText("Les formats", 2, 400),
  image: z.string().trim().min(1, "Ajoutez une image.").max(500),
  imageAlt: requiredText("Le texte alternatif", 4, 180),
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
  nameAr: z.string().trim().max(140).optional().or(z.literal("")),
  summaryAr: z.string().trim().max(240).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(4000).optional().or(z.literal("")),
  applicationsAr: z.string().trim().max(400).optional().or(z.literal("")),
  formatsAr: z.string().trim().max(400).optional().or(z.literal("")),
  imageAltAr: z.string().trim().max(180).optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;

export const quoteStatuses = ["new", "in_review", "quoted", "closed"] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];

export const quoteStatusSchema = z.enum(quoteStatuses);

export const statusLabels: Record<QuoteStatus, string> = {
  new: "Nouvelle",
  in_review: "En cours",
  quoted: "Devis envoyé",
  closed: "Clôturée",
};

export const orderStatuses = ["brouillon", "confirmee", "en_preparation", "livree", "annulee"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  brouillon: "Brouillon",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  livree: "Livrée",
  annulee: "Annulée",
};

export const orderSchema = z.object({
  id: z.string().trim().optional().or(z.literal("")),
  company: requiredText("Le client", 2, 120),
  contactName: requiredText("Le contact", 2, 120),
  phone: z.string().trim().min(8, "Indiquez un téléphone.").max(30),
  email: z
    .string()
    .trim()
    .max(180)
    .refine((value) => value === "" || z.email().safeParse(value).success, "E-mail invalide."),
  product: requiredText("Le produit", 2, 160),
  quantity: z.number().int().min(1, "La quantité doit être au moins 1.").max(1_000_000),
  unitPrice: z.number().min(0, "Le prix ne peut pas être négatif.").max(10_000_000),
  status: z.enum(orderStatuses),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type OrderInput = z.infer<typeof orderSchema>;
