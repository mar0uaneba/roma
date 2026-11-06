import { Fraunces, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic, Outfit } from "next/font/google";

export const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-plex-ar",
  display: "swap",
  preload: false,
});

export const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kufi",
  display: "swap",
  preload: false,
});

export const fontVariables = `${outfit.variable} ${fraunces.variable} ${plexArabic.variable} ${kufi.variable}`;
