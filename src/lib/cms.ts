import { load } from "cheerio";

import { queryRow, queryRows, sql } from "@/lib/db";
import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES, normalizeLocale } from "@/lib/locales";
import { getTemplateMarkup } from "@/lib/template";

export type CmsMeta = {
  locale: Locale;
  bride_name: string;
  groom_name: string;
  event_date: string | null;
  event_location: string | null;
  hero_headline: string | null;
  hero_subtext: string | null;
  hero_shape_url: string | null;
  invitation_gate_background_url: string | null;
  background_music_url: string | null;
  brand_text: string | null;
};

export type CmsMenuItem = {
  id: number;
  label: string;
  href: string;
  position: number;
  is_visible: number;
  locale: Locale;
};

export type CmsBlock = {
  id: number;
  slug: string;
  selector: string;
  content_html: string;
  position: number;
  is_visible: number;
  locale: Locale;
};

export type CmsMedia = {
  id: number;
  collection: string;
  image_url: string;
  title: string | null;
  description: string | null;
  link_url: string | null;
  position: number;
  locale: Locale;
};

export type CmsPayload = {
  meta: CmsMeta;
  menu: CmsMenuItem[];
  blocks: CmsBlock[];
  media: Record<string, CmsMedia[]>;
  couple: CoupleSection;
  event: EventSection;
};

export type CoupleSection = {
  locale: Locale;
  left_name: string;
  left_bio: string | null;
  left_icon_url: string | null;
  left_facebook_url: string | null;
  left_twitter_url: string | null;
  left_instagram_url: string | null;
  right_name: string;
  right_bio: string | null;
  right_icon_url: string | null;
  right_facebook_url: string | null;
  right_twitter_url: string | null;
  right_instagram_url: string | null;
  center_photo_url: string | null;
  center_overlay_url: string | null;
};

export type EventItem = {
  title: string;
  image_url: string;
  time: string;
  address: string;
  map_url: string | null;
  is_visible: boolean;
};

export type EventSection = {
  locale: Locale;
  eyebrow: string;
  heading: string;
  items: EventItem[];
};

const DEFAULT_MENU = [
  { label: "Home", href: "#", position: 10, is_visible: 1 },
  { label: "Couple", href: "#couple", position: 20, is_visible: 1 },
  { label: "Story", href: "#story", position: 30, is_visible: 1 },
  { label: "Event", href: "#event", position: 40, is_visible: 1 },
  { label: "RSVP", href: "#rsvp", position: 50, is_visible: 1 },
  { label: "Blog", href: "#blog", position: 60, is_visible: 1 },
];

const DEFAULT_BLOCKS = [
  { slug: "hero-slider", selector: "section.wpo-hero-slider", position: 10 },
  { slug: "hero-date", selector: "section.wpo-hero-wedding-date", position: 20 },
  { slug: "couple", selector: "section#couple", position: 30 },
  { slug: "video", selector: "section.wpo-video-section", position: 40 },
  { slug: "story", selector: "section#story", position: 50 },
  { slug: "event", selector: "section#event", position: 60 },
  { slug: "rsvp", selector: "section#rsvp", position: 70 },
  { slug: "blog", selector: "section.wpo-blog-section", position: 80 },
  { slug: "footer", selector: "footer.wpo-site-footer-s2", position: 90 },
];

const DEFAULT_MEDIA: Array<{ collection: string; selector: string; attribute?: string }> = [
  { collection: "hero_slider", selector: ".wpo-hero-slider .swiper-slide .slide-inner", attribute: "data-background" },
  { collection: "blog_posts", selector: ".wpo-blog-section .wpo-blog-img img", attribute: "src" },
  { collection: "rsvp_images", selector: "#rsvp .contact-img img", attribute: "src" },
];

const STRUCTURED_BLOCK_SLUGS = new Set(["couple", "hero-date"]);

