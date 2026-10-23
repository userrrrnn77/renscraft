import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckIcon,
  CoinsIcon,
  CopyIcon,
  GiftIcon,
  Link2Icon,
  Loader2Icon,
  LogOutIcon,
} from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/AppContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
import { openTopUp } from "../utils/topup";
import { errorMessage } from "../api/api";
import { redeemCode } from "../api/redeem";
import { getMyReferral } from "../api/referral";

// ─── Referral card ─────────────────────────────────────────────────────────

const ReferralCard = () => {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true });
  const [copied, setCopied] = useState(null); // "code" | "link" | null

  useEffect(() => {
    let cancelled = false;
    getMyReferral()
      .then((data) => {
        if (!cancelled) setState({ loading: false, data });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: errorMessage(err, t("profile.referralLoadFailed")),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const copy = async (text, kind, toastKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(t(toastKey));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("common.copy") + " failed");
    }
  };

  if (state.loading) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2Icon size={14} className="animate-spin" />
          {t("profile.referralLoading")}
        </div>
      </section>
    );
  }

  if (state.error) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      </section>
    );
  }

  const { code, redemptionCount = 0, totalEarned = 0 } = state.data;
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?referral=${code}`
      : "";

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-1">
        <GiftIcon size={15} className="text-zinc-500 dark:text-zinc-400" />
        <p className="text-sm font-medium">{t("profile.referral")}</p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t("profile.referralSub")}
      </p>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {t("profile.referralCode")}
        </p>
        <p className="mt-0.5 font-mono text-lg font-semibold tracking-wider text-zinc-900 dark:text-zinc-50">
          {code}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => copy(code, "code", "toasts.referralCodeCopied")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          {copied === "code" ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          {t("profile.referralCopyCode")}
        </button>
        <button
          type="button"
          onClick={() => copy(link, "link", "toasts.referralLinkCopied")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
          {copied === "link" ? (
            <CheckIcon size={12} />
          ) : (
            <Link2Icon size={12} />
          )}
          {t("profile.referralCopyLink")}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {t("profile.referralRedemptions", { count: redemptionCount })}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {t("profile.referralEarned", { count: totalEarned })}
          </p>
        </div>
        <CoinsIcon size={16} className="text-zinc-400 dark:text-zinc-500" />
      </div>

      {redemptionCount === 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          {t("profile.referralEmpty")}
        </p>
      )}
    </section>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, credits, projects, loadProjects, refreshCredits, logout } =
    useAppContext();

  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProjects();
    refreshCredits();
  }, [user, loadProjects, refreshCredits]);

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  const handleRedeem = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || redeeming) return;
    setRedeeming(true);
    try {
      const data = await redeemCode(trimmed);
      toast.success(`+${data.credits} credits added!`);
      setCode("");
      await refreshCredits();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to redeem code"));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="h-12 flex items-center px-3 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
          aria-label={t("profile.back")}>
          <ArrowLeftIcon size={16} />
        </button>
        <span className="ml-2 text-sm font-semibold">{t("profile.title")}</span>
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle variant="outline" />
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-4">
        <section className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="size-14 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xl font-semibold shrink-0 dark:bg-zinc-50 dark:text-zinc-950">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-medium truncate">{user?.name}</h1>
            <p className="text-sm text-zinc-500 truncate dark:text-zinc-400">
              {user?.email}
            </p>
            {user?.createdAt && (
              <p className="text-xs text-zinc-400 mt-1 dark:text-zinc-500">
                {t("profile.memberSince", {
                  date: moment(user.createdAt).format("MMM YYYY"),
                })}
              </p>
            )}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-2xl p-6 grid grid-cols-2 gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("profile.credits")}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-2xl font-semibold">
              <CoinsIcon
                size={18}
                className="text-zinc-400 dark:text-zinc-500"
              />
              {typeof credits === "number" ? credits : "-"}
            </p>
            <button
              onClick={() => openTopUp()}
              className="mt-3 py-1.5 px-3 bg-zinc-950 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 cursor-pointer dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              {t("profile.topUp")}
            </button>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("profile.projects")}
            </p>
            <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
            <button
              onClick={() => navigate("/chat")}
              className="mt-3 py-1.5 px-3 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-100 cursor-pointer dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              {t("profile.openProjects")}
            </button>
          </div>
        </section>

        <ReferralCard />

        <section className="bg-white border border-zinc-200 rounded-2xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <GiftIcon size={15} className="text-zinc-500 dark:text-zinc-400" />
            <p className="text-sm font-medium">{t("redeem.title")}</p>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("redeem.subtitle")}
          </p>

          <form onSubmit={handleRedeem} className="mt-4 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("redeem.placeholder")}
              maxLength={64}
              disabled={redeeming}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm uppercase tracking-wider outline-none focus:border-zinc-900 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={redeeming || !code.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              {redeeming ? (
                <Loader2Icon size={13} className="animate-spin" />
              ) : (
                t("redeem.button")
              )}
            </button>
          </form>
        </section>

        <section className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center justify-between gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium">{t("profile.signOut")}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("profile.signOutNote")}
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 border border-red-200 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50 cursor-pointer shrink-0 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">
            <LogOutIcon size={13} /> {t("profile.signOut")}
          </button>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
