// FILE: client/src/context/ProjectContext.jsx
//
// Fase 6: dipindah apa adanya dari AppContext.jsx. Isi: daftar project,
// project aktif, polling, create/delete, chat (revisi async), autosave.
// Termasuk perubahan Fase 4 (createFromPrompt -> id/null + opsi navigate,
// flushAutosave) dan Fase 5 (setActiveProject).
//
// Saldo kredit tetap di AuthContext (login/register/logout ikut mengubahnya);
// di sini dipakai lewat applyCredits / refreshCredits.
//
// Tambahan kode untuk memutus ketergantungan melingkar dengan BriefContext:
// `registerBriefDrop`. Dulu createFromPrompt langsung memanggil
// setBrief(null) + clearStoredBrief(); sekarang BriefContext mendaftarkan
// fungsi itu, dan dipanggil di titik yang sama.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api, {
  errorMessage,
  projectErrorMessage,
  isInsufficientCredits,
} from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { showInsufficientCreditsToast } from "../utils/billingToast";
import i18n from "../i18n";
import { useAuth } from "./AuthContext";

const ProjectContext = createContext(undefined);

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_FAILURES = 5;
const BUSY_STATUSES = ["pending", "generating", "revising"];

// Helper buat toast ber-translate. Dipakai di luar render, jadi pakai
// i18n.t langsung (bukan useTranslation). Interpolasi params dioper
// sebagai argumen kedua.
const tt = (key, params) => i18n.t(key, params);