const DEFAULT_COUPLE: Omit<CoupleSection, "locale"> = {
  left_name: "Robert Peter",
  left_bio:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna orci auctor vitae nisl. Erat fringilla pellentesque amet tempus. Commodo mi vitae, sagittis blandit.",
  left_icon_url: "/template-assets/images/html/tf/habibi/assets/images/couple/vector-1.svg",
  left_facebook_url: "#",
  left_twitter_url: "#",
  left_instagram_url: "#",
  right_name: "Jane Margrate",
  right_bio:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna orci auctor vitae nisl. Erat fringilla pellentesque amet tempus. Commodo mi vitae, sagittis blandit.",
  right_icon_url: "/template-assets/images/html/tf/habibi/assets/images/couple/vector-2.svg",
  right_facebook_url: "#",
  right_twitter_url: "#",
  right_instagram_url: "#",
  center_photo_url: "/template-assets/images/html/tf/habibi/assets/images/couple/3.jpg",
  center_overlay_url: "/template-assets/images/html/tf/habibi/assets/images/couple/couple-flower.png",
};

const DEFAULT_EVENT: Omit<EventSection, "locale"> = {
  eyebrow: "Our Wedding",
  heading: "When & Where",
  items: [
    {
      title: "The Reception",
      image_url: "/template-assets/images/html/tf/habibi/assets/images/event/4.jpg",
      time: "1:00 PM - 2:30 PM",
      address: "4517 Washington Ave. Manchester, Kentucky 39495",
      map_url: null,
      is_visible: true,
    },
    {
      title: "The Ceremony",
      image_url: "/template-assets/images/html/tf/habibi/assets/images/event/5.jpg",
      time: "1:00 PM - 2:30 PM",
      address: "4517 Washington Ave. Manchester, Kentucky 39495",
      map_url: null,
      is_visible: true,
    },
    {
      title: "The Party",
      image_url: "/template-assets/images/html/tf/habibi/assets/images/event/6.jpg",
      time: "1:00 PM - 2:30 PM",
      address: "4517 Washington Ave. Manchester, Kentucky 39495",
      map_url: null,
      is_visible: true,
    },
  ],
};

async function ensureLocale(locale: Locale) {
  await ensureMetaLocale(locale);
  await ensureMenuLocale(locale);
  await ensureBlocksLocale(locale);
  await ensureCoupleSection(locale);
  await ensureEventSection(locale);
}

async function ensureMetaLocale(locale: Locale) {
  const row = await queryRow<{ locale: string }>("SELECT locale FROM cms_meta_localized WHERE locale = $1", [locale]);
  if (row) {
    return;
  }

  const fallback = await queryRow<CmsMeta>("SELECT * FROM cms_meta_localized WHERE locale = $1", [DEFAULT_LOCALE]);
  if (fallback) {
    await sql`
      INSERT INTO cms_meta_localized (
        locale,
        bride_name,
        groom_name,
        event_date,
        event_location,
        hero_headline,
        hero_subtext,
        hero_shape_url,
        invitation_gate_background_url,
        background_music_url,
        brand_text
      )
      VALUES (
        ${locale},
        ${fallback.bride_name},
        ${fallback.groom_name},
        ${fallback.event_date},
        ${fallback.event_location},
        ${fallback.hero_headline},
        ${fallback.hero_subtext},
        ${fallback.hero_shape_url},
        ${fallback.invitation_gate_background_url},
        ${fallback.background_music_url},
        ${fallback.brand_text}
      )
      ON CONFLICT(locale) DO NOTHING
    `;
    return;
  }

  await sql`
    INSERT INTO cms_meta_localized (
      locale,
      bride_name,
      groom_name,
      event_date,
      event_location,
      hero_headline,
      hero_subtext,
      hero_shape_url,
      invitation_gate_background_url,
      background_music_url,
      brand_text
    )
    VALUES (
      ${locale},
      'Bride',
      'Groom',
      NULL,
      NULL,
      'Save the Date',
      NULL,
      '/template-assets/images/html/tf/habibi/assets/images/wedding-date/1.png',
      '/template-assets/images/html/tf/habibi/assets/images/rsvp/img-3.jpg',
      '/media/perfect.mp3',
      'Habibi'
    )
    ON CONFLICT(locale) DO NOTHING
  `;
}

async function ensureMenuLocale(locale: Locale) {
  const countRow = await queryRow<{ count: string }>("SELECT COUNT(1) as count FROM cms_menu_items WHERE locale = $1", [locale]);
  if (Number(countRow?.count ?? 0) > 0) {
    return;
  }

  const source =
    locale === DEFAULT_LOCALE
      ? DEFAULT_MENU
      : await queryRows<Omit<CmsMenuItem, "id" | "locale">>(
          "SELECT label, href, position, is_visible FROM cms_menu_items WHERE locale = $1 ORDER BY position",
          [DEFAULT_LOCALE]
        );
  const items = source.length ? source : DEFAULT_MENU;
  for (const item of items) {
    await sql`
      INSERT INTO cms_menu_items (label, href, position, is_visible, locale)
      VALUES (${item.label}, ${item.href}, ${item.position}, ${item.is_visible}, ${locale})
      ON CONFLICT(label, href, locale) DO NOTHING
    `;
  }
}

