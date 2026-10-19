// src/utils/slug.js
// URL-safe slugs for /publish/:slug ("Kopi Senja & Co" -> "kopi-senja-and-co").
import { randomBytes } from "node:crypto";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_SLUG_LENGTH = 80;
const MAX_BASE_LENGTH = 60; // leaves room for the "-abc123" suffix

export function slugify(text) {
  const base = String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // accents: "café" -> "cafe"
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, "");
  return base || "site";
}

// 6 hex chars, appended when the plain slug is already taken
export const randomSuffix = () => randomBytes(3).toString("hex");

export const isValidSlug = (value) =>
  typeof value === "string" && value.length <= MAX_SLUG_LENGTH && SLUG_RE.test(value);