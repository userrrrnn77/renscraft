// FILE: client/src/context/BriefContext.jsx
//
// Fase 6: dipindah apa adanya dari AppContext.jsx. Isi: wizard brief
// (startBrief, jawaban, kategori, slot tambahan, lanjut setelah refresh).
// Termasuk perubahan Fase 4 (hasil createFromPrompt dibungkus Boolean supaya
// kontrak startBrief tetap true/false).
//
// Dua pendaftaran di bawah menggantikan akses langsung ke state project/auth
// yang dulu ada karena semuanya satu komponen:
//   - onSessionReset(dropBrief): logout / sesi habis mengosongkan wizard.
//   - registerBriefDrop(dropBrief): createFromPrompt membuang wizard setelah
//     brief terpakai atau hilang di server (404/409).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { errorMessage } from "../api/api";
import { createBrief, getBrief, patchBrief } from "../api/briefs";
import toast from "react-hot-toast";
import i18n from "../i18n";
import { useAuth } from "./AuthContext";
import { useProject } from "./ProjectContext";

const BriefContext = createContext(undefined);

// briefId disimpan supaya wizard bisa dilanjutkan setelah refresh halaman.
// try/catch: sessionStorage bisa melempar (mode privat, storage diblokir).
const BRIEF_KEY = "renscraft:briefId";
const readStoredBrief = () => {
  try {
    return sessionStorage.getItem(BRIEF_KEY);
  } catch {
    return null;
  }
};
const storeBrief = (id) => {
  try {
    sessionStorage.setItem(BRIEF_KEY, id);
  } catch {
    // wizard tetap jalan, hanya tidak bisa dilanjutkan setelah refresh
  }
};
const clearStoredBrief = () => {
  try {
    sessionStorage.removeItem(BRIEF_KEY);
  } catch {
    // tidak ada yang perlu dilakukan
  }
};

// Server membalas PATCH dengan state + errors. `errors` bukan bagian state.
const stripErrors = ({ errors, ...state }) => state;

// Helper buat toast ber-translate. Dipakai di luar render, jadi pakai
// i18n.t langsung (bukan useTranslation). Interpolasi params dioper
// sebagai argumen kedua.
const tt = (key, params) => i18n.t(key, params);