async function ensureBlocksLocale(locale: Locale) {
  const countRow = await queryRow<{ count: string }>("SELECT COUNT(1) as count FROM cms_blocks WHERE locale = $1", [locale]);
  if (Number(countRow?.count ?? 0) > 0) {
    return;
  }

  const { body } = getTemplateMarkup();
  const $ = load(`<body>${body}</body>`);
  for (const block of DEFAULT_BLOCKS) {
    const element = $(block.selector).first();
    if (!element.length) {
      continue;
    }
    const html = (element.html() ?? "").trim();
    await sql`
      INSERT INTO cms_blocks (slug, selector, content_html, position, is_visible, locale)
      VALUES (${block.slug}, ${block.selector}, ${html}, ${block.position}, 1, ${locale})
      ON CONFLICT(slug, locale) DO NOTHING
    `;
  }
}

export async function getCmsPayload(localeInput?: string): Promise<CmsPayload> {
  const locale = normalizeLocale(localeInput);
  await ensureLocale(locale);
  await seedDefaultMedia(locale);

  const meta = await getRawMeta(locale);
  const menu = await queryRows<CmsMenuItem>("SELECT * FROM cms_menu_items WHERE locale = $1 ORDER BY position", [locale]);
  const blocks = await queryRows<CmsBlock>("SELECT * FROM cms_blocks WHERE locale = $1 ORDER BY position", [locale]);
  const grouped = await getSharedMediaMap(locale);

  const couple = await getCoupleSection(locale);
  const event = await getEventSection(locale);
  if (!meta) {
    throw new Error(`Missing CMS meta for locale ${locale}`);
  }
  const sharedMeta = locale === DEFAULT_LOCALE ? meta : await getRawMeta(DEFAULT_LOCALE);
  return {
    meta: {
      ...meta,
      hero_shape_url: sharedMeta?.hero_shape_url ?? meta.hero_shape_url,
      invitation_gate_background_url:
        sharedMeta?.invitation_gate_background_url ?? meta.invitation_gate_background_url,
      background_music_url: sharedMeta?.background_music_url ?? meta.background_music_url,
    },
    menu,
    blocks: filterEditableBlocks(blocks),
    media: grouped,
    couple,
    event,
  };
}

function mergeSharedMediaRows(locale: Locale, sharedRows: CmsMedia[], localeRows: CmsMedia[]) {
  if (locale === DEFAULT_LOCALE || !sharedRows.length) {
    return sharedRows.length ? sharedRows : localeRows;
  }

  return sharedRows.map((sharedRow, index) => {
    const localizedRow = localeRows[index];
    return {
      ...(localizedRow ?? sharedRow),
      image_url: sharedRow.image_url,
      position: sharedRow.position,
      collection: sharedRow.collection,
      locale,
    } satisfies CmsMedia;
  });
}

async function getSharedMediaMap(locale: Locale) {
  const defaultRows = await queryRows<CmsMedia>("SELECT * FROM cms_media WHERE locale = $1 ORDER BY collection, position, id", [DEFAULT_LOCALE]);
  const localeRows =
    locale === DEFAULT_LOCALE
      ? defaultRows
      : await queryRows<CmsMedia>("SELECT * FROM cms_media WHERE locale = $1 ORDER BY collection, position, id", [locale]);

  const defaultByCollection = new Map<string, CmsMedia[]>();
  const localeByCollection = new Map<string, CmsMedia[]>();

  for (const row of defaultRows) {
    const items = defaultByCollection.get(row.collection) ?? [];
    items.push(row);
    defaultByCollection.set(row.collection, items);
  }

  for (const row of localeRows) {
    const items = localeByCollection.get(row.collection) ?? [];
    items.push(row);
    localeByCollection.set(row.collection, items);
  }

  const collections = new Set([...defaultByCollection.keys(), ...localeByCollection.keys()]);
  const grouped: Record<string, CmsMedia[]> = {};
  for (const collection of collections) {
    grouped[collection] = mergeSharedMediaRows(locale, defaultByCollection.get(collection) ?? [], localeByCollection.get(collection) ?? []);
  }

  return grouped;
}

