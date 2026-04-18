import { z } from "zod";

export const cmsMetaSchema = z.object({
  bride_name: z.string().min(1).max(120),
  groom_name: z.string().min(1).max(120),
  event_date: z.string().min(1).max(120).nullable().optional(),
  event_location: z.string().min(1).max(200).nullable().optional(),
  hero_headline: z.string().min(1).max(120).nullable().optional(),
  hero_subtext: z.string().min(1).max(200).nullable().optional(),
  brand_text: z.string().min(1).max(60).nullable().optional(),
});

export const cmsMetaUpdateSchema = cmsMetaSchema.partial();

export const cmsMenuItemSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(200),
  position: z.number().int().min(0).max(1000),
  is_visible: z.boolean().optional().default(true),
});

export const cmsMenuItemUpdateSchema = cmsMenuItemSchema.partial();

export const cmsBlockSchema = z.object({
  slug: z.string().min(1).max(60),
  selector: z.string().min(1),
  content_html: z.string().min(0),
  position: z.number().int().min(0).max(1000).optional(),
  is_visible: z.boolean().optional().default(true),
});

export const cmsBlockUpdateSchema = cmsBlockSchema.partial().omit({ slug: true });

const optionalField = z
  .string()
  .trim()
  .max(600)
  .nullable()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  });

const optionalLongField = z
  .string()
  .trim()
  .max(800)
  .nullable()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  });

export const coupleSectionSchema = z.object({
  left_name: z.string().trim().min(1).max(120),
  left_bio: optionalLongField,
  left_icon_url: optionalField,
  left_facebook_url: optionalField,
  left_twitter_url: optionalField,
  left_instagram_url: optionalField,
  right_name: z.string().trim().min(1).max(120),
  right_bio: optionalLongField,
  right_icon_url: optionalField,
  right_facebook_url: optionalField,
  right_twitter_url: optionalField,
  right_instagram_url: optionalField,
  center_photo_url: optionalField,
  center_overlay_url: optionalField,
});

export const coupleSectionUpdateSchema = coupleSectionSchema.partial();

const eventTextField = z.string().trim().min(1).max(240);
const eventOptionalUrlField = z
  .string()
  .trim()
  .max(1000)
  .nullable()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  });

export const eventSectionSchema = z.object({
  eyebrow: eventTextField,
  heading: eventTextField,
  items: z
    .array(
      z.object({
        title: eventTextField,
        image_url: eventTextField,
        time: eventTextField,
        address: eventTextField,
        map_url: eventOptionalUrlField,
        is_visible: z.boolean().optional().default(true),
      })
    )
    .min(1)
    .max(6),
});

export const eventSectionUpdateSchema = eventSectionSchema.partial();
