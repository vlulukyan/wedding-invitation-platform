import { load } from "cheerio";

import { getDb } from "@/lib/db";
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

function ensureLocale(locale: Locale) {
  ensureMetaLocale(locale);
  ensureMenuLocale(locale);
  ensureBlocksLocale(locale);
  ensureCoupleSection(locale);
  ensureEventSection(locale);
}

function ensureMetaLocale(locale: Locale) {
  const db = getDb();
  const row = db.prepare('SELECT locale FROM cms_meta_localized WHERE locale = ?').get(locale) as { locale: string } | undefined;
  if (row) {
    return;
  }
  const fallback = db
    .prepare('SELECT * FROM cms_meta_localized WHERE locale = ?')
    .get(DEFAULT_LOCALE) as CmsMeta | undefined;
  if (fallback) {
    const { locale: _ignoredLocale, ...fallbackData } = fallback;
    db.prepare(
      `INSERT INTO cms_meta_localized (locale, bride_name, groom_name, event_date, event_location, hero_headline, hero_subtext, brand_text)
       VALUES (@locale, @bride_name, @groom_name, @event_date, @event_location, @hero_headline, @hero_subtext, @brand_text)`
    ).run({ locale, ...fallbackData });
  } else {
    db.prepare(
      `INSERT INTO cms_meta_localized (locale, bride_name, groom_name, event_date, event_location, hero_headline, hero_subtext, brand_text)
       VALUES (@locale, 'Bride', 'Groom', NULL, NULL, 'Save the Date', NULL, 'Habibi')`
    ).run({ locale });
  }
}

function ensureMenuLocale(locale: Locale) {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(1) as count FROM cms_menu_items WHERE locale = ?').get(locale) as { count: number };
  if (countRow.count > 0) {
    return;
  }
  if (locale === DEFAULT_LOCALE) {
    const stmt = db.prepare(
      `INSERT INTO cms_menu_items (label, href, position, is_visible, locale) VALUES (@label, @href, @position, @is_visible, @locale)`
    );
    const insertMany = db.transaction(() => {
      for (const item of DEFAULT_MENU) {
        stmt.run({ ...item, locale: DEFAULT_LOCALE });
      }
    });
    insertMany();
    return;
  }
  const fallback = db
    .prepare('SELECT label, href, position, is_visible FROM cms_menu_items WHERE locale = ? ORDER BY position')
    .all(DEFAULT_LOCALE) as Array<Omit<CmsMenuItem, 'id' | 'locale'>>;
  const stmt = db.prepare(
    `INSERT INTO cms_menu_items (label, href, position, is_visible, locale) VALUES (@label, @href, @position, @is_visible, @locale)`
  );
  const insertMany = db.transaction(() => {
    for (const item of fallback) {
      stmt.run({ ...item, locale });
    }
  });
  insertMany();
}

function ensureBlocksLocale(locale: Locale) {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(1) as count FROM cms_blocks WHERE locale = ?').get(locale) as { count: number };
  if (countRow.count > 0) {
    return;
  }
  const { body } = getTemplateMarkup();
  const $ = load(`<body>${body}</body>`);
  const stmt = db.prepare(
    `INSERT INTO cms_blocks (slug, selector, content_html, position, is_visible, locale) VALUES (@slug, @selector, @content_html, @position, 1, @locale)`
  );
  const insertMany = db.transaction(() => {
    for (const block of DEFAULT_BLOCKS) {
      const element = $(block.selector).first();
      if (!element.length) {
        continue;
      }
      const html = element.html() ?? '';
      stmt.run({
        slug: block.slug,
        selector: block.selector,
        content_html: html.trim(),
        position: block.position,
        locale,
      });
    }
  });
  insertMany();
}

export function getCmsPayload(localeInput?: string): CmsPayload {
  const locale = normalizeLocale(localeInput);
  ensureLocale(locale);
  seedDefaultMedia(locale);
  const db = getDb();
  const meta = db
    .prepare(
      'SELECT locale, bride_name, groom_name, event_date, event_location, hero_headline, hero_subtext, brand_text FROM cms_meta_localized WHERE locale = ?'
    )
    .get(locale) as CmsMeta;
  const menu = db
    .prepare('SELECT * FROM cms_menu_items WHERE locale = ? ORDER BY position')
    .all(locale) as CmsMenuItem[];
  const blocks = db
    .prepare('SELECT * FROM cms_blocks WHERE locale = ? ORDER BY position')
    .all(locale) as CmsBlock[];
  const mediaEntries = db
    .prepare('SELECT * FROM cms_media WHERE locale = ? ORDER BY collection, position, id')
    .all(locale) as CmsMedia[];
  const grouped: Record<string, CmsMedia[]> = {};
  for (const entry of mediaEntries) {
    if (!grouped[entry.collection]) {
      grouped[entry.collection] = [];
    }
    grouped[entry.collection].push(entry);
  }
  const couple = getCoupleSection(locale);
  const event = getEventSection(locale);
  return { meta, menu, blocks: filterEditableBlocks(blocks), media: grouped, couple, event };
}