async function getRawMeta(locale: Locale) {
  return queryRow<CmsMeta>(
    "SELECT locale, bride_name, groom_name, event_date, event_location, hero_headline, hero_subtext, hero_shape_url, invitation_gate_background_url, background_music_url, brand_text FROM cms_meta_localized WHERE locale = $1",
    [locale]
  );
}

function filterEditableBlocks(blocks: CmsBlock[]) {
  return blocks.filter((block) => !STRUCTURED_BLOCK_SLUGS.has(block.slug));
}

function assertBlockEditable(slug: string) {
  if (STRUCTURED_BLOCK_SLUGS.has(slug)) {
    throw new Error(`Block '${slug}' is managed by a dedicated editor.`);
  }
}

export async function getCoupleSection(localeInput?: string): Promise<CoupleSection> {
  const locale = normalizeLocale(localeInput);
  await ensureCoupleSection(locale);
  const row = await queryRow<CoupleSection>(
    `SELECT
      locale,
      left_name,
      left_bio,
      left_icon_url,
      left_facebook_url,
      left_twitter_url,
      left_instagram_url,
      right_name,
      right_bio,
      right_icon_url,
      right_facebook_url,
      right_twitter_url,
      right_instagram_url,
      center_photo_url,
      center_overlay_url
    FROM cms_couple_section WHERE locale = $1`,
    [locale]
  );
  if (!row) {
    throw new Error(`Missing couple section for locale ${locale}`);
  }
  if (locale === DEFAULT_LOCALE) {
    return row;
  }

  const shared = await queryRow<CoupleSection>(
    `SELECT
      locale,
      left_name,
      left_bio,
      left_icon_url,
      left_facebook_url,
      left_twitter_url,
      left_instagram_url,
      right_name,
      right_bio,
      right_icon_url,
      right_facebook_url,
      right_twitter_url,
      right_instagram_url,
      center_photo_url,
      center_overlay_url
    FROM cms_couple_section WHERE locale = $1`,
    [DEFAULT_LOCALE]
  );

  return {
    ...row,
    left_icon_url: shared?.left_icon_url ?? row.left_icon_url,
    right_icon_url: shared?.right_icon_url ?? row.right_icon_url,
    center_photo_url: shared?.center_photo_url ?? row.center_photo_url,
    center_overlay_url: shared?.center_overlay_url ?? row.center_overlay_url,
  };
}

export async function updateCoupleSection(localeInput: string | undefined, payload: Partial<CoupleSection>): Promise<CoupleSection> {
  const locale = normalizeLocale(localeInput);
  await ensureCoupleSection(locale);
  const allowedKeys: Array<keyof CoupleSection> = [
    "left_name",
    "left_bio",
    "left_icon_url",
    "left_facebook_url",
    "left_twitter_url",
    "left_instagram_url",
    "right_name",
    "right_bio",
    "right_icon_url",
    "right_facebook_url",
    "right_twitter_url",
    "right_instagram_url",
    "center_photo_url",
    "center_overlay_url",
  ];
  const sharedKeys: Array<keyof CoupleSection> = ["left_icon_url", "right_icon_url", "center_photo_url", "center_overlay_url"];
  const keys = Object.keys(payload).filter((key) => allowedKeys.includes(key as keyof CoupleSection)) as Array<keyof CoupleSection>;
  const localeKeys = keys.filter((key) => !sharedKeys.includes(key));
  const sharedPayloadKeys = keys.filter((key) => sharedKeys.includes(key));

  if (localeKeys.length) {
    const assignments = localeKeys.map((key, index) => `${key} = $${index + 1}`);
    const values = localeKeys.map((key) => payload[key] ?? null);
    await sql.query(`UPDATE cms_couple_section SET ${assignments.join(", ")}, updated_at = now() WHERE locale = $${values.length + 1}`, [
      ...values,
      locale,
    ]);
  }

  if (sharedPayloadKeys.length) {
    const assignments = sharedPayloadKeys.map((key, index) => `${key} = $${index + 1}`);
    const values = sharedPayloadKeys.map((key) => payload[key] ?? null);
    await sql.query(`UPDATE cms_couple_section SET ${assignments.join(", ")}, updated_at = now() WHERE locale = $${values.length + 1}`, [
      ...values,
      DEFAULT_LOCALE,
    ]);
  }
  return getCoupleSection(locale);
}

