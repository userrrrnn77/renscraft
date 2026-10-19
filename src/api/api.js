// src/api/api.js

import axios from "axios";
import i18n from "../i18n";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "",
  withCredentials: true,
});

// ─── 401 handling ────────────────────────────────────────────────────────────
let onUnauthorized = null;

export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const AUTH_PATH = /\/api\/(auth|admin)\//;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    if (status === 401 && !AUTH_PATH.test(url) && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

// ─── Error message translation ──────────────────────────────────────────────
//
// Server balikin: { error, code, params? }. `code` di-lookup di i18n
// lewat key `errors.<code>`. Kalau code nggak ada di locale (jarang, atau
// server nambah code baru), fallback ke `error` (English) yang dikirim server.
// Kalau server nggak punya code (error lama / network failure), pakai
// `fallback` yang dikasih pemanggil.
export const errorMessage = (err, fallback) => {
  const data = err?.response?.data;

  if (data?.code) {
    const key = `errors.${data.code}`;
    if (i18n.exists(key)) {
      return i18n.t(key, data.params || {});
    }
  }

  return data?.error || data?.message || fallback;
};

// Translate Project.errorCode (bukan HTTP error, tersimpan di DB).
export const projectErrorMessage = (project, fallback) => {
  if (!project) return fallback || "";
  if (project.errorCode) {
    const key = `projectErrors.${project.errorCode}`;
    if (i18n.exists(key)) return i18n.t(key);
  }
  return project.error || fallback || "";
};

export const isInsufficientCredits = (err) =>
  err?.response?.status === 402 &&
  err?.response?.data?.code === "INSUFFICIENT_CREDITS";

export const isConnectionLost = (err) =>
  !err?.response || [502, 503, 504].includes(err.response.status);

export default api;