function filterEditableBlocks(blocks: CmsBlock[]) {
  return blocks.filter((block) => !STRUCTURED_BLOCK_SLUGS.has(block.slug));
}

function assertBlockEditable(slug: string) {
  if (STRUCTURED_BLOCK_SLUGS.has(slug)) {
    throw new Error(`Block '${slug}' is managed by a dedicated editor.`);
  }
}

export function getCoupleSection(localeInput?: string): CoupleSection {
  const locale = normalizeLocale(localeInput);
  ensureCoupleSection(locale);
  return getDb()
    .prepare(
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
      FROM cms_couple_section WHERE locale = ?`
    )
    .get(locale) as CoupleSection;
}

export function updateCoupleSection(localeInput: string | undefined, payload: Partial<CoupleSection>): CoupleSection {
  const locale = normalizeLocale(localeInput);
  ensureCoupleSection(locale);
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
  const keys = Object.keys(payload).filter((key) => allowedKeys.includes(key as keyof CoupleSection));
  if (keys.length) {
    const assignments = keys.map((key) => `${key} = @${key}`);
    getDb()
      .prepare(`UPDATE cms_couple_section SET ${assignments.join(", ")}, updated_at = datetime('now') WHERE locale = @locale`)
      .run({ ...payload, locale });
  }
  return getCoupleSection(locale);
}

export function getEventSection(localeInput?: string): EventSection {
  const locale = normalizeLocale(localeInput);
  ensureEventSection(locale);
  const row = getDb()
    .prepare("SELECT locale, eyebrow, heading, items_json FROM cms_event_section WHERE locale = ?")
    .get(locale) as { locale: Locale; eyebrow: string; heading: string; items_json: string };
  return {
    locale: row.locale,
    eyebrow: row.eyebrow,
    heading: row.heading,
    items: parseEventItems(row.items_json),
  };
}

export function updateEventSection(localeInput: string | undefined, payload: Partial<Omit<EventSection, "locale">>): EventSection {
  const locale = normalizeLocale(localeInput);
  ensureEventSection(locale);
  const data: Record<string, string> = {};
  if (typeof payload.eyebrow === "string") {
    data.eyebrow = payload.eyebrow;
  }
  if (typeof payload.heading === "string") {
    data.heading = payload.heading;
  }
  if (payload.items) {
    data.items_json = JSON.stringify(payload.items);
  }
  const keys = Object.keys(data);
  if (keys.length) {
    const assignments = keys.map((key) => `${key} = @${key}`);
    getDb()
      .prepare(`UPDATE cms_event_section SET ${assignments.join(", ")}, updated_at = datetime('now') WHERE locale = @locale`)
      .run({ ...data, locale });
  }
  return getEventSection(locale);
}

export function updateCmsMeta(localeInput: string | undefined, payload: Partial<CmsMeta>): CmsMeta {
  const locale = normalizeLocale(localeInput);
  ensureMetaLocale(locale);
  const db = getDb();
  const keys = Object.keys(payload).filter((key) => key !== 'locale');
  if (!keys.length) {
    return db
      .prepare(
        'SELECT locale, bride_name, groom_name, event_date, event_location, hero_headline, hero_subtext, brand_text FROM cms_meta_localized WHERE locale = ?'
      )
      .get(locale) as CmsMeta;
  }
  const assignments = keys.map((key) => `${key} = @${key}`);
  db.prepare(
    `UPDATE cms_meta_localized SET ${assignments.join(', ')}, updated_at = datetime('now') WHERE locale = @locale`
  ).run({ ...payload, locale });
  return db
    .prepare(
      'SELECT locale, bride_name, groom_name, event_date, event_location, hero_headline, hero_subtext, brand_text FROM cms_meta_localized WHERE locale = ?'
    )
    .get(locale) as CmsMeta;
}

export function listMenu(localeInput?: string): CmsMenuItem[] {
  const locale = normalizeLocale(localeInput);
  ensureMenuLocale(locale);
  return getDb()
    .prepare('SELECT * FROM cms_menu_items WHERE locale = ? ORDER BY position')
    .all(locale) as CmsMenuItem[];
}

export function createMenuItem(localeInput: string | undefined, data: { label: string; href: string; position: number; is_visible: number }): CmsMenuItem {
  const locale = normalizeLocale(localeInput);
  ensureMenuLocale(locale);
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO cms_menu_items (label, href, position, is_visible, locale) VALUES (@label, @href, @position, @is_visible, @locale)`
    )
    .run({ ...data, locale });
  return db.prepare('SELECT * FROM cms_menu_items WHERE id = ?').get(result.lastInsertRowid) as CmsMenuItem;
}

