"use client";

import { useCallback } from "react";

import type { Locale } from "@/lib/locales";
import { PUBLIC_LOCALES } from "@/lib/locales";

type Props = {
  locale: Locale;
  label: string;
};

export default function LanguageSwitcher({ locale, label }: Props) {
  const handleSelect = useCallback((value: Locale) => {
    document.cookie = `aya_locale=${value}; path=/; max-age=31536000`;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", value);
    window.location.href = url.toString();
  }, []);

  return (
    <div className="language-toggle" role="group" aria-label={label}>
      {PUBLIC_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`language-toggle__button${code === locale ? " language-toggle__button--active" : ""}`}
          onClick={() => handleSelect(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
