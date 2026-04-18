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

export default async function Home({ searchParams }: PageProps) {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get("aya_locale")?.value;
  const queryLocale = Array.isArray(searchParams?.lang) ? searchParams?.lang[0] : searchParams?.lang;
  const locale = normalizePublicLocale(queryLocale ?? cookieLocale ?? DEFAULT_PUBLIC_LOCALE);
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
