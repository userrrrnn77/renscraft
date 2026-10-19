import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAppContext } from "../context/AppContext";

const readParam = (name) => {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.get(name) || hash.get(name);
};

const GRID_STYLE = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
  maskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
};

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loginWithSupabase } = useAppContext();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const fail = (message) =>
      navigate("/login", { replace: true, state: { authError: message } });

    const run = async () => {
      if (!supabase) {
        fail(t("auth.callbackNotConfigured"));
        return;
      }

      const providerError =
        readParam("error_description") || readParam("error");
      if (providerError) {
        fail(providerError);
        return;
      }

      const code = readParam("code");
      if (!code) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);
        const accessToken = data?.session?.access_token;
        if (error || !accessToken) {
          console.error("Supabase code exchange failed: ", error);
          fail(t("auth.callbackFailed"));
          return;
        }
        await loginWithSupabase(accessToken);
      } catch (err) {
        fail(err.message || t("auth.callbackFailed"));
      } finally {
        supabase.auth.signOut({ scope: "local" }).catch(() => {});
      }
    };

    run();
  }, [navigate, loginWithSupabase, t]);

  return (
    <div
      role="status"
      className="relative flex h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-zinc-950 text-zinc-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,#0b1220_0%,#09090b_60%,#050507_100%)]" />
        <div className="absolute inset-0" style={GRID_STYLE} />
        <div className="animate-drift absolute -top-32 left-1/2 -translate-x-1/2 size-105 rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 opacity-90">
          <img src="/logo.svg" alt="Renscraft" className="size-6" />
          <span className="text-base font-semibold tracking-tight">
            Renscraft
          </span>
        </div>
        <Loader2Icon className="animate-spin text-zinc-50" size={24} />
        <p className="text-sm text-zinc-400">{t("auth.signingIn")}</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
