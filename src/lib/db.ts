import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

type SQLiteInstance = Database.Database;

let db: SQLiteInstance | null = null;

function ensureDatabaseDir(): string {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function tableExists(instance: SQLiteInstance, name: string) {
  const row = instance
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(name) as { name: string } | undefined;
  return Boolean(row);
}

function columnExists(instance: SQLiteInstance, table: string, column: string) {
  const row = instance
    .prepare(`SELECT name FROM pragma_table_info('${table}') WHERE name = ?`)
    .get(column) as { name: string } | undefined;
  return Boolean(row);
}

function columnIsNotNull(instance: SQLiteInstance, table: string, column: string) {
  const row = instance
    .prepare(`SELECT "notnull" FROM pragma_table_info('${table}') WHERE name = ?`)
    .get(column) as { notnull: 0 | 1 } | undefined;
  return row?.notnull === 1;
}

function hasMenuUniqueScopedByLocale(instance: SQLiteInstance) {
  const indexes = instance.prepare(`PRAGMA index_list('cms_menu_items')`).all() as Array<{ name: string; unique: 0 | 1 }>;
  for (const index of indexes) {
    if (index.unique !== 1) {
      continue;
    }
    const columns = instance.prepare(`PRAGMA index_info('${index.name}')`).all() as Array<{ name: string }>;
    const names = columns.map((column) => column.name);
    if (names.length === 3 && names.includes("label") && names.includes("href") && names.includes("locale")) {
      return true;
    }
  }
  return false;
}

function rebuildMenuTableWithLocaleUnique(instance: SQLiteInstance) {
  instance.exec(`
    CREATE TABLE IF NOT EXISTS cms_menu_items_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      locale TEXT NOT NULL DEFAULT 'en',
      UNIQUE(label, href, locale)
    )
  `);
  instance.exec(`
    INSERT INTO cms_menu_items_new (id, label, href, position, is_visible, locale)
    SELECT id, label, href, position, is_visible, COALESCE(locale, 'en') FROM cms_menu_items
  `);
  instance.exec(`DROP TABLE cms_menu_items`);
  instance.exec(`ALTER TABLE cms_menu_items_new RENAME TO cms_menu_items`);
  instance.exec(`CREATE INDEX IF NOT EXISTS idx_cms_menu_locale ON cms_menu_items(locale)`);
}

function initialize(): SQLiteInstance {
  const dbPath = path.join(ensureDatabaseDir(), "rsvps.sqlite");
  const instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NULL,
      attending INTEGER NOT NULL,
      guest_count INTEGER NOT NULL,
      what TEXT NULL,
      meal TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  if (!columnExists(instance, "rsvps", "phone")) {
    instance.exec(`ALTER TABLE rsvps ADD COLUMN phone TEXT NULL`);
  }
  instance.exec(`
    CREATE TABLE IF NOT EXISTS cms_menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      locale TEXT NOT NULL DEFAULT 'en',
      UNIQUE(label, href, locale)
    )
  `);
  instance.exec(`
    CREATE TABLE IF NOT EXISTS cms_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      selector TEXT NOT NULL,
      content_html TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  if (!columnExists(instance, "cms_menu_items", "locale")) {
    instance.exec(`ALTER TABLE cms_menu_items ADD COLUMN locale TEXT NOT NULL DEFAULT 'en'`);
    instance.exec(`CREATE INDEX IF NOT EXISTS idx_cms_menu_locale ON cms_menu_items(locale)`);
  }
  if (!hasMenuUniqueScopedByLocale(instance)) {
    rebuildMenuTableWithLocaleUnique(instance);
  }
  const cmsBlocksHasVisible = columnExists(instance, "cms_blocks", "is_visible");
  if (!columnExists(instance, "cms_blocks", "locale")) {
    instance.exec(`
      CREATE TABLE IF NOT EXISTS cms_blocks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        selector TEXT NOT NULL,
        content_html TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        is_visible INTEGER NOT NULL DEFAULT 1,
        locale TEXT NOT NULL DEFAULT 'en',
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(slug, locale)
      )
    `);
    const visibleSelect = cmsBlocksHasVisible ? "COALESCE(is_visible, 1)" : "1";
    instance.exec(`
      INSERT INTO cms_blocks_new (slug, selector, content_html, position, is_visible, locale, updated_at)
      SELECT slug, selector, content_html, position, ${visibleSelect}, 'en', updated_at FROM cms_blocks
    `);
    instance.exec(`DROP TABLE cms_blocks`);
    instance.exec(`ALTER TABLE cms_blocks_new RENAME TO cms_blocks`);
    instance.exec(`CREATE INDEX IF NOT EXISTS idx_cms_blocks_locale ON cms_blocks(locale)`);
  }
  if (!columnExists(instance, "cms_blocks", "is_visible")) {
    instance.exec(`ALTER TABLE cms_blocks ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1`);
  }
  if (!tableExists(instance, "cms_meta_localized")) {
    instance.exec(`
      CREATE TABLE IF NOT EXISTS cms_meta_localized (
        locale TEXT PRIMARY KEY,
        bride_name TEXT NOT NULL,
        groom_name TEXT NOT NULL,
        event_date TEXT,
        event_location TEXT,
        hero_headline TEXT,
        hero_subtext TEXT,
        brand_text TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    instance.exec(`
      INSERT INTO cms_meta_localized (locale, bride_name, groom_name, event_date, event_location, hero_headline, hero_subtext, brand_text)
      VALUES ('en', 'Jane', 'Peter', 'November 15, 2026', 'Yerevan, Armenia', 'Save the Date', 'We Are Getting Married November 15, 2026', 'Habibi')
      ON CONFLICT(locale) DO NOTHING
    `);
  }
  instance.exec(`
    CREATE TABLE IF NOT EXISTS cms_couple_section (
      locale TEXT PRIMARY KEY,
      left_name TEXT NOT NULL,
      left_bio TEXT,
      left_icon_url TEXT,
      left_facebook_url TEXT,
      left_twitter_url TEXT,
      left_instagram_url TEXT,
      right_name TEXT NOT NULL,
      right_bio TEXT,
      right_icon_url TEXT,
      right_facebook_url TEXT,
      right_twitter_url TEXT,
      right_instagram_url TEXT,
      center_photo_url TEXT,
      center_overlay_url TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  if (
    columnIsNotNull(instance, "cms_couple_section", "left_bio") ||
    columnIsNotNull(instance, "cms_couple_section", "right_bio")
  ) {
    instance.exec(`
      CREATE TABLE IF NOT EXISTS cms_couple_section_new (
        locale TEXT PRIMARY KEY,
        left_name TEXT NOT NULL,
        left_bio TEXT,
        left_icon_url TEXT,
        left_facebook_url TEXT,
        left_twitter_url TEXT,
        left_instagram_url TEXT,
        right_name TEXT NOT NULL,
        right_bio TEXT,
        right_icon_url TEXT,
        right_facebook_url TEXT,
        right_twitter_url TEXT,
        right_instagram_url TEXT,
        center_photo_url TEXT,
        center_overlay_url TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    instance.exec(`
      INSERT INTO cms_couple_section_new (
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
        center_overlay_url,
        updated_at
      )
      SELECT
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
        center_overlay_url,
        updated_at
      FROM cms_couple_section
    `);
    instance.exec(`DROP TABLE cms_couple_section`);
    instance.exec(`ALTER TABLE cms_couple_section_new RENAME TO cms_couple_section`);
  }
  instance.exec(`
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
      'en',
      'Robert Peter',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna orci auctor vitae nisl. Erat fringilla pellentesque amet tempus. Commodo mi vitae, sagittis blandit.',
      '/template-assets/images/html/tf/habibi/assets/images/couple/vector-1.svg',
      '#',
      '#',
      '#',
      'Jane Margrate',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna orci auctor vitae nisl. Erat fringilla pellentesque amet tempus. Commodo mi vitae, sagittis blandit.',
      '/template-assets/images/html/tf/habibi/assets/images/couple/vector-2.svg',
      '#',
      '#',
      '#',
      '/template-assets/images/html/tf/habibi/assets/images/couple/3.jpg',
      '/template-assets/images/html/tf/habibi/assets/images/couple/couple-flower.png'
    )
    ON CONFLICT(locale) DO NOTHING
  `);
  instance.exec(`
    CREATE TABLE IF NOT EXISTS cms_event_section (
      locale TEXT PRIMARY KEY,
      eyebrow TEXT NOT NULL,
      heading TEXT NOT NULL,
      items_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  instance.exec(`
    INSERT INTO cms_event_section (locale, eyebrow, heading, items_json)
    VALUES (
      'en',
      'Our Wedding',
      'When & Where',
      '[{"title":"The Reception","image_url":"/template-assets/images/html/tf/habibi/assets/images/event/4.jpg","time":"1:00 PM - 2:30 PM","address":"4517 Washington Ave. Manchester, Kentucky 39495","map_url":null,"is_visible":true},{"title":"The Ceremony","image_url":"/template-assets/images/html/tf/habibi/assets/images/event/5.jpg","time":"1:00 PM - 2:30 PM","address":"4517 Washington Ave. Manchester, Kentucky 39495","map_url":null,"is_visible":true},{"title":"The Party","image_url":"/template-assets/images/html/tf/habibi/assets/images/event/6.jpg","time":"1:00 PM - 2:30 PM","address":"4517 Washington Ave. Manchester, Kentucky 39495","map_url":null,"is_visible":true}]'
    )
    ON CONFLICT(locale) DO NOTHING
  `);
  instance.exec(`
    CREATE TABLE IF NOT EXISTS cms_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection TEXT NOT NULL,
      image_url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      link_url TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      locale TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  instance.exec(`
    CREATE TABLE IF NOT EXISTS invitees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      locale TEXT NOT NULL DEFAULT 'en',
      invite_code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      attending INTEGER,
      guest_count INTEGER,
      response_note TEXT,
      responded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  instance.exec(`CREATE INDEX IF NOT EXISTS idx_invitees_status ON invitees(status)`);
  instance.exec(`CREATE INDEX IF NOT EXISTS idx_invitees_locale ON invitees(locale)`);
  instance.exec(`
    CREATE TABLE IF NOT EXISTS cms_media_collections (
      collection TEXT PRIMARY KEY,
      label TEXT NOT NULL
    )
  `);
  instance.exec(`
    INSERT INTO cms_media_collections (collection, label) VALUES
      ('hero_slider', 'Hero Slider'),
      ('blog_posts', 'Blog Posts'),
      ('rsvp_images', 'RSVP Form Images')
    ON CONFLICT(collection) DO NOTHING
  `);
  instance.exec(`CREATE INDEX IF NOT EXISTS idx_cms_media_collection_locale ON cms_media(collection, locale)`);

  return instance;
}

export function getDb(): SQLiteInstance {
  if (!db) {
    db = initialize();
  }
  return db;
}
