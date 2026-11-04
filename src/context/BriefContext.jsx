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

const stripErrors = ({ errors, ...state }) => state;

const tt = (key, params) => i18n.t(key, params);

// Jangan auto-start saat brief butuh langkah Referensi tapi mode belum dipilih.
// needsReference true + refMode kosong => user harus lewat wizard dulu.
const blocksAutoStart = (state) => !!state?.needsReference && !state?.refMode;

export function BriefProvider({ children }) {
  const { user, onSessionReset } = useAuth();
  const { createFromPrompt, registerBriefDrop } = useProject();

  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const dropBrief = useCallback(() => {
    setBrief(null);
    clearStoredBrief();
  }, []);

  useEffect(() => onSessionReset(dropBrief), [onSessionReset, dropBrief]);
  useEffect(() => registerBriefDrop(dropBrief), [registerBriefDrop, dropBrief]);

  const startBrief = useCallback(
    async (prompt) => {
      if (!user) return false;
      setBriefLoading(true);
      try {
        const { briefId, status } = await createBrief(prompt);

        if (status === "classifying") {
          const DEADLINE_MS = 180_000;
          const startedAt = Date.now();

          while (Date.now() - startedAt < DEADLINE_MS) {
            await new Promise((r) => setTimeout(r, 1500));

            let state;
            try {
              state = await getBrief(briefId);
            } catch (pollErr) {
              if (pollErr?.response?.status === 404) {
                clearStoredBrief();
                toast.error(tt("toasts.briefExpired"));
                return false;
              }
              console.warn("getBrief poll failed: ", pollErr);
              continue;
            }

            if (state.status !== "classifying") {
              if (state.status === "failed") {
                clearStoredBrief();
                toast.error(tt("toasts.briefClassifyFailed"));
                return false;
              }
              if (state.autoStart && !blocksAutoStart(state)) {
                storeBrief(briefId);
                return Boolean(await createFromPrompt(null, briefId));
              }
              setBrief(state);
              storeBrief(briefId);
              return true;
            }
          }

          clearStoredBrief();
          toast.error(tt("toasts.briefClassifyTimeout"));
          return false;
        }

        const state = await getBrief(briefId);

        if (state.mode === "direct") {
          return Boolean(await createFromPrompt(prompt));
        }

        if (state.autoStart && !blocksAutoStart(state)) {
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

  // Simpan pilihan langkah Referensi. `refConsent === true` hanya dikirim untuk
  // mode remake; mode inspiration tidak butuh consent.
  const saveBriefReference = useCallback(
    async (refMode, refConsent) => {
      if (!brief) return { ok: false, error: tt("toasts.briefNotActive") };
      if (refMode !== "inspiration" && refMode !== "remake") {
        return { ok: false, error: tt("errors.BRIEF_REF_MODE_INVALID") };
      }
      if (refMode === "remake" && refConsent !== true) {
        return { ok: false, error: tt("errors.BRIEF_REF_CONSENT_REQUIRED") };
      }
      try {
        const body = { refMode };
        if (refConsent === true) body.refConsent = true;
        const data = await patchBrief(brief.briefId, body);
        setBrief(stripErrors(data));
        return { ok: true };
      } catch (err) {
        console.error("Failed to save brief reference: ", err);
        if (err?.response?.status === 404) {
          dropBrief();
          return { ok: false, error: tt("toasts.briefExpired") };
        }
        return {
          ok: false,
          error: errorMessage(err, tt("toasts.briefReferenceFailed")),
        };
      }
    },
    [brief, dropBrief],
  );

  const cancelBrief = useCallback(() => dropBrief(), [dropBrief]);

  // Lanjutkan wizard setelah refresh halaman.
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

        if (state.autoStart && !blocksAutoStart(state)) {
          createFromPrompt(null, id);
          return;
        }

        setBrief(state);
      })
      .catch((err) => {
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
        saveBriefReference,
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
