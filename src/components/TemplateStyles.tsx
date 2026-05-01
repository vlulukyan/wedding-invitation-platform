import { templateStylePaths } from "@/constants/templateAssets";

const templateOverrides = `
main.template-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.template-page .color-switcher-wrap,
.template-page #header,
.template-page .wpo-hero-wedding-date .shape-1 {
  display: none !important;
}

.template-page .wpo-box-style {
  width: 100%;
  padding: 0 !important;
}

.template-page .wpo-hero-wedding-date {
  background: rgba(255, 255, 255, 0.78) !important;
  box-shadow: 0 18px 45px rgba(47, 27, 46, 0.14) !important;
}

.template-page .wpo-hero-slider,
.template-page .wpo-hero-slider .swiper-container,
.template-page .wpo-hero-slider .swiper-wrapper,
.template-page .wpo-hero-slider .swiper-slide,
.template-page .wpo-hero-slider .slide-inner {
  width: 100%;
  height: 100vh !important;
  min-height: 100svh;
}

.template-page .wpo-hero-slider .slide-inner {
  background-size: cover !important;
  background-position: center !important;
}

.template-page .wpo-hero-wedding-date h2 {
  color: #b98e5c !important;
  font-family: "ArmAllegro Unicode", "Noto Serif Armenian Condensed", Georgia, serif !important;
  font-size: clamp(3rem, 7vw, 6.5rem) !important;
  font-style: normal !important;
  font-weight: 400 !important;
  line-height: 1.25 !important;
}

.template-page .wpo-hero-wedding-date h2 span {
  font-family: inherit !important;
  font-style: inherit !important;
}

.template-page .wpo-hero-wedding-date #cms-countdown {
  display: flex !important;
  justify-content: center;
  align-items: flex-start;
  gap: 50px;
  overflow: hidden;
  text-align: center;
  margin-top: 0;
}

.template-page .wpo-hero-wedding-date #cms-countdown > div {
  width: 140px;
  min-height: 100px;
}

.template-page .wpo-hero-wedding-date #cms-countdown .time {
  font-family: "Sail", cursive !important;
  font-size: 5.33333rem !important;
  line-height: 1 !important;
  padding-top: 15px;
  color: #657150 !important;
  margin-bottom: 20px;
  font-weight: 400 !important;
}

.template-page .wpo-hero-wedding-date #cms-countdown span {
  color: #5c5c5c !important;
  font-size: 25px !important;
  font-style: normal !important;
  font-weight: 400 !important;
}

.template-page #event .wpo-event-wrap .row {
  align-items: stretch !important;
}

.template-page #event .wpo-event-wrap .row > [class*="col"] {
  display: flex !important;
}

.template-page #event .wpo-event-item {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  height: 100% !important;
  overflow: visible !important;
}

.template-page #event .wpo-event-img {
  width: 100% !important;
  aspect-ratio: 16 / 9 !important;
  position: relative !important;
  overflow: hidden !important;
  flex: 0 0 auto !important;
}

.template-page #event .wpo-event-img-inner {
  width: 100% !important;
  height: 100% !important;
}

.template-page #event .wpo-event-img-inner img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

.template-page #event .wpo-event-text {
  flex: 1 1 auto !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}

.template-page #event .wpo-event-text ul {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.template-page #event .wpo-event-text ul li {
  display: block !important;
  width: 100% !important;
  margin: 0 0 0.7rem !important;
  padding: 0 !important;
  color: #454545 !important;
  font-size: 1rem !important;
  line-height: 1.45 !important;
  text-align: center !important;
}

.template-page #event .wpo-event-text ul li.event-time {
  margin-top: 1.25rem !important;
  color: #252525 !important;
  font-weight: 500 !important;
}

.template-page #event .wpo-event-text ul li.event-time::before {
  display: none !important;
}

.template-page #event .wpo-event-text ul li.event-map-link {
  margin-top: auto !important;
  padding-top: 0.4rem !important;
}

.template-page #event .wpo-event-text ul li.event-map-link a {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  border-bottom: 1px solid currentColor;
  color: #657150 !important;
  font-weight: 500 !important;
  text-decoration: none !important;
}

.invitation-gate {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: grid;
  place-items: end center;
  padding: 1.5rem;
  background:
    linear-gradient(rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.74)),
    url("/template-assets/images/html/tf/habibi/assets/images/rsvp/img-3.jpg") center / cover;
}

.invitation-gate__button,
.music-toggle__button,
.language-toggle__button {
  font-family: inherit !important;
}

.invitation-gate__button {
  border: 1px solid rgba(101, 113, 80, 0.35);
  background: #657150;
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 18px 45px rgba(21, 13, 13, 0.22);
}

.music-toggle {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.music-toggle__button {
  border: none;
  background: #657150;
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.95rem;
  min-width: 4rem;
  box-shadow: 0 10px 25px rgba(21, 13, 13, 0.25);
}

.music-toggle__button--active {
  background: #d49b54;
}

.music-toggle__button:disabled,
.language-toggle__button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.music-toggle__status {
  background: rgba(255, 255, 255, 0.92);
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  color: #533216;
  max-width: 16rem;
  text-align: right;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.language-toggle {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  display: flex;
  gap: 0.35rem;
  z-index: 9999;
}

.language-toggle__button {
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8rem;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.language-toggle__button--active {
  background: #fff;
  color: #1f1204;
}

.language-loader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  background: rgba(31, 18, 4, 0.36);
  backdrop-filter: blur(3px);
}

.language-loader__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.48);
  border-top-color: #fff;
  border-radius: 50%;
  animation: language-loader-spin 0.8s linear infinite;
}

@keyframes language-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

#rsvp #success,
#rsvp #error {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  font-weight: 600;
}

#rsvp #success.visible,
#rsvp #error.visible {
  opacity: 1;
  transform: translateY(0);
}

#rsvp #success {
  color: #1b7d4d;
}

#rsvp #error {
  color: #b3261e;
}

#rsvp .rsvp-deadline-message {
  margin: 0.5rem 0 0;
  color: #101010;
  font-size: 1rem;
  line-height: 1.5;
}

#rsvp .submit-area {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
}

#rsvp #c-loader {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

#rsvp #c-loader.visible {
  opacity: 1;
}

@media (max-width: 768px) {
  .template-page .wpo-hero-slider,
  .template-page .wpo-hero-slider .swiper-container,
  .template-page .wpo-hero-slider .swiper-wrapper,
  .template-page .wpo-hero-slider .swiper-slide,
  .template-page .wpo-hero-slider .slide-inner {
    height: min(78vw, 420px) !important;
    min-height: 0 !important;
  }

  .template-page .wpo-hero-slider .slide-inner {
    background-size: cover !important;
    background-repeat: no-repeat !important;
    background-position: center center !important;
    background-color: #eef2fb;
  }

  .music-toggle {
    bottom: 1rem;
    right: 1rem;
  }

  .language-toggle {
    bottom: 1rem;
    left: 1rem;
  }
}
`;

export default function TemplateStyles() {
  return (
    <>
      {templateStylePaths.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style dangerouslySetInnerHTML={{ __html: templateOverrides }} />
    </>
  );
}
