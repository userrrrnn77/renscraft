// src/utils/subdomain.js
//
// Satu sumber kebenaran buat urusan wildcard subdomain di client.
// Dipakai App.jsx, SubdomainPage, SubdomainModal, MyProjects, DisplayProjects.
import moment from "moment";

export const SUBDOMAIN_ROOT = "renscraft.cyou";
export const SLUG_MIN = 3;
export const SLUG_MAX = 30;
// Harus sama dengan SUBDOMAIN_REGEX di server (projectController.js).
export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const EXPIRING_SOON_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

// "toko-kopi.renscraft.cyou" -> "toko-kopi". Selain itu (domain utama, www,
// localhost, nested "a.b.renscraft.cyou", domain mirip "notrenscraft.cyou") -> null.
export const getSubdomainFromHostname = (
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
) => {
  const host = String(hostname).toLowerCase();
  const suffix = `.${SUBDOMAIN_ROOT}`;
  if (!host.endsWith(suffix)) return null;

  const slug = host.slice(0, -suffix.length);
  if (!slug || slug === "www" || slug.includes(".")) return null;
  return slug;
};

export const subdomainUrl = (slug) => `https://${slug}.${SUBDOMAIN_ROOT}`;

export const normalizeSlugInput = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

// Balikin key error (subdomain.errors.<key>) atau null kalau valid.
export const validateSlug = (slug) => {
  if (slug.length < SLUG_MIN) return "tooShort";
  if (slug.length > SLUG_MAX) return "tooLong";
  if (!SLUG_REGEX.test(slug)) return "format";
  return null;
};

// state: "none" | "active" | "expiring" | "expired"
export const getSubdomainStatus = (project) => {
  const slug = project?.customSubdomain;
  const expiresAt = project?.subdomainExpiresAt;
  if (!slug || !expiresAt) return { state: "none" };

  const expMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expMs)) return { state: "none" };

  const msLeft = expMs - Date.now();
  if (msLeft <= 0) return { state: "expired", slug, expiresAt, days: 0 };

  const days = Math.ceil(msLeft / DAY_MS);
  return {
    state: days <= EXPIRING_SOON_DAYS ? "expiring" : "active",
    slug,
    expiresAt,
    days,
  };
};

export const isSubdomainActive = (project) => {
  const { state } = getSubdomainStatus(project);
  return state === "active" || state === "expiring";
};

// Link publik: subdomain kalau aktif, kalau tidak /publish/<name>.
export const getPublicHref = (project) =>
  isSubdomainActive(project)
    ? subdomainUrl(project.customSubdomain)
    : `/publish/${encodeURIComponent(project.name)}`;

// Locale moment sudah disinkron i18n (lihat src/i18n.js).
export const formatExpiry = (expiresAt) => moment(expiresAt).format("LL");
