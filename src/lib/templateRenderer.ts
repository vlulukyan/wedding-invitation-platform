import { load, type Cheerio, type CheerioAPI, type Element } from "cheerio";

import type { CmsBlock, CmsMedia, CmsMenuItem, CmsMeta, CoupleSection, EventSection } from "@/lib/cms";

export type CmsPayload = {
  meta: CmsMeta;
  menu: CmsMenuItem[];
  blocks: CmsBlock[];
  media: Record<string, CmsMedia[]>;
  couple: CoupleSection;
  event: EventSection;
};

export function renderTemplateWithCms(bodyMarkup: string, payload: CmsPayload) {
  const $ = load(`<body>${bodyMarkup}</body>`);
  applyMeta($, payload.meta);
  applyMenu($, payload.menu);
  applyBlocks($, payload.blocks);
  applyCoupleSection($, payload.couple);
  applyEventSection($, payload.event);
  applyMedia($, payload.media);
  normalizeRsvpForm($);
  return $("body").html() ?? bodyMarkup;
}

function applyMeta($: CheerioAPI, meta: CmsMeta) {
  if (meta.brand_text) {
    $(".navbar-brand").text(meta.brand_text);
  }
  const coupleName = `${meta.bride_name ?? "Bride"} & ${meta.groom_name ?? "Groom"}`;
  const heroSection = $(".wpo-hero-wedding-date");
  heroSection.find("h2").first().text(coupleName);
  heroSection.find("span").first().text(meta.hero_headline ?? "Save the Date");
  heroSection.find("p").first().text(meta.hero_subtext ?? meta.event_date ?? "We are getting married");
  if (meta.event_date) {
    heroSection.find("#clock").first().attr("id", "cms-countdown").attr("data-countdown-target", meta.event_date);
  }
}

function applyMenu($: CheerioAPI, menu: CmsMenuItem[]) {
  const nav = $(".navigation-holder .nav.navbar-nav");
  if (!nav.length) {
    return;
  }
  const visibleItems = [...menu].sort((a, b) => a.position - b.position).filter((item) => item.is_visible);
  const markup = visibleItems
    .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
    .join("\n");
  nav.html(markup || '<li><a href="#">Menu</a></li>');
}

function applyBlocks($: CheerioAPI, blocks: CmsBlock[]) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  for (const block of sorted) {
    if (block.slug === "couple") {
      continue;
    }
    const element = $(block.selector).first();
    if (!element.length) {
      continue;
    }
    if (!block.is_visible) {
      element.remove();
      continue;
    }
    element.html(block.content_html);
  }
}

function applyCoupleSection($: CheerioAPI, couple: CoupleSection | undefined) {
  if (!couple) {
    return;
  }
  const section = $("#couple");
  if (!section.length) {
    return;
  }
  const textGrids = section.find(".text-grid");
  const leftGrid = textGrids.first();
  const rightGrid = textGrids.last();
  updatePerson(leftGrid, {
    name: couple.left_name,
    bio: couple.left_bio,
    icon: couple.left_icon_url,
    socials: [
      { href: couple.left_facebook_url, icon: "ti-facebook" },
      { href: couple.left_twitter_url, icon: "ti-twitter-alt" },
      { href: couple.left_instagram_url, icon: "ti-instagram" },
    ],
  });
  updatePerson(rightGrid, {
    name: couple.right_name,
    bio: couple.right_bio,
    icon: couple.right_icon_url,
    socials: [
      { href: couple.right_facebook_url, icon: "ti-facebook" },
      { href: couple.right_twitter_url, icon: "ti-twitter-alt" },
      { href: couple.right_instagram_url, icon: "ti-instagram" },
    ],
  });
  if (couple.center_photo_url) {
    section.find(".middle-couple-pic-inner img").first().attr("src", couple.center_photo_url);
  }
  if (couple.center_overlay_url) {
    section.find(".couple-flower img").first().attr("src", couple.center_overlay_url);
  }

  function updatePerson(
    grid: Cheerio<Element>,
    data: { name: string; bio: string | null; icon: string | null; socials: Array<{ href: string | null; icon: string }> }
  ) {
    if (!grid.length) {
      return;
    }
    grid.find("h3").first().text(data.name);
    const bio = data.bio?.trim();
    const bioElement = grid.find("p").first();
    if (bio) {
      bioElement.text(bio);
    } else {
      bioElement.remove();
    }
    if (data.icon) {
      grid.find(".vector img").first().attr("src", data.icon);
    } else {
      grid.find(".vector").first().remove();
    }
    const social = grid.find(".social").first();
    const socialList = social.find("ul").first();
    if (socialList.length) {
      const links = data.socials
        .filter((item) => item.href && item.href.trim().length && item.href.trim() !== "#")
        .map((item) => `<li><a href="${item.href}"><i class="${item.icon}"></i></a></li>`)
        .join("");
      if (links) {
        socialList.html(links);
      } else {
        social.remove();
      }
    }
  }
}

