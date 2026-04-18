# Are You Attending CMS

Modernizes the scraped Habibi wedding template into a localized, CMS-driven Next.js site with RSVP collection, email notifications, background music, media uploads, and an invitee manager.

## Prerequisites

1. **Node.js 18.x** (matches the locked Next.js toolchain)
2. **Netlify account + Netlify CLI** for deployment, database, and blob storage
3. Configure `.env.local`:
   ```env
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   SMTP_SECURE=false
   RSVP_FROM_EMAIL=
   RSVP_NOTIFY_EMAIL=
   ADMIN_PASSWORD=choose-a-strong-password
   NETLIFY_DATABASE_URL=
   ```
   Netlify creates `NETLIFY_DATABASE_URL` when you initialize the database.
4. Install deps once:
   ```bash
   npm install
   ```

## Running the app

```bash
npm run dev
```

Visit <http://localhost:3000>. The page is rendered on each request (`dynamic = "force-dynamic"`), so CMS edits appear immediately.

For local testing with Netlify services, use:

```bash
npx netlify dev
```

## Netlify deployment

The app now uses Netlify instead of Firebase/local SQLite for production persistence:

- **Netlify Database / Neon Postgres** stores CMS content, RSVP submissions, invitees, event data, menu items, and media records.
- **Netlify Blobs** stores uploaded admin images.
- Uploaded image URLs are served through `/api/uploads/...`.

Create and connect the Netlify database once:

```bash
npx netlify db init
```

Then set the normal environment variables in Netlify:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
RSVP_FROM_EMAIL=
RSVP_NOTIFY_EMAIL=
ADMIN_PASSWORD=
```

`NETLIFY_DATABASE_URL` should be created by Netlify DB. Do not commit the real value.

### Admin dashboard

- Navigate to <http://localhost:3000/admin/login>
- Enter the `ADMIN_PASSWORD`
- Use the locale switcher (English, Armenian, German) to edit copies per language. Menu entries, hero copy, content blocks, and media are all scoped per locale.
- Sections available:
  - **Couple & Hero Details**: Names, hero headline/subtext, brand text
  - **Couple Spotlight**: Edit each partner’s name, bio, social links, icon art, plus the center photo/overlay without touching raw HTML
  - **Navigation Menu**: CRUD operations with visibility & sort order
  - **Content Blocks**: Edit the raw HTML for each major section
  - **Hero Slider Photos / Blog Cards**: Upload PNG/JPG assets to Netlify Blobs or tweak titles/descriptions/links. Files are tracked in the Netlify database (`cms_media`) per locale and injected via `renderTemplateWithCms`.
  - **Invitees**: Manage invite list, generate shareable `/?invite=CODE` links, record phone confirmations, edit guest counts, and refresh the list on demand.
- Logout anytime via the header button (clears the admin cookie).

### Front-end features

- **Localization**: Visitors can switch languages via the bottom-left pill. Choice is stored in the `aya_locale` cookie and is also honored by query param `?lang=hy|de`. All CMS content is pulled from the requested locale.
- **Media rendering**: Slider + blog cards pull from `cms_media` collections (`hero_slider`, `blog_posts`). If a locale has no custom uploads, the system clones the English defaults.
- **Decoupled template**: The scraped HTML lives in `src/template.html`. `renderTemplateWithCms` rewrites it with CMS content, injected media, and localized names.
- **Music toggle**: `BackgroundMusic` now receives localized strings so tooltips/buttons respect the active language.
- **RSVP form**:
  - Powered by `RsvpFormHydrator`, which submits to `/api/rsvp`
  - Accepts invite links, e.g. `/?invite=abc123`; the hidden `inviteCode` field ties the submission back to an invitee record via `markInviteeResponse`
  - Sends email through `nodemailer` and stores the entry in the Netlify database

## Media uploads

- Uploaded files are written to Netlify Blobs
- File URLs are referenced inside `cms_media` and served through `/api/uploads/...`

## SQLite to Netlify DB import

After creating the Netlify database, import the old local SQLite rows:

```bash
NETLIFY_DATABASE_URL="postgres://..." npm run db:import-sqlite -- --replace data/rsvps.sqlite
```

Use `--replace` for the first migration so Netlify tables are cleared before importing. Without `--replace`, the script merges rows where possible.

## Localization tips

- When switching locales in the admin panel, the system duplicates English content into the target locale the first time so you can translate incrementally
- `LanguageSwitcher` sets the `lang` query param and a cookie; deep links can specify `?lang=de` explicitly

## Invitee workflow

1. Add invitees in the admin panel (name/email/phone/locale)
2. Copy the generated link (which embeds `?invite=CODE`) and send it to the guest
3. When they submit the RSVP form, their attendance + guest count updates automatically; statuses can also be adjusted manually in the dashboard

## Testing & building

Lint and compile (remember to provide `ADMIN_PASSWORD` for the build step):

```bash
npm run lint
ADMIN_PASSWORD=secret npm run build
```

The build command produces static HTML for the landing page plus dynamic API routes for RSVP, CMS admin, media management, and invitees.
