import { redirect } from "next/navigation";

import AdminDashboard from "@/components/admin/AdminDashboard";
import { hasValidSessionFromCookies } from "@/lib/adminAuth";
import { getCmsPayload, listMedia, seedDefaultMedia } from "@/lib/cms";
import { DEFAULT_LOCALE } from "@/lib/locales";
import { listInvitees } from "@/lib/invitees";

export default async function AdminPage() {
  if (!hasValidSessionFromCookies()) {
    redirect("/admin/login");
  }
  const locale = DEFAULT_LOCALE;
  await seedDefaultMedia(locale);
  const { meta, menu, blocks, media, couple, event } = await getCmsPayload(locale);
  const sliderMedia = media.hero_slider ?? (await listMedia("hero_slider", locale));
  const blogMedia = media.blog_posts ?? (await listMedia("blog_posts", locale));
  const rsvpMedia = media.rsvp_images ?? (await listMedia("rsvp_images", locale));
  const invitees = await listInvitees();
  return (
    <AdminDashboard
      initialLocale={locale}
      initialMeta={meta}
      initialMenu={menu}
      initialBlocks={blocks}
      initialCouple={couple}
      initialEvent={event}
      initialMedia={{
        hero_slider: sliderMedia,
        blog_posts: blogMedia,
        rsvp_images: rsvpMedia,
      }}
      initialInvitees={invitees}
    />
  );
}
