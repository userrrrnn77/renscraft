// Patch locale Fase 3 in-place, tanpa menyentuh key lain. Idempotent.
// Pakai: node apply-locales-fase3.mjs src/locales
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "src/locales";

const patches = {
  "en.json": {
    chat: { revising: "AI is revising your website..." },
    projectErrors: {
      REVISION_ABORTED:
        "The revision was aborted because some operations failed. Your project is unchanged and the credits were refunded.",
      CHAT_FAILED:
        "Failed to process the revision. Your project is unchanged and the credits were refunded.",
    },
  },
  "id.json": {
    chat: { revising: "AI sedang merevisi website kamu..." },
    projectErrors: {
      REVISION_ABORTED:
        "Revisi dibatalkan karena ada operasi yang gagal. Project tidak berubah dan kredit sudah dikembalikan.",
      CHAT_FAILED:
        "Gagal memproses revisi. Project tidak berubah dan kredit sudah dikembalikan.",
    },
  },
};

for (const [file, groups] of Object.entries(patches)) {
  const p = path.join(dir, file);
  const json = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const [group, entries] of Object.entries(groups)) {
    json[group] = { ...(json[group] || {}), ...entries };
  }
  fs.writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
  console.log(`patched ${p}`);
}