export function BriefProvider({ children }) {
  const { user, onSessionReset } = useAuth();
  const { createFromPrompt, registerBriefDrop } = useProject();

  // Brief / wizard: state dari server (null = tidak ada wizard aktif)
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Brief hilang di server (kedaluwarsa / sudah dipakai): bersihkan wizard
  const dropBrief = useCallback(() => {
    setBrief(null);
    clearStoredBrief();
  }, []);

  useEffect(() => onSessionReset(dropBrief), [onSessionReset, dropBrief]);
  useEffect(() => registerBriefDrop(dropBrief), [registerBriefDrop, dropBrief]);

  // ─── Brief / wizard ────────────────────────────────────────────────────────

  // Pintu masuk prompt bebas (PromptInput + chip tag).
  // true = berhasil (PromptInput mengosongkan teks), false = gagal.
  const startBrief = useCallback(
    async (prompt) => {
      if (!user) return false;
      setBriefLoading(true);
      try {
        const { briefId, status } = await createBrief(prompt);

        // ─── Classifying: poll dengan deadline ──────────────────────────────
        // Classifier jalan di background (server balikin "classifying" duluan).
        // Server-side timeout 45s + 1 retry (maxRetries=1 di classifier.js)
        // → worst case ~90s. Kalau lewat dari ini, ada bug / hang di server.
        if (status === "classifying") {
          const DEADLINE_MS = 180_000;
          const startedAt = Date.now();

          while (Date.now() - startedAt < DEADLINE_MS) {
            await new Promise((r) => setTimeout(r, 1500));

            let state;
            try {
              state = await getBrief(briefId);
            } catch (pollErr) {
              // 404 = brief hilang/expired di server. Bukan network error.
              if (pollErr?.response?.status === 404) {
                clearStoredBrief();
                toast.error(tt("toasts.briefExpired"));
                return false;
              }
              // Network hiccup sesaat: lanjut polling, jangan bail langsung.
              // Deadline loop tetap yang jadi pengaman terakhir.
              console.warn("getBrief poll failed: ", pollErr);
              continue;
            }

            if (state.status !== "classifying") {
              // Server sudah menyelesaikan retry loop. Kalau status "failed",
              // 3 attempt gagal — jangan jatuh ke wizard generic, minta user
              // submit ulang. Prompt input tetap ada, gak di-clear.
              if (state.status === "failed") {
                clearStoredBrief();
                toast.error(tt("toasts.briefClassifyFailed"));
                return false;
              }
              if (state.autoStart) {
                // Semua slot udah ke-extract / kategori nggak butuh slot.
                // storeBrief dulu biar kalau createFromPrompt gagal di tengah
                // jalan (mis. 402), refresh masih bisa recover wizard-nya.
                storeBrief(briefId);
                return Boolean(await createFromPrompt(null, briefId));
              }
              setBrief(state);
              storeBrief(briefId);
              return true;
            }
          }

          // Deadline lewat: status masih "classifying" di DB. Jangan biarkan
          // user stuck di spinner. Bersihin storage biar refresh tidak
          // restore state rusak ini.
          clearStoredBrief();
          toast.error(tt("toasts.briefClassifyTimeout"));
          return false;
        }

        // ─── Non-classifying: server udah balikin state final ──────────────
        // Saat ini unreachable (controller selalu balikin "classifying"),
        // tapi disiapkan buat future kalau classifier dijadikan sync.
        const state = await getBrief(briefId);

        if (state.mode === "direct") {
          // Classifier gagal total: fallback ke jalur lama (generate langsung
          // pakai prompt mentah, tanpa wizard).
          return Boolean(await createFromPrompt(prompt));
        }

        if (state.autoStart) {
          storeBrief(briefId);
          return Boolean(await createFromPrompt(null, briefId));
        }

        setBrief(state);
        storeBrief(briefId);
        return true;
      } catch (err) {
        console.error("Failed to start brief: ", err);
        toast.error(errorMessage(err, tt("toasts.briefStartFailed")));
        return false;
      } finally {
        setBriefLoading(false);
      }
    },
    [user, createFromPrompt],
  );

  const addBriefExtra = useCallback(
    async ({ label, kind, value }) => {
      if (!brief) return { ok: false };
      try {
        const data = await patchBrief(brief.briefId, {
          extraSlots: [{ label, kind, value }],
        });
        setBrief(stripErrors(data));
        return { ok: true };
      } catch (err) {
        if (err?.response?.status === 404) {
          dropBrief();
          toast.error(errorMessage(err, tt("toasts.briefExpired")));
        } else {
          toast.error(errorMessage(err, tt("toasts.briefExtraFailed")));
        }
        return { ok: false };
      }
    },
    [brief, dropBrief],
  );

  const removeBriefExtra = useCallback(
    async (key) => {
      if (!brief) return;
      try {
        const data = await patchBrief(brief.briefId, {
          removeExtraSlots: [key],
        });
        setBrief(stripErrors(data));
      } catch (err) {
        if (err?.response?.status === 404) dropBrief();
      }
    },
    [brief, dropBrief],
  );

  // Kirim jawaban. Mengembalikan { [slotKey]: "pesan" } (kosong = sukses).
  // Kegagalan jaringan dikembalikan sebagai { __error } supaya wizard tetap
  // di pertanyaan yang sama.
  const answerBrief = useCallback(
    async (answers) => {
      if (!brief) return { __error: tt("toasts.briefNotActive") };
      try {
        const data = await patchBrief(brief.briefId, { answers });
        setBrief(stripErrors(data));
        return data.errors ?? {};
      } catch (err) {
        console.error("Failed to answer brief: ", err);
        if (err?.response?.status === 404) {
          dropBrief();
          toast.error(errorMessage(err, tt("toasts.briefExpired")));
          return {};
        }
        return {
          __error: errorMessage(err, tt("toasts.briefAnswerFailed")),
        };
      }
    },
    [brief, dropBrief],
  );

  const changeBriefCategory = useCallback(
    async (categoryId) => {
      if (!brief) return;
      try {
        const data = await patchBrief(brief.briefId, { category: categoryId });
        setBrief(stripErrors(data));
      } catch (err) {
        console.error("Failed to change brief category: ", err);
        if (err?.response?.status === 404) dropBrief();
        toast.error(errorMessage(err, tt("toasts.briefCategoryFailed")));
      }
    },
    [brief, dropBrief],
  );

  const cancelBrief = useCallback(() => dropBrief(), [dropBrief]);

  // R4: kalau server bilang autoStart (questionKeys kosong karena semua
  // must-have udah ke-extract), langsung generate — jangan balik ke wizard
  // walau user refresh di tengah proses.
  // Lanjutkan wizard setelah refresh halaman.
  //
  // status "failed" = 3 attempt classifier gagal. Bersihin storage diam-diam
  // (jangan toast lagi, user baru buka tab). User tinggal submit ulang.
  useEffect(() => {
    if (!user) return;
    const id = readStoredBrief();
    if (!id) return;

    let cancelled = false;
    getBrief(id)
      .then((state) => {
        if (cancelled) return;

        if (state.status === "failed") {
          clearStoredBrief();
          return;
        }

        if (state.autoStart) {
          createFromPrompt(null, id);
          return;
        }

        setBrief(state);
      })
      .catch((err) => {
        // 404 = kedaluwarsa / sudah dipakai: hapus diam-diam
        if (err?.response?.status === 404) clearStoredBrief();
      });

    return () => {
      cancelled = true;
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BriefContext.Provider
      value={{
        brief,
        briefLoading,
        startBrief,
        answerBrief,
        changeBriefCategory,
        cancelBrief,
        addBriefExtra,
        removeBriefExtra,
      }}>
      {children}
    </BriefContext.Provider>
  );
}

export function useBrief() {
  const context = useContext(BriefContext);
  if (context === undefined) {
    throw new Error("useBrief must be used within a BriefProvider");
  }
  return context;
}
