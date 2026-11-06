export const locales = ["fr", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";
export const localeCookie = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.some((locale) => locale === value);
}

export function dirOf(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "fr" ? "ar" : "fr";
}

/** Prefix an internal path with the locale. `localePath("ar", "/produits")` → `/ar/produits`. */
export function localePath(locale: Locale, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Swap the locale segment of a pathname, keeping the rest. */
export function switchLocalePath(pathname: string, target: Locale) {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    parts[1] = target;
    return parts.join("/") || `/${target}`;
  }
  return localePath(target, pathname);
}

export const htmlLang: Record<Locale, string> = { fr: "fr-MA", ar: "ar-MA" };
export const ogLocale: Record<Locale, string> = { fr: "fr_MA", ar: "ar_MA" };

export function languageAlternates(path = "/") {
  return {
    languages: {
      "fr-MA": localePath("fr", path),
      "ar-MA": localePath("ar", path),
      "x-default": localePath(defaultLocale, path),
    },
  };
}

export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
