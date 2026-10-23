import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);

const PROVIDERS = [
  { id: "google", labelKey: "auth.continueWithGoogle", Icon: GoogleIcon },
  { id: "github", labelKey: "auth.continueWithGithub", Icon: GithubIcon },
];

const OAuthButtons = ({ disabled = false, onStart, onError }) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const reset = (e) => {
      if (e.persisted) setPending(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  if (!isSupabaseConfigured) return null;

  const start = async (provider) => {
    onStart?.();
    setPending(provider);
    try {
      // Simpan referral — OAuth redirect full-page, URL query bisa saja
      // nggak ikut kalau Supabase dashboard cuma whitelist path exact.
      if (referralCode) {
        try {
          sessionStorage.setItem("renscraft:pendingReferral", referralCode);
        } catch {}
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      console.error("OAuth start failed: ", err);
      setPending(null);
      try {
        sessionStorage.removeItem("renscraft:pendingReferral");
      } catch {}
      onError?.(t("auth.oauthStartFailed"));
    }
  };

  return (
    <>
      <div className="space-y-3">
        {PROVIDERS.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => start(id)}
            disabled={disabled || pending !== null}
            // Perubahan ada di className di bawah ini bre:
            // Gw ganti text-zinc-900 jadi text-zinc-50, border jadi border-white/10, bg ditambahin bg-white/5 biar glass.
            className="w-full py-2.5 border border-white/10 bg-white/5 rounded-lg text-sm font-medium text-zinc-50 hover:bg-white/10 disabled:opacity-40 flex items-center justify-center gap-2.5 cursor-pointer transition-colors">
            {pending === id ? (
              <Loader2Icon className="animate-spin h-4 w-4" />
            ) : (
              <Icon />
            )}
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 my-7" role="separator">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-zinc-400">{t("auth.orUseEmail")}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </>
  );
};

export default OAuthButtons;
