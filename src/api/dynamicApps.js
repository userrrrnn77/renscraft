// src/api/dynamicApps.js
//
// Thin wrappers over /api/dynamic. No state, no toasts. Errors are
// { error, code, params } — read them with errorMessage() from ./api.
import axios from "axios";
import api from "./api";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "",
  withCredentials: false,
});

// ── Apps ─────────────────────────────────────────────────────────────────────
export const listApps = async () => {
  const { data } = await api.get("/api/dynamic/apps");
  return Array.isArray(data?.apps) ? data.apps : [];
};

export const createApp = async ({ sourceProjectId, slug }) => {
  const { data } = await api.post("/api/dynamic/apps", {
    sourceProjectId,
    slug,
  });
  return data.app;
};

export const getApp = async (id) => {
  const { data } = await api.get(`/api/dynamic/apps/${encodeURIComponent(id)}`);
  return data.app;
};

export const publishApp = async (id) => {
  const { data } = await api.post(
    `/api/dynamic/apps/${encodeURIComponent(id)}/publish`,
  );
  return data.app;
};

export const unpublishApp = async (id) => {
  const { data } = await api.post(
    `/api/dynamic/apps/${encodeURIComponent(id)}/unpublish`,
  );
  return data.app;
};

// ── Collections ─────────────────────────────────────────────────────────────
export const listCollections = async (appId) => {
  const { data } = await api.get(
    `/api/dynamic/apps/${encodeURIComponent(appId)}/collections`,
  );
  return Array.isArray(data?.collections) ? data.collections : [];
};

export const createCollection = async (appId, body) => {
  const { data } = await api.post(
    `/api/dynamic/apps/${encodeURIComponent(appId)}/collections`,
    body,
  );
  return data.collection;
};

export const updateCollection = async (appId, cid, body) => {
  const { data } = await api.patch(
    `/api/dynamic/apps/${encodeURIComponent(appId)}/collections/${encodeURIComponent(cid)}`,
    body,
  );
  return data.collection;
};

export const deleteCollection = async (appId, cid) => {
  const { data } = await api.delete(
    `/api/dynamic/apps/${encodeURIComponent(appId)}/collections/${encodeURIComponent(cid)}`,
  );
  return data;
};

// ── Documents (owner view) ──────────────────────────────────────────────────
export const listDocuments = async (
  appId,
  cid,
  { page = 1, limit = 20 } = {},
) => {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  const { data } = await api.get(
    `/api/dynamic/apps/${encodeURIComponent(appId)}/collections/${encodeURIComponent(cid)}/documents?${p}`,
  );
  return data;
};

export const deleteDocument = async (appId, cid, docId) => {
  const { data } = await api.delete(
    `/api/dynamic/apps/${encodeURIComponent(appId)}/collections/${encodeURIComponent(cid)}/documents/${encodeURIComponent(docId)}`,
  );
  return data;
};

// ── Public ──────────────────────────────────────────────────────────────────
export const getPublicApp = async (slug) => {
  const { data } = await publicApi.get(
    `/api/dynamic/public/${encodeURIComponent(slug)}`,
  );
  return data;
};

export const getDynamicConfig = async () => {
  const { data } = await api.get("/api/dynamic/config");
  return data;
};
