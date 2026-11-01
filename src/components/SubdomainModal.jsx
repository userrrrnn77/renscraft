// src/components/SubdomainModal.jsx

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CopyIcon,
  Globe2Icon,
  Loader2Icon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import api, { errorMessage, isInsufficientCredits } from "../api/api";
import { getSubdomainPricing } from "../api/payments";
import { useAppContext } from "../context/AppContext";
import ConfirmModal from "./ConfirmModal";
import { showInsufficientCreditsToast } from "../utils/billingToast";
import {
  SLUG_MAX,
  SLUG_MIN,
  SUBDOMAIN_ROOT,
  formatExpiry,
  getSubdomainStatus,
  normalizeSlugInput,
  subdomainUrl,
  validateSlug,
} from "../utils/subdomain";

// Error server yang ditampilkan inline di bawah input, bukan toast.
const FIELD_ERROR_CODES = new Set([
  "INVALID_SUBDOMAIN",
  "SUBDOMAIN_RESERVED",
  "SUBDOMAIN_TAKEN",
]);

const PRIMARY_BTN =
  "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 py-2.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer";
const SECONDARY_BTN =
  "w-full inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer";

const SubdomainModal = ({ project, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { refreshCredits } = useAppContext();

  // Subdomain yang menempel di project (aktif ATAU expired). null = belum ada.
  const [current, setCurrent] = useState(() =>
    project.customSubdomain && project.subdomainExpiresAt
      ? { slug: project.customSubdomain, expiresAt: project.subdomainExpiresAt }
      : null,
  );
  const [view, setView] = useState(() => {
    const { state } = getSubdomainStatus(project);
    if (state === "none") return "claim";
    return state === "expired" ? "expired" : "manage";
  });
  const [slug, setSlug] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSubdomainPricing().then((p) => {
      if (!cancelled) setPricing(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const status = current
    ? getSubdomainStatus({
        customSubdomain: current.slug,
        subdomainExpiresAt: current.expiresAt,
      })
    : { state: "none" };
  const currentUrl = current ? subdomainUrl(current.slug) : null;

  const slugErrorKey = slug ? validateSlug(slug) : null;
  const inlineError =
    fieldError ||
    (slugErrorKey
      ? t(`subdomain.errors.${slugErrorKey}`, { min: SLUG_MIN, max: SLUG_MAX })
      : "");

  const withPrice = (label) =>
    pricing
      ? `${label} (${t("subdomain.creditsShort", { count: pricing.cost })})`
      : label;

  const renewLabel = withPrice(
    pricing?.days
      ? t("subdomain.renewDays", { count: pricing.days })
      : t("subdomain.renew"),
  );
  const claimLabel = withPrice(t("subdomain.claim"));

  const handleError = (err, fallbackKey) => {
    const code = err?.response?.data?.code;
    const message = errorMessage(err, t(`subdomain.errors.${fallbackKey}`));

    if (isInsufficientCredits(err)) {
      showInsufficientCreditsToast(message);
      return;
    }
    if (FIELD_ERROR_CODES.has(code)) {
      setFieldError(message);
      return;
    }
    toast.error(message);

    // Subdomain di server sudah berubah (dilepas job cleanup / sudah punya
    // subdomain lain): sinkronkan state daripada biarin modal basi.
    if (code === "NO_SUBDOMAIN") {
      setCurrent(null);
      setSlug("");
      setView("claim");
      onSuccess?.();
    } else if (code === "PROJECT_HAS_SUBDOMAIN") {
      onSuccess?.();
      onClose();
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (busy) return;

    const trimmed = slug.trim().toLowerCase();
    const key = validateSlug(trimmed);
    if (key) {
      setFieldError(
        t(`subdomain.errors.${key}`, { min: SLUG_MIN, max: SLUG_MAX }),
      );
      return;
    }

    setBusy(true);
    setFieldError("");
    try {
      const { data } = await api.post(
        `/api/projects/${project._id}/claim-subdomain`,
        { slug: trimmed },
      );
      toast.success(t("subdomain.toasts.claimed"));
      await refreshCredits();
      setCurrent({ slug: trimmed, expiresAt: data.expiresAt });
      setView("manage");
      onSuccess?.();
    } catch (err) {
      handleError(err, "claimFailed");
    } finally {
      setBusy(false);
    }
  };

  const handleRenew = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(
        `/api/projects/${project._id}/renew-subdomain`,
      );
      toast.success(t("subdomain.toasts.renewed"));
      await refreshCredits();
      setCurrent((prev) => ({
        slug: prev?.slug ?? project.customSubdomain,
        expiresAt: data.expiresAt,
      }));
      setView("manage");
      onSuccess?.();
    } catch (err) {
      handleError(err, "renewFailed");
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.delete(`/api/projects/${project._id}/subdomain`);
      toast.success(t("subdomain.toasts.released"));
      setCurrent(null);
      setSlug("");
      setFieldError("");
      setView("claim");
      onSuccess?.();
    } catch (err) {
      handleError(err, "releaseFailed");
    } finally {
      setBusy(false);
      setConfirmRelease(false);
    }
  };

  const handleCopy = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success(t("subdomain.toasts.copied"));
    } catch {
      toast.error(t("subdomain.toasts.copyFailed"));
    }
  };

  const releaseButton = (
    <button
      type="button"
      onClick={() => setConfirmRelease(true)}
      disabled={busy}
      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer">
      <TrashIcon size={12} />
      {t("subdomain.release")}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs dark:bg-zinc-950/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}>
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2 dark:text-zinc-50">
              <Globe2Icon size={16} /> {t("subdomain.title")}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
              {t("subdomain.subtitle", { domain: SUBDOMAIN_ROOT })}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label={t("common.close")}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer">
            <XIcon size={16} />
          </button>
        </div>

        {view === "manage" && current && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                <CheckCircle2Icon size={12} /> {t("subdomain.activeTitle")}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-emerald-700 dark:text-emerald-400 underline break-all flex-1">
                  {currentUrl}
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={t("common.copy")}
                  className="p-1.5 bg-emerald-100 rounded text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 cursor-pointer">
                  <CopyIcon size={12} />
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2 dark:text-emerald-400/80">
                {t("subdomain.activeUntil", {
                  date: formatExpiry(current.expiresAt),
                })}
                {" · "}
                {t("subdomain.daysLeft", { count: status.days })}
              </p>
            </div>

            {status.state === "expiring" && (
              <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertCircleIcon size={13} className="mt-px shrink-0" />
                {t("subdomain.expiringSoon")}
              </p>
            )}

            <button
              type="button"
              onClick={handleRenew}
              disabled={busy}
              className={PRIMARY_BTN}>
              {busy && <Loader2Icon size={13} className="animate-spin" />}
              {busy ? t("subdomain.processing") : renewLabel}
            </button>
            {releaseButton}
          </div>
        )}

        {view === "expired" && current && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-500/10 dark:border-red-500/20">
              <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1 flex items-center gap-1.5">
                <AlertCircleIcon size={12} /> {t("subdomain.expiredTitle")}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300/90 leading-relaxed">
                {t("subdomain.expiredBody", {
                  domain: `${current.slug}.${SUBDOMAIN_ROOT}`,
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRenew}
              disabled={busy}
              className={PRIMARY_BTN}>
              {busy && <Loader2Icon size={13} className="animate-spin" />}
              {busy ? t("subdomain.processing") : renewLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setSlug("");
                setFieldError("");
                setView("claim");
              }}
              disabled={busy}
              className={SECONDARY_BTN}>
              {t("subdomain.chooseOther")}
            </button>
            {releaseButton}
          </div>
        )}

        {view === "claim" && (
          <form onSubmit={handleClaim} className="space-y-4">
            <div>
              <label
                htmlFor="subdomain-slug"
                className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
                {t("subdomain.chooseLabel")}
              </label>
              <div
                className={`flex items-center gap-1 rounded-lg border px-3 py-2 ${
                  inlineError
                    ? "border-red-400 dark:border-red-500/60"
                    : "border-zinc-200 focus-within:border-zinc-900 dark:border-zinc-800 dark:focus-within:border-zinc-50"
                }`}>
                <input
                  id="subdomain-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(normalizeSlugInput(e.target.value));
                    setFieldError("");
                  }}
                  placeholder={t("subdomain.placeholder")}
                  maxLength={SLUG_MAX}
                  disabled={busy}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-invalid={Boolean(inlineError)}
                  className="w-full bg-transparent font-mono text-sm outline-none dark:text-zinc-50"
                />
                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                  .{SUBDOMAIN_ROOT}
                </span>
              </div>
              {inlineError ? (
                <p className="text-[11px] text-red-600 mt-1.5 dark:text-red-400">
                  {inlineError}
                </p>
              ) : (
                <p className="text-[10px] text-zinc-400 mt-1.5">
                  {t("subdomain.hint", { min: SLUG_MIN, max: SLUG_MAX })}
                </p>
              )}
            </div>

            {pricing && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {pricing.days
                    ? t("subdomain.price", {
                        cost: pricing.cost,
                        days: pricing.days,
                      })
                    : t("subdomain.priceNoDays", { cost: pricing.cost })}
                  <br />
                  {t("subdomain.autoCharge")}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !slug || Boolean(slugErrorKey)}
              className={PRIMARY_BTN}>
              {busy && <Loader2Icon size={13} className="animate-spin" />}
              {busy ? t("subdomain.processing") : claimLabel}
            </button>

            {current && (
              <button
                type="button"
                onClick={() => {
                  setFieldError("");
                  setView(status.state === "expired" ? "expired" : "manage");
                }}
                disabled={busy}
                className={SECONDARY_BTN}>
                {t("common.back")}
              </button>
            )}
          </form>
        )}
      </div>

      <ConfirmModal
        open={confirmRelease}
        title={t("subdomain.releaseConfirmTitle")}
        description={t("subdomain.releaseConfirmBody", {
          domain: current ? `${current.slug}.${SUBDOMAIN_ROOT}` : "",
        })}
        confirmLabel={t("subdomain.releaseConfirmButton")}
        cancelLabel={t("common.cancel")}
        busyLabel={t("subdomain.releasing")}
        busy={busy}
        onConfirm={handleRelease}
        onClose={() => !busy && setConfirmRelease(false)}
      />
    </div>
  );
};

export default SubdomainModal;
