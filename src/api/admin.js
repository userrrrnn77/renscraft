// src/api/admin.js

import api from "./api";

export const adminLogin = async (number, password) => {
  const { data } = await api.post("/api/admin/login", { number, password });
  return data;
};

export const adminLogout = async () => {
  const { data } = await api.post("/api/admin/logout");
  return data;
};

export const adminMe = async () => {
  const { data } = await api.get("/api/admin/me");
  return data;
};

export const adminStats = async () => {
  const { data } = await api.get("/api/admin/stats");
  return data;
};

export const adminListUsers = async ({ page = 1, limit = 25, q = "" } = {}) => {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) p.set("q", q);
  const { data } = await api.get(`/api/admin/users?${p}`);
  return data;
};

export const adminListProjects = async ({
  page = 1,
  limit = 25,
  status = "",
} = {}) => {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) p.set("status", status);
  const { data } = await api.get(`/api/admin/projects?${p}`);
  return data;
};

export const adminListOrders = async ({
  page = 1,
  limit = 25,
  status = "",
} = {}) => {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) p.set("status", status);
  const { data } = await api.get(`/api/admin/orders?${p}`);
  return data;
};

export const adminGrantCredits = async (userId, amount, reason = "") => {
  const { data } = await api.post(`/api/admin/users/${userId}/credits`, {
    amount,
    reason,
  });
  return data;
};

export const adminListRedeemCodes = async ({ page = 1, limit = 25 } = {}) => {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  const { data } = await api.get(`/api/admin/redeem?${p}`);
  return data;
};

export const adminCreateRedeemCode = async (payload) => {
  const { data } = await api.post("/api/admin/redeem", payload);
  return data;
};

export const adminDeleteRedeemCode = async (id) => {
  const { data } = await api.delete(`/api/admin/redeem/${id}`);
  return data;
};
