// src/utils/usePageMeta.js
import { useEffect } from "react";

const SITE_URL = "https://renscraft.web.id";
const SITE_NAME = "Renscraft";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const getMeta = (attr, key) =>
  document.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content") ??
  null;

const setMeta = (attr, key, content) => {
  if (content == null) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const getLink = (rel) =>
  document.querySelector(`link[rel="${rel}"]`)?.getAttribute("href") ?? null;

const setLink = (rel, href) => {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * usePageMeta
 * @param {object}   opts
 * @param {string}   opts.title        — <title> + og:title + twitter:title
 * @param {string}   opts.description  — meta desc + og:description + twitter:description
 * @param {string=}  opts.image        — og:image + twitter:image (absolute URL)
 * @param {string=}  opts.url          — canonical URL (default: current path)
 * @param {string=}  opts.type         — og:type (default: "website")
 * @param {boolean=} opts.noIndex      — true = robots "noindex, nofollow"
 * @param {object=}  opts.jsonLd       — extra JSON-LD (injected as <script type="application/ld+json">)
 */
export default function usePageMeta({
  title,
  description,
  image,
  url,
  type = "website",
  noIndex = false,
  jsonLd = null,
} = {}) {
  useEffect(() => {
    const fullTitle = title || SITE_NAME;
    const fullDesc = description || "";
    const fullImage = image || DEFAULT_IMAGE;
    const fullUrl = url || `${SITE_URL}${window.location.pathname}`;
    const robots = noIndex ? "noindex, nofollow" : DEFAULT_ROBOTS;

    const prev = {
      title: document.title,
      desc: getMeta("name", "description"),
      ogTitle: getMeta("property", "og:title"),
      ogDesc: getMeta("property", "og:description"),
      ogImage: getMeta("property", "og:image"),
      ogUrl: getMeta("property", "og:url"),
      ogType: getMeta("property", "og:type"),
      twTitle: getMeta("name", "twitter:title"),
      twDesc: getMeta("name", "twitter:description"),
      twImage: getMeta("name", "twitter:image"),
      robots: getMeta("name", "robots"),
      canonical: getLink("canonical"),
    };

    document.title = fullTitle;
    if (fullDesc) setMeta("name", "description", fullDesc);

    setMeta("property", "og:title", fullTitle);
    if (fullDesc) setMeta("property", "og:description", fullDesc);
    setMeta("property", "og:image", fullImage);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE_NAME);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    if (fullDesc) setMeta("name", "twitter:description", fullDesc);
    setMeta("name", "twitter:image", fullImage);

    setMeta("name", "robots", robots);
    setLink("canonical", fullUrl);

    document
      .querySelectorAll(
        'script[type="application/ld+json"][data-dynamic="true"]',
      )
      .forEach((s) => s.remove());

    let scriptEl = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.setAttribute("data-dynamic", "true");
      scriptEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prev.title;
      if (prev.desc !== null) setMeta("name", "description", prev.desc);
      if (prev.ogTitle !== null) setMeta("property", "og:title", prev.ogTitle);
      if (prev.ogDesc !== null)
        setMeta("property", "og:description", prev.ogDesc);
      if (prev.ogImage !== null) setMeta("property", "og:image", prev.ogImage);
      if (prev.ogUrl !== null) setMeta("property", "og:url", prev.ogUrl);
      if (prev.ogType !== null) setMeta("property", "og:type", prev.ogType);
      if (prev.twTitle !== null) setMeta("name", "twitter:title", prev.twTitle);
      if (prev.twDesc !== null)
        setMeta("name", "twitter:description", prev.twDesc);
      if (prev.twImage !== null) setMeta("name", "twitter:image", prev.twImage);
      if (prev.robots !== null) setMeta("name", "robots", prev.robots);
      if (prev.canonical !== null) setLink("canonical", prev.canonical);
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, image, url, type, noIndex, jsonLd]);
}
