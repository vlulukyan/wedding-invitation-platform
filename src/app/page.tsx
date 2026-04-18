import type { Metadata } from "next";
import { cookies } from "next/headers";

import BackgroundMusic from "@/components/BackgroundMusic";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RsvpFormHydrator from "@/components/RsvpFormHydrator";
import TemplateScripts from "@/components/TemplateScripts";
import { getCmsPayload } from "@/lib/cms";
import { DEFAULT_PUBLIC_LOCALE, normalizePublicLocale } from "@/lib/locales";
import { getUiMessages } from "@/lib/i18n";
import { getTemplateMarkup } from "@/lib/template";
import { renderTemplateWithCms } from "@/lib/templateRenderer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getLocaleFromSearchParams(searchParams?: PageProps["searchParams"]) {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get("aya_locale")?.value;
  const queryLocale = Array.isArray(searchParams?.lang) ? searchParams?.lang[0] : searchParams?.lang;
  return normalizePublicLocale(queryLocale ?? cookieLocale ?? DEFAULT_PUBLIC_LOCALE);
}

function buildInvitationTitle(brideName?: string | null, groomName?: string | null) {
  const names = [brideName, groomName].map((name) => name?.trim()).filter(Boolean);
  return names.length ? `Wedding Invitation - ${names.join(" & ")}` : "Wedding Invitation";
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = getLocaleFromSearchParams(searchParams);

  if (!process.env.NETLIFY_DATABASE_URL) {
    return {
      title: "Wedding Invitation",
      description: "Wedding invitation with RSVP details.",
    };
  }

  const cms = await getCmsPayload(locale);
  const title = buildInvitationTitle(cms.meta.bride_name, cms.meta.groom_name);

  return {
    title,
    description: cms.meta.hero_subtext || cms.meta.hero_headline || "Wedding invitation with RSVP details.",
    openGraph: {
      title,
      description: cms.meta.hero_subtext || cms.meta.hero_headline || "Wedding invitation with RSVP details.",
    },
  };
}

export default async function Home({ searchParams }: PageProps) {
  const locale = getLocaleFromSearchParams(searchParams);
  const { body } = getTemplateMarkup();
  const cms = await getCmsPayload(locale);
  const renderedBody = renderTemplateWithCms(body, cms);
  const uiMessages = getUiMessages(locale);

  return (
    <>
      <main
        className="template-page"
        data-locale={locale}
        dangerouslySetInnerHTML={{ __html: renderedBody }}
        suppressHydrationWarning
      />
      <BackgroundMusic messages={uiMessages.music} />
      <LanguageSwitcher locale={locale} label={uiMessages.languageLabel} />
      <RsvpFormHydrator locale={locale} messages={uiMessages.rsvp} />
      <TemplateScripts countdownLabels={uiMessages.countdown} />
    </>
  );
}
