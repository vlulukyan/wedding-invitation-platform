"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";

import HtmlEditor from "@/components/admin/HtmlEditor";
import type { CmsBlock, CmsMedia, CmsMenuItem, CmsMeta, CoupleSection, EventSection } from "@/lib/cms";
import type { Locale } from "@/lib/locales";
import { SUPPORTED_LOCALES } from "@/lib/locales";
import type { Invitee } from "@/lib/invitees";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hy: "Armenian",
  de: "German",
};

type CmsMediaMap = Record<string, CmsMedia[]>;

type Props = {
  initialLocale: Locale;
  initialMeta: CmsMeta;
  initialMenu: CmsMenuItem[];
  initialBlocks: CmsBlock[];
  initialMedia: CmsMediaMap;
  initialInvitees: Invitee[];
  initialCouple: CoupleSection;
  initialEvent: EventSection;
};

type Message = { type: "success" | "error"; text: string } | null;

export default function AdminDashboard({
  initialLocale,
  initialMeta,
  initialMenu,
  initialBlocks,
  initialMedia,
  initialInvitees,
  initialCouple,
  initialEvent,
}: Props) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [meta, setMeta] = useState<CmsMeta>(initialMeta);
  const [menu, setMenu] = useState<CmsMenuItem[]>(initialMenu);
  const [blocks, setBlocks] = useState<CmsBlock[]>(initialBlocks);
  const [media, setMedia] = useState<CmsMediaMap>(initialMedia);
  const [invitees, setInvitees] = useState<Invitee[]>(initialInvitees);
  const [couple, setCouple] = useState<CoupleSection>(initialCouple);
  const [eventSection, setEventSection] = useState<EventSection>(initialEvent);
  const [message, setMessage] = useState<Message>(null);
  const [loadingLocale, setLoadingLocale] = useState(false);

  useEffect(() => {
    if (locale === initialLocale) {
      return;
    }
    let aborted = false;
    const load = async () => {
      setLoadingLocale(true);
      try {
        const [metaRes, menuRes, blocksRes, sliderRes, blogRes, rsvpRes, coupleRes, eventRes] = await Promise.all([
          fetch(`/api/cms/meta?locale=${locale}`).then((res) => res.json()),
          fetch(`/api/cms/menu?locale=${locale}`).then((res) => res.json()),
          fetch(`/api/cms/blocks?locale=${locale}`).then((res) => res.json()),
          fetch(`/api/cms/media?collection=hero_slider&locale=${locale}`).then((res) => res.json()),
          fetch(`/api/cms/media?collection=blog_posts&locale=${locale}`).then((res) => res.json()),
          fetch(`/api/cms/media?collection=rsvp_images&locale=${locale}`).then((res) => res.json()),
          fetch(`/api/cms/couple?locale=${locale}`).then((res) => res.json()),
          fetch(`/api/cms/event?locale=${locale}`).then((res) => res.json()),
        ]);
        if (aborted) return;
        setMeta(metaRes.meta);
        setMenu(menuRes.menu);
        setBlocks(blocksRes.blocks);
        setMedia({
          hero_slider: sliderRes.media ?? [],
          blog_posts: blogRes.media ?? [],
          rsvp_images: rsvpRes.media ?? [],
        });
        setCouple(coupleRes.couple);
        setEventSection(eventRes.event);
      } catch (error) {
        console.error(error);
        if (!aborted) {
          setMessage({ type: "error", text: "Failed to load locale data" });
        }
      } finally {
        if (!aborted) {
          setLoadingLocale(false);
        }
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [locale, initialLocale]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const refreshInvitees = async () => {
    try {
      const response = await fetch("/api/invitees");
      const json = await response.json();
      setInvitees(json.invitees ?? []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Unable to refresh invitees" });
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Wedding CMS</h1>
          <p>Manage content, media, locales, and invitees.</p>
        </div>
        <div className="admin-locale-picker">
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
          <button className="admin-outline" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      {loadingLocale && <p className="admin-message">Loading locale?</p>}
      {message && <p className={`admin-message admin-message--${message.type}`}>{message.text}</p>}
      <section>
        <h2>Couple &amp; Hero Details</h2>
        <MetaForm
          locale={locale}
          meta={meta}
          onPersist={(updated) => {
            setMeta(updated);
            setMessage({ type: "success", text: "Event details saved" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
        />
      </section>
      <section>
        <h2>Couple Spotlight</h2>
        <CoupleSectionForm
          locale={locale}
          couple={couple}
          onPersist={(updated) => {
            setCouple(updated);
            setMessage({ type: "success", text: "Couple section saved" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
        />
      </section>
      <section>
        <h2>Wedding Events</h2>
        <EventSectionForm
          locale={locale}
          eventSection={eventSection}
          onPersist={(updated) => {
            setEventSection(updated);
            setMessage({ type: "success", text: "Wedding events saved" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
        />
      </section>
      <section>
        <h2>Navigation Menu</h2>
        <MenuManager
          locale={locale}
          menu={menu}
          onChange={(items) => {
            setMenu(items);
            setMessage({ type: "success", text: "Menu updated" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
        />
      </section>
      <section>
        <h2>Content Blocks</h2>
        <BlocksManager
          locale={locale}
          blocks={blocks}
          onChange={(items) => {
            setBlocks(items);
            setMessage({ type: "success", text: "Blocks updated" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
        />
      </section>
      <section>
        <h2>Hero Slider Photos</h2>
        <MediaManager
          locale={locale}
          collection="hero_slider"
          media={media.hero_slider ?? []}
          onChange={(items) => {
            setMedia((prev) => ({ ...prev, hero_slider: items }));
            setMessage({ type: "success", text: "Slider updated" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
        />
      </section>
      <section>
        <h2>RSVP Form Images</h2>
        <MediaManager
          locale={locale}
          collection="rsvp_images"
          media={media.rsvp_images ?? []}
          onChange={(items) => {
            setMedia((prev) => ({ ...prev, rsvp_images: items }));
            setMessage({ type: "success", text: "RSVP images updated" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
        />
      </section>
      <section>
        <h2>Blog Cards</h2>
        <MediaManager
          locale={locale}
          collection="blog_posts"
          media={media.blog_posts ?? []}
          onChange={(items) => {
            setMedia((prev) => ({ ...prev, blog_posts: items }));
            setMessage({ type: "success", text: "Blog cards updated" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
          allowLinks
        />
      </section>
      <section>
        <h2>Invitees</h2>
        <InviteeManager
          invitees={invitees}
          onChange={(items) => {
            setInvitees(items);
            setMessage({ type: "success", text: "Invitees updated" });
          }}
          onError={(err) => setMessage({ type: "error", text: err })}
          onRefresh={refreshInvitees}
        />
      </section>
    </div>
  );
}

type MetaFormProps = {
  locale: Locale;
  meta: CmsMeta;
  onPersist: (meta: CmsMeta) => void;
  onError: (message: string) => void;
};

function MetaForm({ locale, meta, onPersist, onError }: MetaFormProps) {
  const [form, setForm] = useState(meta);
  const [saving, setSaving] = useState(false);
  const [uploadingShape, setUploadingShape] = useState(false);
  const [uploadingGateBackground, setUploadingGateBackground] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const shapeInputRef = useRef<HTMLInputElement | null>(null);
  const gateBackgroundInputRef = useRef<HTMLInputElement | null>(null);
  const musicInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(meta);
  }, [meta]);

  const handleShapeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploadingShape(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data?.error ?? "Unable to upload image");
      }
      setForm((prev) => ({ ...prev, hero_shape_url: data.url }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      onError(message);
    } finally {
      setUploadingShape(false);
    }
  };

  const handleGateBackgroundUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploadingGateBackground(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data?.error ?? "Unable to upload image");
      }
      setForm((prev) => ({ ...prev, invitation_gate_background_url: data.url }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      onError(message);
    } finally {
      setUploadingGateBackground(false);
    }
  };

  const handleMusicUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploadingMusic(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data?.error ?? "Unable to upload audio");
      }
      setForm((prev) => ({ ...prev, background_music_url: data.url }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload audio";
      onError(message);
    } finally {
      setUploadingMusic(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/cms/meta?locale=${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save meta");
      }
      onPersist(data.meta);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save";
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-card" onSubmit={handleSubmit}>
      <div className="grid-2">
        {(
          [
            { key: "bride_name", label: "Bride Name" },
            { key: "groom_name", label: "Groom Name" },
            { key: "event_date", label: "Countdown Date & Time" },
            { key: "event_location", label: "Event Location" },
            { key: "hero_headline", label: "Hero Headline" },
            { key: "hero_subtext", label: "Hero Subtext" },
            { key: "brand_text", label: "Brand Text" },
          ] as const
        ).map((field) => (
          <label key={field.key} className="admin-field">
            <span>{field.label}</span>
            <input
              type="text"
              placeholder={field.key === "event_date" ? "2026-11-15 20:30" : undefined}
              value={(form as any)[field.key] ?? ""}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              required={field.key === "bride_name" || field.key === "groom_name"}
            />
            {field.key === "event_date" && <small className="muted">Used by the countdown. Example: 2026-11-15 20:30</small>}
          </label>
        ))}
        <label className="admin-field">
          <span>Hero Shape Image URL</span>
          <div className="upload-row">
            <input
              type="text"
              value={form.hero_shape_url ?? ""}
              onChange={(e) => setForm({ ...form, hero_shape_url: e.target.value })}
              placeholder="/uploads/rings.png"
            />
            <button
              type="button"
              className="admin-outline"
              onClick={() => shapeInputRef.current?.click()}
              disabled={uploadingShape}
            >
              {uploadingShape ? "Uploading..." : "Upload"}
            </button>
            <input
              ref={shapeInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleShapeUpload}
            />
          </div>
          <small className="muted">This replaces the small yellow flower under the names.</small>
        </label>
        <label className="admin-field">
          <span>Invitation Gate Background URL</span>
          <div className="upload-row">
            <input
              type="text"
              value={form.invitation_gate_background_url ?? ""}
              onChange={(e) => setForm({ ...form, invitation_gate_background_url: e.target.value })}
              placeholder="/uploads/invitation-background.jpg"
            />
            <button
              type="button"
              className="admin-outline"
              onClick={() => gateBackgroundInputRef.current?.click()}
              disabled={uploadingGateBackground}
            >
              {uploadingGateBackground ? "Uploading..." : "Upload"}
            </button>
            <input
              ref={gateBackgroundInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleGateBackgroundUpload}
            />
          </div>
          <small className="muted">This is the background image on the first screen with the button to open the invitation.</small>
        </label>
        <label className="admin-field">
          <span>Background Music URL</span>
          <div className="upload-row">
            <input
              type="text"
              value={form.background_music_url ?? ""}
              onChange={(e) => setForm({ ...form, background_music_url: e.target.value })}
              placeholder="/uploads/background-music.mp3"
            />
            <button
              type="button"
              className="admin-outline"
              onClick={() => musicInputRef.current?.click()}
              disabled={uploadingMusic}
            >
              {uploadingMusic ? "Uploading..." : "Upload"}
            </button>
            <input
              ref={musicInputRef}
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={handleMusicUpload}
            />
          </div>
          <small className="muted">This audio is shared for all languages and used by the play music button.</small>
        </label>
      </div>
      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

type MenuManagerProps = {
  locale: Locale;
  menu: CmsMenuItem[];
  onChange: (items: CmsMenuItem[]) => void;
  onError: (message: string) => void;
};

function MenuManager({ locale, menu, onChange, onError }: MenuManagerProps) {
  const [items, setItems] = useState(menu);
  const [creating, setCreating] = useState({ label: "", href: "", position: menu.length * 10, is_visible: true });

  useEffect(() => {
    setItems(menu);
  }, [menu]);

  const updateItem = (id: number, patch: Partial<CmsMenuItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const persistItem = async (item: CmsMenuItem) => {
    try {
      const response = await fetch(`/api/cms/menu/${item.id}?locale=${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: item.label,
          href: item.href,
          position: item.position,
          is_visible: item.is_visible === 1,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update menu item");
      }
      setItems((prev) => {
        const next = prev.map((entry) => (entry.id === item.id ? data.item : entry));
        onChange(next);
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      onError(message);
    }
  };

  const handleDelete = async (item: CmsMenuItem) => {
    try {
      const response = await fetch(`/api/cms/menu/${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unable to delete");
      }
      const next = items.filter((entry) => entry.id !== item.id);
      setItems(next);
      onChange(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      onError(message);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`/api/cms/menu?locale=${locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creating),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to add menu item");
      }
      const next = [...items, data.item];
      setItems(next);
      onChange(next);
      setCreating({ label: "", href: "", position: (next.length + 1) * 10, is_visible: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create";
      onError(message);
    }
  };

  return (
    <div className="admin-card">
      <div className="menu-list">
        {items.map((item) => (
          <div key={item.id} className="menu-row">
            <input value={item.label} onChange={(e) => updateItem(item.id, { label: e.target.value })} />
            <input value={item.href} onChange={(e) => updateItem(item.id, { href: e.target.value })} />
            <input
              type="number"
              value={item.position}
              onChange={(e) => updateItem(item.id, { position: Number(e.target.value) })}
            />
            <label className="switcher">
              <input
                type="checkbox"
                checked={item.is_visible === 1}
                onChange={(e) => updateItem(item.id, { is_visible: e.target.checked ? 1 : 0 })}
              />
              <span>Visible</span>
            </label>
            <button onClick={() => persistItem(item)}>Save</button>
            <button className="danger" onClick={() => handleDelete(item)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <form className="menu-row" onSubmit={handleCreate}>
        <input
          placeholder="Label"
          value={creating.label}
          onChange={(e) => setCreating((prev) => ({ ...prev, label: e.target.value }))}
          required
        />
        <input
          placeholder="Href"
          value={creating.href}
          onChange={(e) => setCreating((prev) => ({ ...prev, href: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Position"
          value={creating.position}
          onChange={(e) => setCreating((prev) => ({ ...prev, position: Number(e.target.value) }))}
          required
        />
        <label className="switcher">
          <input
            type="checkbox"
            checked={creating.is_visible}
            onChange={(e) => setCreating((prev) => ({ ...prev, is_visible: e.target.checked }))}
          />
          <span>Visible</span>
        </label>
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

type BlocksManagerProps = {
  locale: Locale;
  blocks: CmsBlock[];
  onChange: (blocks: CmsBlock[]) => void;
  onError: (message: string) => void;
};

function BlocksManager({ locale, blocks, onChange, onError }: BlocksManagerProps) {
  const [items, setItems] = useState(blocks);

  useEffect(() => {
    setItems(blocks);
  }, [blocks]);

  const updateLocal = (slug: string, patch: Partial<CmsBlock>) => {
    setItems((prev) => prev.map((block) => (block.slug === slug ? { ...block, ...patch } : block)));
  };

  const persistBlock = async (block: CmsBlock) => {
    try {
      const response = await fetch(`/api/cms/blocks/${block.slug}?locale=${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selector: block.selector,
          content_html: block.content_html,
          position: block.position,
          is_visible: Boolean(block.is_visible),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update block");
      }
      setItems((prev) => {
        const next = prev.map((entry) => (entry.slug === block.slug ? data.block : entry));
        onChange(next);
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save block";
      onError(message);
    }
  };

  return (
    <div className="admin-stack">
      {items.map((block) => (
        <div key={`${block.slug}-${locale}`} className="admin-card">
          <div className="block-header">
            <div>
              <strong>{block.slug}</strong>
              <p className="muted">{block.selector}</p>
            </div>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(block.is_visible)}
                onChange={(e) => updateLocal(block.slug, { is_visible: e.target.checked ? 1 : 0 })}
              />
              Visible
            </label>
            <input
              type="number"
              value={block.position}
              onChange={(e) => updateLocal(block.slug, { position: Number(e.target.value) })}
            />
          </div>
          <HtmlEditor value={block.content_html} onChange={(value) => updateLocal(block.slug, { content_html: value })} />
          <button onClick={() => persistBlock(block)}>Save Block</button>
        </div>
      ))}
    </div>
  );
}

type UploadableField = "left_icon_url" | "right_icon_url" | "center_photo_url" | "center_overlay_url";

type CoupleSectionFormProps = {
  locale: Locale;
  couple: CoupleSection;
  onPersist: (section: CoupleSection) => void;
  onError: (message: string) => void;
};

function CoupleSectionForm({ locale, couple, onPersist, onError }: CoupleSectionFormProps) {
  const [form, setForm] = useState(couple);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<UploadableField | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputs = useRef<Record<UploadableField, HTMLInputElement | null>>({
    left_icon_url: null,
    right_icon_url: null,
    center_photo_url: null,
    center_overlay_url: null,
  });

  useEffect(() => {
    setForm(couple);
  }, [couple]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/cms/couple?locale=${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save couple section");
      }
      onPersist(data.couple);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save couple section";
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  const personConfigs = [
    { prefix: "left", label: "Partner One" },
    { prefix: "right", label: "Partner Two" },
  ] as const;

  const socialFields = [
    { suffix: "facebook_url", label: "Facebook URL" },
    { suffix: "twitter_url", label: "Twitter URL" },
    { suffix: "instagram_url", label: "Instagram URL" },
  ] as const;

  const handleFieldChange = (key: keyof CoupleSection, value: string) => {
    const requiredFields: Array<keyof CoupleSection> = ["left_name", "right_name"];
    setForm((prev) => ({
      ...prev,
      [key]: requiredFields.includes(key) ? value : value.trim().length ? value : null,
    }));
  };

  const registerFileInput = (field: UploadableField, element: HTMLInputElement | null) => {
    fileInputs.current[field] = element;
  };

  const handleUploadClick = (field: UploadableField) => {
    setUploadError(null);
    fileInputs.current[field]?.click();
  };

  const handleFileInputChange = async (field: UploadableField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploadingField(field);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to upload file");
      }
      handleFieldChange(field, data.url ?? "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  return (
    <form className="admin-card couple-form" onSubmit={handleSubmit}>
      <p className="muted">
        Update copy, icons, and social links per locale. Use the Upload buttons (files are stored under <code>/public/uploads</code>) or paste an existing URL.
      </p>
      {uploadError && <p className="admin-error">{uploadError}</p>}
      <div className="grid-2">
        {personConfigs.map((config) => (
          <div key={config.prefix} className="couple-person-card">
            <h3>{config.label}</h3>
            <label className="admin-field">
              <span>Name</span>
              <input value={(form as any)[`${config.prefix}_name`] ?? ""} onChange={(e) => handleFieldChange(`${config.prefix}_name` as keyof CoupleSection, e.target.value)} required />
            </label>
            <label className="admin-field">
              <span>Bio (optional)</span>
              <textarea
                rows={4}
                value={(form as any)[`${config.prefix}_bio`] ?? ""}
                onChange={(e) => handleFieldChange(`${config.prefix}_bio` as keyof CoupleSection, e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Icon/Image URL</span>
              <div className="upload-row">
                <input
                  value={(form as any)[`${config.prefix}_icon_url`] ?? ""}
                  onChange={(e) => handleFieldChange(`${config.prefix}_icon_url` as keyof CoupleSection, e.target.value)}
                  placeholder="/uploads/vector.svg"
                />
                <button
                  type="button"
                  className="admin-outline"
                  onClick={() => handleUploadClick(`${config.prefix}_icon_url` as UploadableField)}
                  disabled={uploadingField === `${config.prefix}_icon_url`}
                >
                  {uploadingField === `${config.prefix}_icon_url` ? "Uploading..." : "Upload"}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={(element) => registerFileInput(`${config.prefix}_icon_url` as UploadableField, element)}
                  style={{ display: "none" }}
                  onChange={(event) => handleFileInputChange(`${config.prefix}_icon_url` as UploadableField, event)}
                />
              </div>
            </label>
            <div className="social-grid">
              {socialFields.map((field) => (
                <label key={field.suffix} className="admin-field">
                  <span>{field.label} (optional)</span>
                  <input
                    value={(form as any)[`${config.prefix}_${field.suffix}`] ?? ""}
                    onChange={(e) => handleFieldChange(`${config.prefix}_${field.suffix}` as keyof CoupleSection, e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <label className="admin-field">
          <span>Center Photo URL</span>
          <div className="upload-row">
            <input value={form.center_photo_url ?? ""} onChange={(e) => handleFieldChange("center_photo_url", e.target.value)} placeholder="/uploads/couple-main.jpg" />
            <button type="button" className="admin-outline" onClick={() => handleUploadClick("center_photo_url")} disabled={uploadingField === "center_photo_url"}>
              {uploadingField === "center_photo_url" ? "Uploading..." : "Upload"}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={(element) => registerFileInput("center_photo_url", element)}
              style={{ display: "none" }}
              onChange={(event) => handleFileInputChange("center_photo_url", event)}
            />
          </div>
        </label>
        <label className="admin-field">
          <span>Overlay Flower URL</span>
          <div className="upload-row">
            <input value={form.center_overlay_url ?? ""} onChange={(e) => handleFieldChange("center_overlay_url", e.target.value)} placeholder="/uploads/overlay.png" />
            <button type="button" className="admin-outline" onClick={() => handleUploadClick("center_overlay_url")} disabled={uploadingField === "center_overlay_url"}>
              {uploadingField === "center_overlay_url" ? "Uploading..." : "Upload"}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={(element) => registerFileInput("center_overlay_url", element)}
              style={{ display: "none" }}
              onChange={(event) => handleFileInputChange("center_overlay_url", event)}
            />
          </div>
        </label>
      </div>
      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Couple Section"}
      </button>
    </form>
  );
}

type EventSectionFormProps = {
  locale: Locale;
  eventSection: EventSection;
  onPersist: (section: EventSection) => void;
  onError: (message: string) => void;
};

function EventSectionForm({ locale, eventSection, onPersist, onError }: EventSectionFormProps) {
  const [form, setForm] = useState(eventSection);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    setForm(eventSection);
  }, [eventSection]);

  const handleSectionFieldChange = (key: "eyebrow" | "heading", value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleItemChange = <Key extends keyof EventSection["items"][number]>(
    index: number,
    key: Key,
    value: EventSection["items"][number][Key]
  ) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    }));
  };

  const handleUploadClick = (index: number) => {
    fileInputs.current[index]?.click();
  };

  const handleFileInputChange = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to upload file");
      }
      handleItemChange(index, "image_url", data.url ?? "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onError(message);
    } finally {
      setUploadingIndex(null);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/cms/event?locale=${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eyebrow: form.eyebrow,
          heading: form.heading,
          items: form.items,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save wedding events");
      }
      onPersist(data.event);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save wedding events";
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-card event-form" onSubmit={handleSubmit}>
      <p className="muted">Edit the section heading and each event card per locale. Upload buttons store images under <code>/public/uploads</code>.</p>
      <div className="grid-2">
        <label className="admin-field">
          <span>Small Heading</span>
          <input value={form.eyebrow} onChange={(e) => handleSectionFieldChange("eyebrow", e.target.value)} required />
        </label>
        <label className="admin-field">
          <span>Main Heading</span>
          <input value={form.heading} onChange={(e) => handleSectionFieldChange("heading", e.target.value)} required />
        </label>
      </div>
      <div className="event-card-grid">
        {form.items.map((item, index) => (
          <div key={index} className="event-card-editor">
            <div className="event-card-editor__heading">
              <h3>Event {index + 1}</h3>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={item.is_visible !== false}
                  onChange={(e) => handleItemChange(index, "is_visible", e.target.checked)}
                />
                Show on site
              </label>
            </div>
            <label className="admin-field">
              <span>Title</span>
              <input value={item.title} onChange={(e) => handleItemChange(index, "title", e.target.value)} required />
            </label>
            <label className="admin-field">
              <span>Image URL</span>
              <div className="upload-row">
                <input value={item.image_url} onChange={(e) => handleItemChange(index, "image_url", e.target.value)} required />
                <button type="button" className="admin-outline" onClick={() => handleUploadClick(index)} disabled={uploadingIndex === index}>
                  {uploadingIndex === index ? "Uploading..." : "Upload"}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={(element) => {
                    fileInputs.current[index] = element;
                  }}
                  style={{ display: "none" }}
                  onChange={(event) => handleFileInputChange(index, event)}
                />
              </div>
            </label>
            {item.image_url && <img className="event-card-preview" src={item.image_url} alt={item.title} />}
            <label className="admin-field">
              <span>Time</span>
              <input value={item.time} onChange={(e) => handleItemChange(index, "time", e.target.value)} placeholder="1:00 PM - 2:30 PM" required />
            </label>
            <label className="admin-field">
              <span>Address</span>
              <textarea rows={3} value={item.address} onChange={(e) => handleItemChange(index, "address", e.target.value)} required />
            </label>
            <label className="admin-field">
              <span>Map URL</span>
              <input
                value={item.map_url ?? ""}
                onChange={(e) => handleItemChange(index, "map_url", e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </label>
          </div>
        ))}
      </div>
      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Wedding Events"}
      </button>
    </form>
  );
}

type MediaManagerProps = {
  locale: Locale;
  collection: string;
  media: CmsMedia[];
  allowLinks?: boolean;
  onChange: (items: CmsMedia[]) => void;
  onError: (message: string) => void;
};

function MediaManager({ locale, collection, media, allowLinks = false, onChange, onError }: MediaManagerProps) {
  const [items, setItems] = useState(media);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setItems(media);
  }, [media]);

  const updateLocal = (id: number, patch: Partial<CmsMedia>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const persistItem = async (item: CmsMedia) => {
    try {
      const response = await fetch(`/api/cms/media/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          link_url: item.link_url,
          position: item.position,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update media");
      }
      setItems((prev) => {
        const next = prev.map((entry) => (entry.id === item.id ? data.media : entry));
        onChange(next);
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save media";
      onError(message);
    }
  };

  const handleDelete = async (item: CmsMedia) => {
    try {
      const response = await fetch(`/api/cms/media/${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unable to delete media");
      }
      const next = items.filter((entry) => entry.id !== item.id);
      setItems(next);
      onChange(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      onError(message);
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (!formData.get("file")) {
      onError("Please choose a file");
      return;
    }
    setUploading(true);
    try {
      const response = await fetch(`/api/cms/media?collection=${collection}&locale=${locale}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to upload media");
      }
      const next = [...items, data.media];
      setItems(next);
      onChange(next);
      event.currentTarget.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="media-grid">
        {items.map((item) => (
          <div key={item.id} className="media-card">
            <img src={item.image_url} alt={item.title ?? "Media"} />
            <input value={item.title ?? ""} placeholder="Title" onChange={(e) => updateLocal(item.id, { title: e.target.value })} />
            <textarea
              rows={3}
              value={item.description ?? ""}
              placeholder="Description"
              onChange={(e) => updateLocal(item.id, { description: e.target.value })}
            />
            {allowLinks && (
              <input
                value={item.link_url ?? ""}
                placeholder="Link URL"
                onChange={(e) => updateLocal(item.id, { link_url: e.target.value })}
              />
            )}
            <input
              type="number"
              value={item.position}
              onChange={(e) => updateLocal(item.id, { position: Number(e.target.value) })}
            />
            <div className="media-actions">
              <button onClick={() => persistItem(item)}>Save</button>
              <button className="danger" onClick={() => handleDelete(item)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <form className="media-upload" onSubmit={handleUpload}>
        <input type="file" name="file" accept="image/*" required />
        <input type="text" name="title" placeholder="Title (optional)" />
        <textarea name="description" placeholder="Description (optional)" rows={2} />
        {allowLinks && <input type="text" name="link_url" placeholder="Link URL" />}
        <input type="number" name="position" placeholder="Position" />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}

type InviteeManagerProps = {
  invitees: Invitee[];
  onChange: (invitees: Invitee[]) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
};

const STATUS_OPTIONS: Array<{ value: Invitee["status"]; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

function InviteeManager({ invitees, onChange, onError, onRefresh }: InviteeManagerProps) {
  const [items, setItems] = useState(invitees);
  const [creating, setCreating] = useState({ first_name: "", last_name: "", email: "", phone: "", locale: "en" as Locale });

  useEffect(() => {
    setItems(invitees);
  }, [invitees]);

  const updateLocal = (id: number, patch: Partial<Invitee>) => {
    setItems((prev) => prev.map((invitee) => (invitee.id === id ? { ...invitee, ...patch } : invitee)));
  };

  const persistInvitee = async (invitee: Invitee) => {
    try {
      const response = await fetch(`/api/invitees/${invitee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: invitee.first_name,
          last_name: invitee.last_name,
          email: invitee.email,
          phone: invitee.phone,
          status: invitee.status,
          guest_count: invitee.guest_count,
          response_note: invitee.response_note,
          attending:
            invitee.status === "accepted" ? 1 : invitee.status === "declined" ? 0 : invitee.attending ?? null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update invitee");
      }
      setItems((prev) => {
        const next = prev.map((entry) => (entry.id === invitee.id ? data.invitee : entry));
        onChange(next);
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update invitee";
      onError(message);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/invitees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creating),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to add invitee");
      }
      const next = [data.invitee, ...items];
      setItems(next);
      onChange(next);
      setCreating({ first_name: "", last_name: "", email: "", phone: "", locale: creating.locale });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create invitee";
      onError(message);
    }
  };

  const copyLink = (code: string) => {
    const url = new URL(window.location.origin);
    url.searchParams.set("invite", code);
    navigator.clipboard.writeText(url.toString()).catch(() => {
      onError("Unable to copy link");
    });
  };

  return (
    <div className="invitee-manager admin-card">
      <form className="invitee-form" onSubmit={handleCreate}>
        <input
          placeholder="First name"
          value={creating.first_name}
          onChange={(e) => setCreating((prev) => ({ ...prev, first_name: e.target.value }))}
        />
        <input
          placeholder="Last name"
          value={creating.last_name}
          onChange={(e) => setCreating((prev) => ({ ...prev, last_name: e.target.value }))}
        />
        <input
          placeholder="Email"
          value={creating.email}
          onChange={(e) => setCreating((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          placeholder="Phone"
          value={creating.phone}
          onChange={(e) => setCreating((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <select value={creating.locale} onChange={(e) => setCreating((prev) => ({ ...prev, locale: e.target.value as Locale }))}>
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
        <button type="submit">Add Invitee</button>
      </form>
      <button className="admin-outline" onClick={onRefresh}>
        Refresh List
      </button>
      <div className="invitee-table">
        <div className="invitee-row invitee-row--head">
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Status</span>
          <span>Guests</span>
          <span>Invite</span>
        </div>
        {items.map((invitee) => (
          <div key={invitee.id} className="invitee-row">
            <span>
              <input
                value={invitee.first_name ?? ""}
                placeholder="First"
                onChange={(e) => updateLocal(invitee.id, { first_name: e.target.value })}
              />
              <input
                value={invitee.last_name ?? ""}
                placeholder="Last"
                onChange={(e) => updateLocal(invitee.id, { last_name: e.target.value })}
              />
            </span>
            <span>
              <input value={invitee.email ?? ""} onChange={(e) => updateLocal(invitee.id, { email: e.target.value })} />
            </span>
            <span>
              <input value={invitee.phone ?? ""} onChange={(e) => updateLocal(invitee.id, { phone: e.target.value })} />
            </span>
            <span>
              <select
                value={invitee.status}
                onChange={(e) => {
                  const status = e.target.value as Invitee["status"];
                  updateLocal(invitee.id, { status, guest_count: status === "declined" ? 0 : invitee.guest_count });
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
            <span>
              <input
                type="number"
                value={invitee.status === "declined" ? 0 : invitee.guest_count ?? 0}
                disabled={invitee.status === "declined"}
                onChange={(e) => updateLocal(invitee.id, { guest_count: Number(e.target.value) })}
              />
            </span>
            <span className="invitee-actions">
              <button type="button" onClick={() => copyLink(invitee.invite_code)}>
                Copy Link
              </button>
              <button type="button" onClick={() => persistInvitee(invitee)}>
                Save
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
