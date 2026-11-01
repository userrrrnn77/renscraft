// src/api/status.js

const BASE = (import.meta.env.VITE_STATUS_API_URL || "").replace(/\/+$/, "");

export const fetchStatus = async (signal) => {
  if (!BASE) throw new Error("STATUS_NOT_CONFIGURED");
  const res = await fetch(`${BASE}/api/status`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`STATUS_HTTP_${res.status}`);
  return res.json();
};