function applyEventSection($: CheerioAPI, event: EventSection | undefined) {
  if (!event) {
    return;
  }
  const section = $("#event");
  if (!section.length) {
    return;
  }
  section.find(".wpo-section-title span").first().text(event.eyebrow);
  section.find(".wpo-section-title h2").first().text(event.heading);
  const row = section.find(".wpo-event-wrap .row").first();
  if (!row.length) {
    return;
  }
  const cards = event.items
    .filter((item) => item.is_visible !== false)
    .map((item, index) => {
      const title = escapeHtml(item.title);
      const imageUrl = escapeHtml(item.image_url);
      const time = escapeHtml(item.time);
      const address = escapeHtml(item.address);
      const mapUrl = item.map_url && isSafeLink(item.map_url) ? escapeHtml(item.map_url) : "";
      const mapLink = mapUrl
        ? `<li class="event-map-link"><a href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open map for ${title}">Map</a></li>`
        : "";
      return `<div class="col col-lg-4 col-md-6 col-12">
        <div class="wpo-event-item" data-wow-duration="${1000 + index * 200}ms">
          <div class="wpo-event-img">
            <div class="wpo-event-img-inner">
              <img alt="${title}" src="${imageUrl}"/>
            </div>
            <div class="title">
              <h2>${title}</h2>
            </div>
          </div>
          <div class="wpo-event-text">
            <ul>
              <li>${address}</li>
              <li class="event-time">${time}</li>
              ${mapLink}
            </ul>
          </div>
        </div>
      </div>`;
    })
    .join("");
  row.html(cards);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeRsvpForm($: CheerioAPI) {
  const form = $("#contact-form-main").first();
  if (!form.length) {
    return;
  }

  form.find('input[name="email"]').parent().remove();
  form.find('input[name="what"]').parent().remove();
  form.find('select[name="meal"]').parent().remove();
}

function applyMedia($: CheerioAPI, media: Record<string, CmsMedia[]>) {
  const sliderImages = media["hero_slider"];
  if (sliderImages?.length) {
    const wrapper = $(".wpo-hero-slider .swiper-wrapper");
    if (wrapper.length) {
      const slides = sliderImages
        .sort((a, b) => a.position - b.position)
        .map(
          (item, index) => `<div class="swiper-slide" data-swiper-slide-index="${index}">
              <div class="slide-inner slide-bg-image" data-background="${item.image_url}" style="background-image: url('${item.image_url}');"></div>
            </div>`
        )
        .join("");
      wrapper.html(slides);
    }
  }
  const blogPosts = media["blog_posts"];
  if (blogPosts?.length) {
    const container = $(".wpo-blog-section .wpo-blog-items");
    if (container.length) {
      const cards = blogPosts
        .sort((a, b) => a.position - b.position)
        .map((item) => {
          const title = item.title ?? "Update";
          const description = item.description ?? "";
          const link = item.link_url ?? "#";
          return `<div class="wpo-blog-item">
            <div class="wpo-blog-img">
              <img src="${item.image_url}" alt="${title}"/>
            </div>
            <div class="wpo-blog-content">
              <h2><a href="${link}">${title}</a></h2>
              ${description ? `<p>${description}</p>` : ""}
            </div>
          </div>`;
        })
        .join("");
      container.html(cards);
    }
  }
  const rsvpImages = media["rsvp_images"];
  if (rsvpImages?.length) {
    const imageElements = $("#rsvp .contact-img img");
    rsvpImages
      .sort((a, b) => a.position - b.position)
      .slice(0, imageElements.length)
      .forEach((item, index) => {
        imageElements.eq(index).attr("src", item.image_url);
      });
  }
}
