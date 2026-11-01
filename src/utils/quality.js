// FILE: client/src/utils/quality.js
//
// Bentuk `quality` mengikuti buildQualityReport() di server/src/services/quality.js:
// { status, issues: [{ code, severity, stage, path?, message, autoFixed? }],
//   stages, repairRounds, checkedAt, version }
// Tidak ada field skor/ringkasan di server, jadi ringkasan dihitung dari `issues`.

export const QUALITY_STATUSES = ["passed", "passed_with_warnings", "failed"];

export const isQualityFailed = (quality) => quality?.status === "failed";

// null kalau quality kosong (project lama) atau status tidak dikenal.
export function getQualitySummary(quality) {
  if (!quality || !QUALITY_STATUSES.includes(quality.status)) return null;
  const issues = Array.isArray(quality.issues) ? quality.issues : [];
  return {
    status: quality.status,
    blocking: issues.filter((i) => i?.severity === "blocking"),
    warnings: issues.filter((i) => i?.severity === "warning"),
  };
}
