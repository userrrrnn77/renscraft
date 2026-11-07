// FILE: client/src/context/AuthContext.jsx
//
// Fase 6: dipindah apa adanya dari AppContext.jsx. Isi: sesi user, saldo
// kredit, login/register/logout, handler 401, dan flag dynamic apps.
//
// Satu-satunya tambahan kode: registry `onSessionReset`. Dulu logout dan
// handler 401 langsung mengosongkan projects / activeProject / brief karena
// semuanya satu komponen. Sekarang ProjectContext dan BriefContext mendaftarkan
// fungsi reset-nya lewat registry ini, dan dipanggil di titik yang sama.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api, { errorMessage, setUnauthorizedHandler } from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getDynamicConfig } from "../api/dynamicApps";
import i18n from "../i18n";
import { resetPaymentMethods } from "../utils/topup";

const AuthContext = createContext(undefined);

// Helper buat toast ber-translate. Dipakai di luar render, jadi pakai
// i18n.t langsung (bukan useTranslation). Interpolasi params dioper
// sebagai argumen kedua.
const tt = (key, params) => i18n.t(key, params);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  // Credit balance. Kept apart from `user` on purpose: it changes after every
  // generate / revision / refund, and `user` is a dependency of most callbacks
  // below (a new `user` object would refetch lists and restart polling).
  const [credits, setCredits] = useState(null);
  const [dynamicAppsEnabled, setDynamicAppsEnabled] = useState(false);
  const userRef = useRef(null);

  // Registry reset sesi: context lain mendaftar di sini supaya state-nya ikut
  // dikosongkan saat logout / sesi habis. Mengembalikan fungsi unsubscribe.
  const sessionResetRef = useRef(new Set());
  const onSessionReset = useCallback((fn) => {
    sessionResetRef.current.add(fn);
    return () => {
      sessionResetRef.current.delete(fn);
    };
  }, []);
  const runSessionReset = useCallback(() => {
    sessionResetRef.current.forEach((fn) => fn());
  }, []);

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
    getDynamicConfig()
      .then((data) => setDynamicAppsEnabled(Boolean(data?.enabled)))
      .catch(() => setDynamicAppsEnabled(false));
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Metode pembayaran beda per akun: buang cache tiap login / logout / sesi habis
  useEffect(() => {
    resetPaymentMethods();
  }, [user?.email]);

  // Session expired while the app was open (any non-auth request answered 401):
  // sign out locally once. AuthLayout then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!userRef.current) return;
      userRef.current = null;
      setUser(null);
      setCredits(null);
      runSessionReset();
      toast.error(tt("toasts.sessionExpired"));
    });
    return () => setUnauthorizedHandler(null);
  }, [runSessionReset]);

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

  // ─── Register (2-step: request-otp → verify-otp) ──────────────────────────

  const registerRequestOtp = useCallback(
    async ({ name, email, password, referralCode = null }) => {
      try {
        const { data } = await api.post("/api/auth/register/request-otp", {
          name,
          email,
          password,
          referralCode: referralCode || undefined,
        });
        return data;
      } catch (err) {
        const errMsg = errorMessage(err, tt("toasts.registerFailed"));
        throw new Error(errMsg);
      }
    },
    [],
  );

  const registerVerifyOtp = useCallback(
    async (otpId, code) => {
      try {
        const { data } = await api.post("/api/auth/register/verify-otp", {
          otpId,
          code,
        });

        setUser(data.user);
        applyCredits(data.user?.credits);

        if (data.creditsSource === "referral") {
          toast.success(
            tt("toasts.accountCreatedReferral", { count: data.creditsAwarded }),
          );
        } else if (data.creditsSource === "free_signup") {
          toast.success(
            tt("toasts.accountCreatedFreeCredits", {
              count: data.creditsAwarded,
            }),
          );
        } else {
          toast.success(tt("toasts.accountCreated"));
        }
        navigate("/chat");
        return data;
      } catch (err) {
        const errMsg = errorMessage(err, tt("toasts.registerFailed"));
        throw new Error(errMsg);
      }
    },
    [navigate, applyCredits],
  );

  const registerResendOtp = useCallback(async (otpId) => {
    try {
      const { data } = await api.post("/api/auth/register/resend-otp", {
        otpId,
      });
      return data;
    } catch (err) {
      const errMsg = errorMessage(err, tt("toasts.registerFailed"));
      throw new Error(errMsg);
    }
  }, []);

  // Google / GitHub sign-in. Supabase only proves who the user is: the access
  // token is exchanged for the app's own HttpOnly session cookie, so everything
  // after this (/api/auth/me, 401 handling, logout) works as for a password login.
  // Errors are thrown (not toasted): AuthCallbackPage sends the user back to
  // /login and shows the message there. err.code is e.g. "EMAIL_ACCOUNT_EXISTS".
  const loginWithSupabase = async (accessToken, referralCode = null) => {
    try {
      const { data } = await api.post("/api/auth/supabase/session", {
        accessToken,
        ...(referralCode ? { referralCode } : {}),
      });
      setUser(data.user);
      applyCredits(data.user?.credits);

      if (data.creditsSource === "referral") {
        toast.success(
          tt("toasts.accountCreatedReferral", { count: data.creditsAwarded }),
        );
      } else if (data.creditsSource === "free_signup") {
        toast.success(
          tt("toasts.accountCreatedFreeCredits", {
            count: data.creditsAwarded,
          }),
        );
      } else {
        toast.success(tt("toasts.signedIn"));
      }
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
      runSessionReset();
      toast.success(tt("toasts.logoutSuccess"));
      navigate("/login");
    } catch (err) {
      console.error("Logout Failed: ", err);
      toast.error(tt("toasts.logoutFailed"));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        credits,
        setUser,
        loadingUser,
        setLoadingUser,
        login,
        // register,
        loginWithSupabase,
        logout,
        registerRequestOtp,
        registerVerifyOtp,
        registerResendOtp,
        // dipakai BuyCreditsModal (sebelumnya belum diexpose)
        refreshCredits,
        dynamicAppsEnabled,
        // internal (dipakai ProjectContext / BriefContext)
        applyCredits,
        onSessionReset,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