export function ProjectProvider({ children }) {
  const navigate = useNavigate();
  const { user, applyCredits, refreshCredits, onSessionReset } = useAuth();

  // States
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingActiveProject, setLoadingActiveProject] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingProject, setgeneratingProject] = useState(false);
  const [activeFile, setActiveFile] = useState("/App.js");
  const [showCode, setShowCode] = useState(false);

  // Versi file terbaru hasil edit manual di editor Sandpack.
  // activeProject.files nggak ikut berubah waktu user ngedit, jadi disimpan di sini
  // (ref, supaya nggak bikin re-render tiap keystroke).
  const editedFilesRef = useRef(null); // { id, version, files }

  // Logout / sesi habis: kosongkan state project (dulu ada di logout dan
  // handler 401 di AppContext).
  useEffect(
    () =>
      onSessionReset(() => {
        setProjects([]);
        setActiveProject(null);
      }),
    [onSessionReset],
  );

  // BriefContext mendaftarkan fungsi "buang wizard" di sini.
  const briefDropRef = useRef(null);
  const registerBriefDrop = useCallback((fn) => {
    briefDropRef.current = fn;
    return () => {
      if (briefDropRef.current === fn) briefDropRef.current = null;
    };
  }, []);

  // Projects Actions

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/api/projects");
      setProjects(data);
    } catch (err) {
      console.error("Failed to list Projects: ", err);
      toast.error(tt("toasts.projectsLoadFailed"));
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  const loadProject = useCallback(
    async (id, silent = false) => {
      if (!user) return { ok: false, fatal: true };
      if (!silent) setLoadingActiveProject(true);
      try {
        const { data } = await api.get(`/api/projects/${id}`);
        setActiveProject(data);
        editedFilesRef.current = null;

        const files = Object.keys(data.files || {});

        if (files.length > 0) {
          setActiveFile((prev) => {
            if (files.includes(prev)) return prev;
            if (files.includes("/App.js")) return "/App.js";
            return files[0];
          });
        }
        return { ok: true, status: data.status };
      } catch (err) {
        console.error("Failed to load projects: ", err);
        if (!silent) {
          toast.error(tt("toasts.projectLoadFailed"));
          navigate("/chat");
        }
        const status = err?.response?.status;
        return { ok: false, fatal: status === 401 || status === 404 };
      } finally {
        if (!silent) setLoadingActiveProject(false);
      }
    },
    [user, navigate],
  );

  // Automatically poll active project status if generating or pending

  useEffect(() => {
    if (!activeProject?._id || !user) return;

    const isOngoing = BUSY_STATUSES.includes(activeProject.status);

    if (!isOngoing) {
      setChatLoading(false);
      return;
    }

    setChatLoading(true);

    // Recursive setTimeout instead of setInterval: the next poll only starts
    // after the previous one finished, so slow responses never pile up.
    const id = activeProject._id;
    let cancelled = false;
    let timer;
    let failures = 0;

    const poll = async () => {
      const result = await loadProject(id, true);
      if (cancelled) return;

      failures = result?.ok ? 0 : failures + 1;

      // Stop on 401/404 (session expired, project deleted) or repeated errors
      // instead of hammering the server forever.
      if (result?.fatal || failures >= MAX_POLL_FAILURES) {
        setChatLoading(false);
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeProject?._id, activeProject?.status, loadProject, user]);

  // A job that finished, failed or timed out was settled on the server (a failed
  // one is refunded), so the balance we show may be stale: fetch it again.
  // Untuk revisi (async, hasil dibaca dari polling), transisi
  // revising -> bukan busy juga memunculkan toast hasil dari project.errorCode:
  // null = sukses, selain itu = error (REVISION_NO_CHANGE / ABORTED / TIMEOUT / CHAT_FAILED).
  const prevJobRef = useRef(null); // { id, status }
  useEffect(() => {
    const id = activeProject?._id;
    const status = activeProject?.status;
    const prev = prevJobRef.current;
    prevJobRef.current = { id, status };
    if (
      prev &&
      prev.id === id &&
      BUSY_STATUSES.includes(prev.status) &&
      !BUSY_STATUSES.includes(status)
    ) {
      refreshCredits();

      if (prev.status === "revising") {
        if (activeProject.errorCode) {
          toast.error(
            projectErrorMessage(activeProject, tt("toasts.revisionFailed")),
          );
        } else {
          toast.success(
            tt("toasts.revisionSuccess", { version: activeProject.version }),
          );
        }
      }
    }
  }, [
    activeProject?._id,
    activeProject?.status,
    activeProject?.errorCode,
    activeProject?.version,
    refreshCredits,
  ]);

  // Membuat project. Jalur lama: createFromPrompt(prompt). Dari brief:
  // createFromPrompt(null, briefId): server memakai prompt yang tersimpan di brief.
  // Resolves ke _id project baru kalau berhasil, null kalau gagal. Truthy =
  // sukses, jadi pemakai lama yang cuma cek `if (ok)` tetap jalan, dan prompt
  // box cuma mengosongkan teks saat sukses (tidak hilang waktu 402).
  // Opsi { navigate: false }: jangan pindah halaman (dipakai retry, yang baru
  // menghapus project lama dan pindah setelah project baru berhasil dibuat).
  const createFromPrompt = useCallback(
    async (
      prompt,
      briefId = null,
      { navigate: shouldNavigate = true } = {},
    ) => {
      if (!user) return null;
      setgeneratingProject(true);
      try {
        const body = briefId ? { briefId } : { prompt };
        const { data } = await api.post("/api/projects", body);
        applyCredits(data.credits);
        if (briefId) {
          briefDropRef.current?.();
        }
        toast.success(tt("toasts.aiPlanning"));
        if (shouldNavigate) navigate(`/chat/${data._id}`);
        return data._id;
      } catch (err) {
        console.error("Failed to generate project: ", err);
        const status = err?.response?.status;
        // Brief sudah hilang / terpakai di server: wizard tidak bisa dilanjutkan
        if (briefId && (status === 404 || status === 409)) {
          briefDropRef.current?.();
        }
        if (isInsufficientCredits(err)) {
          applyCredits(err.response.data.credits);
          showInsufficientCreditsToast(
            errorMessage(err, tt("toasts.notEnoughCredits")),
          );
        } else {
          toast.error(errorMessage(err, tt("toasts.projectCreateFailed")));
        }
        return null;
      } finally {
        setgeneratingProject(false);
      }
    },
    [navigate, user, applyCredits],
  );

  // Alias lama. Pemakai yang menerima prompt bebas harus pindah ke startBrief
  // (grep "handleGenerate"); yang tersisa tetap jalan lewat jalur lama.
  const handleGenerate = createFromPrompt;

  const handleDelete = useCallback(
    async (id) => {
      if (!user) return;

      try {
        await api.delete(`/api/projects/${id}`);
        setProjects((prev) => prev.filter((p) => p._id !== id));
        toast.success(tt("toasts.projectDeleted"));
      } catch (err) {
        console.error("Failed to deleted project: ", err);
        toast.error(tt("toasts.projectDeleteFailed"));
      }
    },
    [user],
  );

  // POST /chat balas 202: validasi + charge + lock + pesan user sudah beres di
  // server, revisinya jalan di background. Hasil akhir (sukses / no-change /
  // aborted / timeout / gagal) dibaca dari polling, lihat effect prevJobRef.
  // Resolves true kalau revisi DITERIMA server (prompt boleh di-clear), false
  // kalau ditolak (402, 409 PROJECT_BUSY, dll).
  const handleChat = useCallback(
    async (prompt) => {
      if (!activeProject || !user) return false;

      const projectId = activeProject._id;
      setChatLoading(true);
      let accepted = false;

      try {
        const { data } = await api.post(`/api/projects/${projectId}/chat`, {
          prompt,
        });
        // Body 202 = project (status "revising", pesan user sudah ada) + credits.
        const { credits: balance, ...project } = data;
        setActiveProject(project);
        editedFilesRef.current = null;
        applyCredits(balance);
        accepted = true; // loading dipegang polling effect sampai status selesai
        return true;
      } catch (err) {
        console.error("Revision request failed: ", err);

        if (isInsufficientCredits(err)) {
          applyCredits(err.response.data.credits);
          showInsufficientCreditsToast(
            errorMessage(err, tt("toasts.notEnoughCredits")),
          );
          return false;
        }

        // 409 PROJECT_BUSY dan error lain: pesan sesuai code dari server.
        applyCredits(err?.response?.data?.credits);
        toast.error(errorMessage(err, tt("toasts.revisionFailed")));
        return false;
      } finally {
        if (!accepted) setChatLoading(false);
      }
    },
    [activeProject, user, applyCredits],
  );

  const debouncedSave = React.useMemo(
    () =>
      debounce(async (files, id) => {
        try {
          await api.put(`/api/projects/${id}/files`, { files });
        } catch (err) {
          console.error("Failed to autosave files: ", err);
          toast.error(errorMessage(err, tt("toasts.autosaveFailed")));
        }
      }, 1000),
    [],
  );

  // Flush autosave saat tab disembunyikan atau halaman mau ditutup,
  // supaya edit dalam ~1 detik terakhir tidak hilang.
  useEffect(() => {
    const flushOnHidden = () => {
      if (document.visibilityState === "hidden") debouncedSave.flush();
    };
    const flushBeforeUnload = () => debouncedSave.flush();

    document.addEventListener("visibilitychange", flushOnHidden);
    window.addEventListener("beforeunload", flushBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", flushOnHidden);
      window.removeEventListener("beforeunload", flushBeforeUnload);
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  // Tunggu autosave yang tertunda (atau sedang jalan) selesai. flush() lodash
  // mengembalikan promise dari pemanggilan terakhir; error sudah ditangani di
  // dalam debouncedSave, jadi ini tidak pernah reject.
  const flushAutosave = useCallback(
    () => debouncedSave.flush(),
    [debouncedSave],
  );

  const updateProjectFiles = useCallback(
    async (files) => {
      if (!activeProject || !user) return;

      editedFilesRef.current = {
        id: activeProject._id,
        version: activeProject.version,
        files,
      };
      debouncedSave(files, activeProject._id);
    },
    [activeProject, user, debouncedSave],
  );

  // Ganti project aktif dengan hasil dari server (mis. restore versi). Edit
  // manual yang belum tersimpan dibuang dan activeFile disesuaikan, sama
  // seperti loadProject.
  const applyActiveProject = useCallback((project) => {
    setActiveProject(project);
    editedFilesRef.current = null;
    const files = Object.keys(project?.files || {});
    if (files.length > 0) {
      setActiveFile((prev) => {
        if (files.includes(prev)) return prev;
        if (files.includes("/App.js")) return "/App.js";
        return files[0];
      });
    }
  }, []);

  // File terbaru yang beneran tampil di editor (termasuk edit manual yang belum / baru disimpan).
  // Dipakai buat Download ZIP. Otomatis invalid kalau project / version-nya udah beda.
  const getLatestFiles = useCallback(() => {
    const edited = editedFilesRef.current;
    if (
      edited &&
      activeProject &&
      edited.id === activeProject._id &&
      edited.version === activeProject.version
    ) {
      return edited.files;
    }
    return activeProject?.files;
  }, [activeProject]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loadingProjects,
        activeProject,
        loadingActiveProject,
        chatLoading,
        generatingProject,
        activeFile,
        showCode,
        setActiveFile,
        setShowCode,
        loadProject,
        loadProjects,
        createFromPrompt,
        handleGenerate,
        handleDelete,
        handleChat,
        updateProjectFiles,
        getLatestFiles,
        flushAutosave,
        setActiveProject: applyActiveProject,
        // internal (dipakai BriefContext)
        registerBriefDrop,
      }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
