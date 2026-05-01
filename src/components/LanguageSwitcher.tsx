"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Locale } from "@/lib/locales";
import { PUBLIC_LOCALES } from "@/lib/locales";

const SKIP_INVITATION_GATE_KEY = "aya_skip_invitation_gate_once";

type Props = {
  locale: Locale;
  label: string;
};

export default function LanguageSwitcher({ locale, label }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSelect = useCallback((value: Locale) => {
    if (value === locale || isPending) {
      return;
    }

    document.cookie = `aya_locale=${value}; path=/; max-age=31536000`;
    window.sessionStorage.setItem(SKIP_INVITATION_GATE_KEY, "true");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("lang", value);
    window.scrollTo({ top: 0, behavior: "auto" });

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: true });
      router.refresh();
    });
  }, [isPending, locale, pathname, router, searchParams]);

  return (
    <>
      <div className="language-toggle" role="group" aria-label={label} aria-busy={isPending}>
        {PUBLIC_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            className={`language-toggle__button${code === locale ? " language-toggle__button--active" : ""}`}
            disabled={isPending}
            onClick={() => handleSelect(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
      {isPending && (
        <div className="language-loader" role="status" aria-live="polite" aria-label="Loading language">
          <span className="language-loader__spinner" />
        </div>
      )}
    </>
  );
}