export async function getEventSection(localeInput?: string): Promise<EventSection> {
  const locale = normalizeLocale(localeInput);
  await ensureEventSection(locale);
  const row = await queryRow<{ locale: Locale; eyebrow: string; heading: string; items_json: string }>(
    "SELECT locale, eyebrow, heading, items_json FROM cms_event_section WHERE locale = $1",
    [locale]
  );
  if (!row) {
    throw new Error(`Missing event section for locale ${locale}`);
  }
  const items = parseEventItems(row.items_json);
  if (locale === DEFAULT_LOCALE) {
    return {
      locale: row.locale,
      eyebrow: row.eyebrow,
      heading: row.heading,
      items,
    };
  }

  const sharedRow = await queryRow<{ items_json: string }>("SELECT items_json FROM cms_event_section WHERE locale = $1", [DEFAULT_LOCALE]);
  const sharedItems = sharedRow ? parseEventItems(sharedRow.items_json) : [];
  return {
    locale: row.locale,
    eyebrow: row.eyebrow,
    heading: row.heading,
    items: items.map((item, index) => ({
      ...item,
      image_url: sharedItems[index]?.image_url ?? item.image_url,
    })),
  };
}

export async function updateEventSection(
  localeInput: string | undefined,
  payload: Partial<Omit<EventSection, "locale">>
): Promise<EventSection> {
  const locale = normalizeLocale(localeInput);
  await ensureEventSection(locale);
  const data: Record<string, string> = {};
  if (typeof payload.eyebrow === "string") {
    data.eyebrow = payload.eyebrow;
  }
  if (typeof payload.heading === "string") {
    data.heading = payload.heading;
  }
  if (payload.items) {
    const items = payload.items;
    if (locale === DEFAULT_LOCALE) {
      data.items_json = JSON.stringify(items);
    } else {
      const currentLocaleRow = await queryRow<{ items_json: string }>("SELECT items_json FROM cms_event_section WHERE locale = $1", [locale]);
      const currentDefaultRow = await queryRow<{ items_json: string }>("SELECT items_json FROM cms_event_section WHERE locale = $1", [DEFAULT_LOCALE]);
      const localeItems = parseEventItems(currentLocaleRow?.items_json ?? JSON.stringify(DEFAULT_EVENT.items)).map((existing, index) => ({
        ...items[index],
        image_url: existing.image_url,
      }));
      const defaultItems = parseEventItems(currentDefaultRow?.items_json ?? JSON.stringify(DEFAULT_EVENT.items)).map((existing, index) => ({
        ...existing,
        image_url: items[index]?.image_url ?? existing.image_url,
      }));
      data.items_json = JSON.stringify(localeItems);
      await sql.query("UPDATE cms_event_section SET items_json = $1, updated_at = now() WHERE locale = $2", [
        JSON.stringify(defaultItems),
        DEFAULT_LOCALE,
      ]);
    }
  }
  const keys = Object.keys(data);
  if (keys.length) {
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => data[key]);
    await sql.query(
      `UPDATE cms_event_section SET ${assignments.join(", ")}, updated_at = now() WHERE locale = $${values.length + 1}`,
      [...values, locale]
    );
  }
  return getEventSection(locale);
}

