export const SUPPORTED_LOCALES = ["en", "hy", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const PUBLIC_LOCALES = ["hy", "de"] as const satisfies readonly Locale[];
export const DEFAULT_PUBLIC_LOCALE: Locale = "hy";

export function normalizeLocale(locale?: string | null): Locale {
  if (!locale) {
    return DEFAULT_LOCALE;
  }
  const lower = locale.toLowerCase();
  return (SUPPORTED_LOCALES.find((item) => item === lower) ?? DEFAULT_LOCALE) as Locale;
}

export function normalizePublicLocale(locale?: string | null): Locale {
  if (!locale) {
    return DEFAULT_PUBLIC_LOCALE;
  }
  const lower = locale.toLowerCase();
  return (PUBLIC_LOCALES.find((item) => item === lower) ?? DEFAULT_PUBLIC_LOCALE) as Locale;
}
