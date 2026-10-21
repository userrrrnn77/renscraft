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
  isConnectionLost,
  isInsufficientCredits,
  setUnauthorizedHandler,
} from "../api/api";
import { createBrief, getBrief, patchBrief } from "../api/briefs";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { showInsufficientCreditsToast } from "../utils/billingToast";
import i18n from "../i18n";

const AppContext = createContext(undefined);

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_FAILURES = 5;
const BUSY_STATUSES = ["pending", "generating", "revising"];

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

export function AppContextProvider({ children }) {
  const navigate = useNavigate();

  // Auth States

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  // Credit balance. Kept apart from `user` on purpose: it changes after every
  // generate / revision / refund, and `user` is a dependency of most callbacks
  // below (a new `user` object would refetch lists and restart polling).
  const [credits, setCredits] = useState(null);
  const userRef = useRef(null);

  // States
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeProject, setActivePorject] = useState(null);
  const [loadingActiveProject, setLoadingActiveProject] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingProject, setgeneratingProject] = useState(false);
  const [activeFile, setActiveFile] = useState("/App.js");
  const [showCode, setShowCode] = useState(false);

  // Brief / wizard: state dari server (null = tidak ada wizard aktif)
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Versi file terbaru hasil edit manual di editor Sandpack.
  // activeProject.files nggak ikut berubah waktu user ngedit, jadi disimpan di sini
  // (ref, supaya nggak bikin re-render tiap keystroke).
  const editedFilesRef = useRef(null); // { id, version, files }

  //  Auth Actions

  const applyCredits = useCallback((value) => {
    if (typeof value === "number") setCredits(value);
  }, []);

  const refreshCredits = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      applyCredits(data.user?.credits);
    } catch {
      // the balance is refreshed again on the next action
    }
  }, [applyCredits]);

  const checkSession = async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
      applyCredits(data.user?.credits);
    } catch (error) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Session expired while the app was open (any non-auth request answered 401):
  // sign out locally once. AuthLayout then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!userRef.current) return;
      userRef.current = null;
      setUser(null);
      setCredits(null);
      setProjects([]);
      setActivePorject(null);
      setBrief(null);
      clearStoredBrief();
      toast.error(tt("toasts.sessionExpired"));
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setUser(data.user);
      applyCredits(data.user?.credits);
      toast.success(tt("toasts.welcomeBack"));
      navigate("/chat");
    } catch (err) {
      console.error("Login failed: ", err);
      const errMsg = errorMessage(err, tt("toasts.loginFailed"));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      setUser(data.user);
      applyCredits(data.user?.credits);
      if (data.freeCredits > 0) {
        toast.success(
          tt("toasts.accountCreatedFreeCredits", { count: data.freeCredits }),
        );
      } else if (data.freeCreditsReason === "ip_limit") {
        toast.success(tt("toasts.accountCreatedIpLimit"));
      } else {
        toast.success(tt("toasts.accountCreated"));
      }
      navigate("/chat");
    } catch (err) {
      console.error("Register failed: ", err);
      const errMsg = errorMessage(err, tt("toasts.registerFailed"));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

  // Google / GitHub sign-in. Supabase only proves who the user is: the access
  // token is exchanged for the app's own HttpOnly session cookie, so everything
  // after this (/api/auth/me, 401 handling, logout) works as for a password login.
  // Errors are thrown (not toasted): AuthCallbackPage sends the user back to
  // /login and shows the message there. err.code is e.g. "EMAIL_ACCOUNT_EXISTS".
  const loginWithSupabase = async (accessToken) => {
    try {
      const { data } = await api.post("/api/auth/supabase/session", {
        accessToken,
      });
      setUser(data.user);
      applyCredits(data.user?.credits);
      toast.success(tt("toasts.signedIn"));
      navigate("/chat");
    } catch (err) {
      console.error("Supabase sign-in failed: ", err);
      const error = new Error(
        errorMessage(err, tt("toasts.supabaseSignInFailed")),
      );
      error.code = err?.response?.data?.code;
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
      userRef.current = null;
      setUser(null);
      setCredits(null);
      setProjects([]);
      setActivePorject(null);
      setBrief(null);
      clearStoredBrief();
      toast.success(tt("toasts.logoutSuccess"));
      navigate("/login");
    } catch (err) {
      console.error("Logout Failed: ", err);
      toast.error(tt("toasts.logoutFailed"));
    }
  };

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
        setActivePorject(data);
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
    }
  }, [activeProject?._id, activeProject?.status, refreshCredits]);

  // Membuat project. Jalur lama: createFromPrompt(prompt). Dari brief:
  // createFromPrompt(null, briefId): server memakai prompt yang tersimpan di brief.
  // Resolves true when the project was created, false otherwise, so the
  // prompt box only clears its text on success (nothing is lost on a 402).
  const createFromPrompt = useCallback(
    async (prompt, briefId = null) => {
      if (!user) return false;
      setgeneratingProject(true);
      try {
        const body = briefId ? { briefId } : { prompt };
        const { data } = await api.post("/api/projects", body);
        applyCredits(data.credits);
        if (briefId) {
          setBrief(null);
          clearStoredBrief();
        }
        toast.success(tt("toasts.aiPlanning"));
        navigate(`/chat/${data._id}`);
        return true;
      } catch (err) {
        console.error("Failed to generate project: ", err);
        const status = err?.response?.status;
        // Brief sudah hilang / terpakai di server: wizard tidak bisa dilanjutkan
        if (briefId && (status === 404 || status === 409)) {
          setBrief(null);
          clearStoredBrief();
        }
        if (isInsufficientCredits(err)) {
          applyCredits(err.response.data.credits);
          showInsufficientCreditsToast(
            errorMessage(err, tt("toasts.notEnoughCredits")),
          );
        } else {
          toast.error(errorMessage(err, tt("toasts.projectCreateFailed")));
        }
        return false;
      } finally {
        setgeneratingProject(false);
      }
    },
    [navigate, user, applyCredits],
  );

  // Alias lama. Pemakai yang menerima prompt bebas harus pindah ke startBrief
  // (grep "handleGenerate"); yang tersisa tetap jalan lewat jalur lama.
  const handleGenerate = createFromPrompt;

  // ─── Brief / wizard ────────────────────────────────────────────────────────

  // Pintu masuk prompt bebas (PromptInput + chip tag).
  // true = berhasil (PromptInput mengosongkan teks), false = gagal.
  const startBrief = useCallback(
    async (prompt) => {
      if (!user) return false;

      const { briefId, status } = await createBrief(prompt);

      if (status === "classifying") {
        // Poll GET /api/briefs/:id sampai status !== "classifying"
        while (true) {
          await new Promise((r) => setTimeout(r, 1500));
          const state = await getBrief(briefId);
          if (state.mode !== "classifying") {
            setBrief(state);
            storeBrief(briefId);
            return true;
          }
        }
      }

      setBriefLoading(true);
      try {
        const state = await createBrief(prompt);

        // Classifier gagal: pakai jalur lama
        if (state.mode === "direct") return await createFromPrompt(prompt);
        // Kategori tanpa slot (game, tool, dashboard): langsung generate
        if (state.autoStart) return await createFromPrompt(null, state.briefId);

        setBrief(state);
        storeBrief(state.briefId);
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

  // Brief hilang di server (kedaluwarsa / sudah dipakai): bersihkan wizard
  const dropBrief = useCallback(() => {
    setBrief(null);
    clearStoredBrief();
  }, []);

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

  // Lanjutkan wizard setelah refresh halaman
  useEffect(() => {
    if (!user) return;
    const id = readStoredBrief();
    if (!id) return;

    let cancelled = false;
    getBrief(id)
      .then((state) => {
        if (!cancelled) setBrief(state);
      })
      .catch((err) => {
        // 404 = kedaluwarsa / sudah dipakai: hapus diam-diam
        if (err?.response?.status === 404) clearStoredBrief();
      });
    return () => {
      cancelled = true;
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // POST /chat blocks until the revision is done (can take minutes). Resolves
  // true when the revision was applied, false otherwise.
  const handleChat = useCallback(
    async (prompt) => {
      if (!activeProject || !user) return false;

      const projectId = activeProject._id;
      setChatLoading(true);
      let keepLoading = false;

      try {
        const { data } = await api.post(`/api/projects/${projectId}/chat`, {
          prompt,
        });
        setActivePorject(data);
        editedFilesRef.current = null;
        applyCredits(data.credits);

        if (data.refunded > 0) {
          toast.error(tt("toasts.revisionNoChange"));
        } else if (data.errors && data.errors.length > 0) {
          toast.error(
            tt("toasts.revisionPatchesFailed", { count: data.errors.length }),
          );
        } else {
          toast.success(
            tt("toasts.revisionSuccess", { version: data.version }),
          );
        }
        return data.refunded > 0 ? false : true;
      } catch (err) {
        console.error("Revision request failed: ", err);

        if (isInsufficientCredits(err)) {
          applyCredits(err.response.data.credits);
          showInsufficientCreditsToast(
            errorMessage(err, tt("toasts.notEnoughCredits")),
          );
          return false;
        }

        // The failed revision was refunded by the server (it sends the balance)
        applyCredits(err?.response?.data?.credits);

        // A proxy / network timeout does not stop the server: the revision may
        // still be running. Look at the project instead of reporting a failure.
        if (isConnectionLost(err)) {
          const result = await loadProject(projectId, true);
          if (result?.ok && result.status === "revising") {
            keepLoading = true; // the polling effect takes over from here
            toast(tt("toasts.revisionStillRunning"));
            return true;
          }
        }

        toast.error(errorMessage(err, tt("toasts.revisionFailed")));
        return false;
      } finally {
        if (!keepLoading) setChatLoading(false);
      }
    },
    [activeProject, user, applyCredits, loadProject],
  );

  const debouncedSave = React.useMemo(
    () =>
      debounce(async (files, id) => {
        try {
          await api.put(`/api/projects/${id}/files`, { files });
        } catch (err) {
          console.error("Failed to autosave files: ", err);
          toast.error(tt("toasts.autosaveFailed"));
        }
      }, 1000),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

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
    <AppContext.Provider
      value={{
        user,
        credits,
        setUser,
        loadingUser,
        setLoadingUser,
        login,
        register,
        loginWithSupabase,
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
        logout,
        handleChat,
        updateProjectFiles,
        getLatestFiles,
        // dipakai BuyCreditsModal (sebelumnya belum diexpose)
        refreshCredits,
        // brief / wizard
        brief,
        briefLoading,
        startBrief,
        answerBrief,
        changeBriefCategory,
        cancelBrief,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
}