export function updateMenuItem(id: number, data: Partial<{ label: string; href: string; position: number; is_visible: number }>): CmsMenuItem {
  const db = getDb();
  const keys = Object.keys(data);
  if (!keys.length) {
    return db.prepare('SELECT * FROM cms_menu_items WHERE id = ?').get(id) as CmsMenuItem;
  }
  const assignments = keys.map((key) => `${key} = @${key}`);
  db.prepare(`UPDATE cms_menu_items SET ${assignments.join(', ')}, position = COALESCE(@position, position) WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM cms_menu_items WHERE id = ?').get(id) as CmsMenuItem;
}

export function deleteMenuItem(id: number): void {
  getDb().prepare('DELETE FROM cms_menu_items WHERE id = ?').run(id);
}

export function listBlocks(localeInput?: string): CmsBlock[] {
  const locale = normalizeLocale(localeInput);
  ensureBlocksLocale(locale);
  const blocks = getDb().prepare('SELECT * FROM cms_blocks WHERE locale = ? ORDER BY position').all(locale) as CmsBlock[];
  return filterEditableBlocks(blocks);
}

export function updateBlock(localeInput: string | undefined, slug: string, data: Partial<Pick<CmsBlock, 'content_html' | 'selector' | 'position' | 'is_visible'>>): CmsBlock {
  assertBlockEditable(slug);
  const locale = normalizeLocale(localeInput);
  ensureBlocksLocale(locale);
  const db = getDb();
  const keys = Object.keys(data);
  if (!keys.length) {
    return db.prepare('SELECT * FROM cms_blocks WHERE slug = ? AND locale = ?').get(slug, locale) as CmsBlock;
  }
  const assignments = keys.map((key) => `${key} = @${key}`);
  db.prepare(
    `UPDATE cms_blocks SET ${assignments.join(', ')}, updated_at = datetime('now') WHERE slug = @slug AND locale = @locale`
  ).run({ ...data, slug, locale });
  return db.prepare('SELECT * FROM cms_blocks WHERE slug = ? AND locale = ?').get(slug, locale) as CmsBlock;
}

export function createBlock(localeInput: string | undefined, data: { slug: string; selector: string; content_html: string; position?: number; is_visible?: number }): CmsBlock {
  assertBlockEditable(data.slug);
  const locale = normalizeLocale(localeInput);
  ensureBlocksLocale(locale);
  const db = getDb();
  db.prepare(
    `INSERT INTO cms_blocks (slug, selector, content_html, position, is_visible, locale) VALUES (@slug, @selector, @content_html, COALESCE(@position, 0), COALESCE(@is_visible, 1), @locale)`
  ).run({ ...data, locale });
  return db.prepare('SELECT * FROM cms_blocks WHERE slug = ? AND locale = ?').get(data.slug, locale) as CmsBlock;
}

export function deleteBlock(localeInput: string | undefined, slug: string): void {
  assertBlockEditable(slug);
  const locale = normalizeLocale(localeInput);
  getDb().prepare('DELETE FROM cms_blocks WHERE slug = ? AND locale = ?').run(slug, locale);
}

export function listMedia(collection: string, localeInput?: string): CmsMedia[] {
  const locale = normalizeLocale(localeInput);
  const db = getDb();
  return db
    .prepare('SELECT * FROM cms_media WHERE collection = ? AND locale = ? ORDER BY position, id')
    .all(collection, locale) as CmsMedia[];
}

export function createMedia(entry: {
  collection: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
  position?: number;
  locale?: string;
}): CmsMedia {
  const locale = normalizeLocale(entry.locale ?? DEFAULT_LOCALE);
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO cms_media (collection, image_url, title, description, link_url, position, locale, updated_at)
       VALUES (@collection, @image_url, @title, @description, @link_url, COALESCE(@position, 0), @locale, datetime('now'))`
    )
    .run({ ...entry, locale });
  return db.prepare('SELECT * FROM cms_media WHERE id = ?').get(result.lastInsertRowid) as CmsMedia;
}

