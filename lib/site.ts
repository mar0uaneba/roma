import type { Dictionary } from "@/lib/i18n/dictionaries/fr";

function configured(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const site = {
  name: "Roma Pack",
  legalName: "ROMA PACK",
  city: "Rabat",
  country: "Maroc",
  legalForm: "SARL AU",
  ice: "003990345000040",
  rc: "201269",
  tribunal: "Tribunal de commerce de Rabat",
  capital: "100 000 MAD",
  incorporated: "17 juillet 2026",
  activity: "Négociant en emballages et fournitures de conditionnement",
  phone: configured(process.env.NEXT_PUBLIC_PHONE),
  email: configured(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  whatsapp: configured(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  address: configured(process.env.NEXT_PUBLIC_ADDRESS),
  addressAr: configured(process.env.NEXT_PUBLIC_ADDRESS_AR),
  url: configured(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
};

export function siteAddress(locale: "fr" | "ar") {
  return locale === "ar" ? (site.addressAr ?? site.address) : site.address;
}

export function whatsappHref(message: string) {
  if (!site.whatsapp) return null;
  const digits = site.whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function navItems(t: Dictionary) {
  return [
    { href: "/produits", label: t.nav.catalog },
    { href: "/secteurs", label: t.nav.sectors },
    { href: "/a-propos", label: t.nav.about },
    { href: "/contact", label: t.nav.quote },
  ] as const;
}