export async function updateCmsMeta(localeInput: string | undefined, payload: Partial<CmsMeta>): Promise<CmsMeta> {
  const locale = normalizeLocale(localeInput);
  await ensureMetaLocale(locale);
  const keys = Object.keys(payload).filter((key) => key !== "locale");
  if (!keys.length) {
    const row = await getRawMeta(locale);
    if (!row) {
      throw new Error(`Missing CMS meta for locale ${locale}`);
    }
    if (locale === DEFAULT_LOCALE) {
      return row;
    }
    const shared = await getRawMeta(DEFAULT_LOCALE);
    return {
      ...row,
      hero_shape_url: shared?.hero_shape_url ?? row.hero_shape_url,
      invitation_gate_background_url:
        shared?.invitation_gate_background_url ?? row.invitation_gate_background_url,
      background_music_url: shared?.background_music_url ?? row.background_music_url,
    };
  }
  const sharedKeys: Array<keyof CmsMeta> = ["hero_shape_url", "invitation_gate_background_url", "background_music_url"];
  const localeKeys = keys.filter((key) => !sharedKeys.includes(key as keyof CmsMeta));
  const sharedPayloadKeys = keys.filter((key) => sharedKeys.includes(key as keyof CmsMeta));

  if (localeKeys.length) {
    const assignments = localeKeys.map((key, index) => `${key} = $${index + 1}`);
    const values = localeKeys.map((key) => payload[key as keyof CmsMeta] ?? null);
    await sql.query(`UPDATE cms_meta_localized SET ${assignments.join(", ")}, updated_at = now() WHERE locale = $${values.length + 1}`, [
      ...values,
      locale,
    ]);
  }

  if (sharedPayloadKeys.length) {
    const assignments = sharedPayloadKeys.map((key, index) => `${key} = $${index + 1}`);
    const values = sharedPayloadKeys.map((key) => payload[key as keyof CmsMeta] ?? null);
    await sql.query(`UPDATE cms_meta_localized SET ${assignments.join(", ")}, updated_at = now() WHERE locale = $${values.length + 1}`, [
      ...values,
      DEFAULT_LOCALE,
    ]);
  }

  const updated = await getRawMeta(locale);
  if (!updated) {
    throw new Error(`Missing CMS meta for locale ${locale}`);
  }
  if (locale === DEFAULT_LOCALE) {
    return updated;
  }
  const shared = await getRawMeta(DEFAULT_LOCALE);
  return {
    ...updated,
    hero_shape_url: shared?.hero_shape_url ?? updated.hero_shape_url,
    invitation_gate_background_url:
      shared?.invitation_gate_background_url ?? updated.invitation_gate_background_url,
    background_music_url: shared?.background_music_url ?? updated.background_music_url,
  };
}

export async function listMenu(localeInput?: string): Promise<CmsMenuItem[]> {
  const locale = normalizeLocale(localeInput);
  await ensureMenuLocale(locale);
  return queryRows<CmsMenuItem>("SELECT * FROM cms_menu_items WHERE locale = $1 ORDER BY position", [locale]);
}

export async function createMenuItem(
  localeInput: string | undefined,
  data: { label: string; href: string; position: number; is_visible: number }
): Promise<CmsMenuItem> {
  const locale = normalizeLocale(localeInput);
  await ensureMenuLocale(locale);
  const [created] = await sql`
    INSERT INTO cms_menu_items (label, href, position, is_visible, locale)
    VALUES (${data.label}, ${data.href}, ${data.position}, ${data.is_visible}, ${locale})
    RETURNING *
  `;
  return created as CmsMenuItem;
}

export async function updateMenuItem(
  id: number,
  data: Partial<{ label: string; href: string; position: number; is_visible: number }>
): Promise<CmsMenuItem> {
  const keys = Object.keys(data);
  if (keys.length) {
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => data[key as keyof typeof data]);
    await sql.query(`UPDATE cms_menu_items SET ${assignments.join(", ")} WHERE id = $${values.length + 1}`, [...values, id]);
  }
  const row = await queryRow<CmsMenuItem>("SELECT * FROM cms_menu_items WHERE id = $1", [id]);
  if (!row) {
    throw new Error("Menu item not found");
  }
  return row;
}

export async function deleteMenuItem(id: number): Promise<void> {
  await queryRows("DELETE FROM cms_menu_items WHERE id = $1", [id]);
}

export async function listBlocks(localeInput?: string): Promise<CmsBlock[]> {
  const locale = normalizeLocale(localeInput);
  await ensureBlocksLocale(locale);
  const blocks = await queryRows<CmsBlock>("SELECT * FROM cms_blocks WHERE locale = $1 ORDER BY position", [locale]);
  return filterEditableBlocks(blocks);
}

export async function updateBlock(
  localeInput: string | undefined,
  slug: string,
  data: Partial<Pick<CmsBlock, "content_html" | "selector" | "position" | "is_visible">>
): Promise<CmsBlock> {
  assertBlockEditable(slug);
  const locale = normalizeLocale(localeInput);
  await ensureBlocksLocale(locale);
  const keys = Object.keys(data);
  if (keys.length) {
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => data[key as keyof typeof data]);
    await sql.query(
      `UPDATE cms_blocks SET ${assignments.join(", ")}, updated_at = now() WHERE slug = $${values.length + 1} AND locale = $${
        values.length + 2
      }`,
      [...values, slug, locale]
    );
  }
  const row = await queryRow<CmsBlock>("SELECT * FROM cms_blocks WHERE slug = $1 AND locale = $2", [slug, locale]);
  if (!row) {
    throw new Error("Block not found");
  }
  return row;
}

