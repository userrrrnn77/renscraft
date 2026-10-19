// src/api/briefs.js
//
// Wrapper tipis untuk /api/briefs (server/src/controllers/briefController.js).
// Tanpa state, tanpa toast: pemanggil yang memutuskan. Error berbentuk
// { error: string }, baca dengan errorMessage() dari ./api.
import api from "./api";

// POST /api/briefs { prompt }
// -> state wizard (lihat PRD §6.4) atau { mode: "direct" } kalau classifier gagal
// 400 prompt kosong/terlalu panjang | 429 terlalu banyak percobaan
export const createBrief = async (prompt) => {
  const { data } = await api.post("/api/briefs", { prompt });
  return data;
};

// PATCH /api/briefs/:id { answers?, category? }
// answers: { [slotKey]: "nilai" | null }  (null = Lewati)
// -> state + { errors: { [slotKey]: "pesan" } }
export const patchBrief = async (id, body) => {
  const { data } = await api.patch(
    `/api/briefs/${encodeURIComponent(id)}`,
    body,
  );
  return data;
};

// GET /api/briefs/:id -> state (dipakai untuk melanjutkan wizard setelah refresh)
export const getBrief = async (id) => {
  const { data } = await api.get(`/api/briefs/${encodeURIComponent(id)}`);
  return data;
};