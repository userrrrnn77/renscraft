// FILE: client/src/api/projects.js
//
// Wrapper tipis untuk riwayat versi project
// (server/src/controllers/projectController.js: listProjectVersions,
// restoreProjectVersion). Tanpa state, tanpa toast: pemanggil yang memutuskan.
// Error berbentuk { error, code, params }, baca dengan errorMessage() dari ./api.
import api from "./api";

// GET /api/projects/:id/versions -> { versions }
// Tiap item (tanpa `files`): { _id, projectId, version, prompt, quality, createdAt }
// Urut dari versi terbaru. 404 project tidak ada.
export const listVersions = async (id) => {
  const { data } = await api.get(
    `/api/projects/${encodeURIComponent(id)}/versions`,
  );
  return data.versions ?? [];
};

// POST /api/projects/:id/versions/:v/restore -> project utuh (serializeProject)
// 400 INVALID_VERSION | 404 PROJECT_NOT_FOUND / VERSION_NOT_FOUND | 409 PROJECT_BUSY
export const restoreVersion = async (id, version) => {
  const { data } = await api.post(
    `/api/projects/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}/restore`,
  );
  return data;
};