export async function createBlock(
  localeInput: string | undefined,
  data: { slug: string; selector: string; content_html: string; position?: number; is_visible?: number }
): Promise<CmsBlock> {
  assertBlockEditable(data.slug);
  const locale = normalizeLocale(localeInput);
  await ensureBlocksLocale(locale);
  const [created] = await sql`
    INSERT INTO cms_blocks (slug, selector, content_html, position, is_visible, locale)
    VALUES (${data.slug}, ${data.selector}, ${data.content_html}, ${data.position ?? 0}, ${data.is_visible ?? 1}, ${locale})
    RETURNING *
  `;
  return created as CmsBlock;
}

export async function deleteBlock(localeInput: string | undefined, slug: string): Promise<void> {
  assertBlockEditable(slug);
  const locale = normalizeLocale(localeInput);
  await queryRows("DELETE FROM cms_blocks WHERE slug = $1 AND locale = $2", [slug, locale]);
}

export async function listMedia(collection: string, localeInput?: string): Promise<CmsMedia[]> {
  const locale = normalizeLocale(localeInput);
  const grouped = await getSharedMediaMap(locale);
  return grouped[collection] ?? [];
}

export async function createMedia(entry: {
  collection: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
  position?: number;
  locale?: string;
}): Promise<CmsMedia> {
  const locale = normalizeLocale(entry.locale ?? DEFAULT_LOCALE);
  const createdByLocale = new Map<Locale, CmsMedia>();
  for (const targetLocale of SUPPORTED_LOCALES) {
    const [created] = await sql`
      INSERT INTO cms_media (collection, image_url, title, description, link_url, position, locale, updated_at)
      VALUES (
        ${entry.collection},
        ${entry.image_url},
        ${entry.title ?? null},
        ${entry.description ?? null},
        ${entry.link_url ?? null},
        ${entry.position ?? 0},
        ${targetLocale},
        now()
      )
      RETURNING *
    `;
    createdByLocale.set(targetLocale, created as CmsMedia);
  }
  return createdByLocale.get(locale) ?? createdByLocale.get(DEFAULT_LOCALE)!;
}

export async function updateMedia(id: number, data: Partial<Omit<CmsMedia, "id" | "collection">>): Promise<CmsMedia> {
  const keys = Object.keys(data);
  if (keys.length) {
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => data[key as keyof typeof data]);
    await sql.query(`UPDATE cms_media SET ${assignments.join(", ")}, updated_at = now() WHERE id = $${values.length + 1}`, [
      ...values,
      id,
    ]);
  }
  const row = await queryRow<CmsMedia>("SELECT * FROM cms_media WHERE id = $1", [id]);
  if (!row) {
    throw new Error("Media item not found");
  }
  return row;
}

export async function getMediaById(id: number): Promise<CmsMedia | undefined> {
  return queryRow<CmsMedia>("SELECT * FROM cms_media WHERE id = $1", [id]);
}

export async function deleteMedia(id: number): Promise<void> {
  const current = await getMediaById(id);
  if (!current) {
    return;
  }
  await queryRows("DELETE FROM cms_media WHERE collection = $1 AND image_url = $2 AND position = $3", [
    current.collection,
    current.image_url,
    current.position,
  ]);
}

export async function seedDefaultMedia(locale?: Locale): Promise<void> {
  const targetLocale = locale ?? DEFAULT_LOCALE;
  const collectionHasMedia = async (collection: string) => {
    const existing = await queryRow<{ count: string }>("SELECT COUNT(1) as count FROM cms_media WHERE locale = $1 AND collection = $2", [
      targetLocale,
      collection,
    ]);
    return Number(existing?.count ?? 0) > 0;
  };

  if (targetLocale !== DEFAULT_LOCALE) {
    for (const config of DEFAULT_MEDIA) {
      if (await collectionHasMedia(config.collection)) {
        continue;
      }
      await sql`
        INSERT INTO cms_media (collection, image_url, title, description, link_url, position, locale, created_at, updated_at)
        SELECT collection, image_url, title, description, link_url, position, ${targetLocale}, created_at, updated_at
        FROM cms_media
        WHERE locale = ${DEFAULT_LOCALE} AND collection = ${config.collection}
      `;
    }
  }

  const { body } = getTemplateMarkup();
  const $ = load(`<body>${body}</body>`);
  for (const config of DEFAULT_MEDIA) {
    if (await collectionHasMedia(config.collection)) {
      continue;
    }
    const nodes = $(config.selector);
    for (const [index, element] of nodes.toArray().entries()) {
      const el = $(element);
      let url = config.attribute ? el.attr(config.attribute) : el.attr("src") || "";
      if (url?.startsWith("../")) {
        url = url.replace("../assets", "/template-assets");
      }
      if (!url) {
        continue;
      }
      await sql`
        INSERT INTO cms_media (collection, image_url, position, locale)
        VALUES (${config.collection}, ${url}, ${index * 10}, ${targetLocale})
      `;
    }
  }
}