export function updateMedia(id: number, data: Partial<Omit<CmsMedia, 'id' | 'collection'>>): CmsMedia {
  const keys = Object.keys(data);
  if (!keys.length) {
    return getDb().prepare('SELECT * FROM cms_media WHERE id = ?').get(id) as CmsMedia;
  }
  const assignments = keys.map((key) => `${key} = @${key}`);
  getDb()
    .prepare(`UPDATE cms_media SET ${assignments.join(', ')}, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...data, id });
  return getDb().prepare('SELECT * FROM cms_media WHERE id = ?').get(id) as CmsMedia;
}

export function deleteMedia(id: number): void {
  getDb().prepare('DELETE FROM cms_media WHERE id = ?').run(id);
}

export function seedDefaultMedia(locale?: Locale) {
  const targetLocale = locale ?? DEFAULT_LOCALE;
  const db = getDb();
  const collectionHasMedia = (collection: string) => {
    const existing = db
      .prepare('SELECT COUNT(1) as count FROM cms_media WHERE locale = ? AND collection = ?')
      .get(targetLocale, collection) as { count: number };
    return existing.count > 0;
  };

  if (targetLocale !== DEFAULT_LOCALE) {
    for (const config of DEFAULT_MEDIA) {
      if (collectionHasMedia(config.collection)) {
        continue;
      }
      db.prepare(
        `INSERT INTO cms_media (collection, image_url, title, description, link_url, position, locale, created_at, updated_at)
         SELECT collection, image_url, title, description, link_url, position, @locale, created_at, updated_at
         FROM cms_media WHERE locale = @source AND collection = @collection`
      ).run({ locale: targetLocale, source: DEFAULT_LOCALE, collection: config.collection });
    }
  }

  const { body } = getTemplateMarkup();
  const $ = load(`<body>${body}</body>`);
  const stmt = db.prepare(
    `INSERT INTO cms_media (collection, image_url, position, locale) VALUES (@collection, @image_url, @position, @locale)`
  );
  const insertMany = db.transaction(() => {
    for (const config of DEFAULT_MEDIA) {
      if (collectionHasMedia(config.collection)) {
        continue;
      }
      const nodes = $(config.selector);
      nodes.each((index, element) => {
        const el = $(element);
        let url = config.attribute ? el.attr(config.attribute) : el.attr('src') || '';
        if (url?.startsWith('../')) {
          url = url.replace('../assets', '/template-assets');
        }
        if (!url) {
          return;
        }
        stmt.run({ collection: config.collection, image_url: url, position: index * 10, locale: targetLocale });
      });
    }
  });
  insertMany();
}

function ensureCoupleSection(locale: Locale) {
  const db = getDb();
  const row = db.prepare('SELECT locale FROM cms_couple_section WHERE locale = ?').get(locale) as { locale: string } | undefined;
  if (row) {
    return;
  }
  if (locale !== DEFAULT_LOCALE) {
    const fallback = db
      .prepare('SELECT * FROM cms_couple_section WHERE locale = ?')
      .get(DEFAULT_LOCALE) as CoupleSection | undefined;
    if (fallback) {
      db.prepare(
        `INSERT INTO cms_couple_section (
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
          @locale,
          @left_name,
          @left_bio,
          @left_icon_url,
          @left_facebook_url,
          @left_twitter_url,
          @left_instagram_url,
          @right_name,
          @right_bio,
          @right_icon_url,
          @right_facebook_url,
          @right_twitter_url,
          @right_instagram_url,
          @center_photo_url,
          @center_overlay_url
        )`
      ).run({ ...fallback, locale });
      return;
    }
  }
  db.prepare(
    `INSERT INTO cms_couple_section (
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
      @locale,
      @left_name,
      @left_bio,
      @left_icon_url,
      @left_facebook_url,
      @left_twitter_url,
      @left_instagram_url,
      @right_name,
      @right_bio,
      @right_icon_url,
      @right_facebook_url,
      @right_twitter_url,
      @right_instagram_url,
      @center_photo_url,
      @center_overlay_url
    )`
  ).run({ locale, ...DEFAULT_COUPLE });
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

function ensureEventSection(locale: Locale) {
  const db = getDb();
  const row = db.prepare("SELECT locale FROM cms_event_section WHERE locale = ?").get(locale) as { locale: string } | undefined;
  if (row) {
    return;
  }
  if (locale !== DEFAULT_LOCALE) {
    const fallback = db
      .prepare("SELECT eyebrow, heading, items_json FROM cms_event_section WHERE locale = ?")
      .get(DEFAULT_LOCALE) as { eyebrow: string; heading: string; items_json: string } | undefined;
    if (fallback) {
      db.prepare(
        `INSERT INTO cms_event_section (locale, eyebrow, heading, items_json)
         VALUES (@locale, @eyebrow, @heading, @items_json)`
      ).run({ ...fallback, locale });
      return;
    }
  }
  db.prepare(
    `INSERT INTO cms_event_section (locale, eyebrow, heading, items_json)
     VALUES (@locale, @eyebrow, @heading, @items_json)`
  ).run({
    locale,
    eyebrow: DEFAULT_EVENT.eyebrow,
    heading: DEFAULT_EVENT.heading,
    items_json: JSON.stringify(DEFAULT_EVENT.items),
  });
}
