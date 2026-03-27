export const locales = ["fi", "en", "so", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fi";

export const localeNames: Record<Locale, string> = {
  fi: "Suomi",
  en: "English",
  so: "Soomaali",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
};