async function ensureCoupleSection(locale: Locale) {
  const row = await queryRow<{ locale: string }>("SELECT locale FROM cms_couple_section WHERE locale = $1", [locale]);
  if (row) {
    return;
  }
  if (locale !== DEFAULT_LOCALE) {
    const fallback = await queryRow<CoupleSection>("SELECT * FROM cms_couple_section WHERE locale = $1", [DEFAULT_LOCALE]);
    if (fallback) {
      await insertCoupleSection(locale, fallback);
      return;
    }
  }
  await insertCoupleSection(locale, DEFAULT_COUPLE);
}

async function insertCoupleSection(locale: Locale, data: Omit<CoupleSection, "locale">) {
  await sql`
    INSERT INTO cms_couple_section (
      locale,
      left_name,
      left_bio,
      left_icon_url,
      left_facebook_url,
      left_twitter_url,
      left_instagram_url,
      right_name,
      right_bio,
      right_icon_url,
      right_facebook_url,
      right_twitter_url,
      right_instagram_url,
      center_photo_url,
      center_overlay_url
    ) VALUES (
      ${locale},
      ${data.left_name},
      ${data.left_bio},
      ${data.left_icon_url},
      ${data.left_facebook_url},
      ${data.left_twitter_url},
      ${data.left_instagram_url},
      ${data.right_name},
      ${data.right_bio},
      ${data.right_icon_url},
      ${data.right_facebook_url},
      ${data.right_twitter_url},
      ${data.right_instagram_url},
      ${data.center_photo_url},
      ${data.center_overlay_url}
    )
    ON CONFLICT(locale) DO NOTHING
  `;
}

function parseEventItems(value: string): EventItem[] {
  try {
    const parsed = JSON.parse(value) as Array<Partial<EventItem>>;
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((item, index) => ({
        title: item.title ?? DEFAULT_EVENT.items[index]?.title ?? "Event",
        image_url: item.image_url ?? DEFAULT_EVENT.items[index]?.image_url ?? "",
        time: item.time ?? DEFAULT_EVENT.items[index]?.time ?? "",
        address: item.address ?? DEFAULT_EVENT.items[index]?.address ?? "",
        map_url: item.map_url ?? null,
        is_visible: item.is_visible ?? true,
      }));
    }
  } catch {
    // Fall back to defaults below.
  }
  return DEFAULT_EVENT.items;
}

async function ensureEventSection(locale: Locale) {
  const row = await queryRow<{ locale: string }>("SELECT locale FROM cms_event_section WHERE locale = $1", [locale]);
  if (row) {
    return;
  }
  if (locale !== DEFAULT_LOCALE) {
    const fallback = await queryRow<{ eyebrow: string; heading: string; items_json: string }>(
      "SELECT eyebrow, heading, items_json FROM cms_event_section WHERE locale = $1",
      [DEFAULT_LOCALE]
    );
    if (fallback) {
      await sql`
        INSERT INTO cms_event_section (locale, eyebrow, heading, items_json)
        VALUES (${locale}, ${fallback.eyebrow}, ${fallback.heading}, ${fallback.items_json})
        ON CONFLICT(locale) DO NOTHING
      `;
      return;
    }
  }
  await sql`
    INSERT INTO cms_event_section (locale, eyebrow, heading, items_json)
    VALUES (${locale}, ${DEFAULT_EVENT.eyebrow}, ${DEFAULT_EVENT.heading}, ${JSON.stringify(DEFAULT_EVENT.items)})
    ON CONFLICT(locale) DO NOTHING
  `;
}
