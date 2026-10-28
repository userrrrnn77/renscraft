// src/components/SubdomainModal.jsx

import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  XIcon,
  Loader2Icon,
  Globe2Icon,
  CheckCircle2Icon,
  CopyIcon,
} from "lucide-react";
import api, { errorMessage } from "../api/api";
import { useAppContext } from "../context/AppContext";

const SUBDOMAIN_COST = 100;

const SubdomainModal = ({ project, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { refreshCredits } = useAppContext();

  const [slug, setSlug] = useState(project.customSubdomain || "");
  const [busy, setBusy] = useState(false);
  const [successUrl, setSuccessUrl] = useState(
    project.customSubdomain &&
      project.subdomainExpiresAt &&
      new Date(project.subdomainExpiresAt) > new Date()
      ? `https://${project.customSubdomain}.renscraft.cyou`
      : null,
  );
  const [expiresAt, setExpiresAt] = useState(project.subdomainExpiresAt);
  const [mode, setMode] = useState(
    project.customSubdomain && new Date(project.subdomainExpiresAt) > new Date()
      ? "manage"
      : "claim",
  );

  const handleClaim = async (e) => {
    e.preventDefault();
    if (busy) return;
    const trimmed = slug.trim().toLowerCase();

    if (!/^[a-z0-9-]{3,30}$/.test(trimmed)) {
      toast.error("Slug harus 3-30 karakter (huruf kecil, angka, strip).");
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post(
        `/api/projects/${project._id}/claim-subdomain`,
        { slug: trimmed },
      );
      toast.success(data.message || "Subdomain berhasil diklaim!");
      await refreshCredits();
      setSuccessUrl(data.url);
      setExpiresAt(data.expiresAt);
      setMode("manage");
      onSuccess?.();
    } catch (err) {
      toast.error(errorMessage(err, "Gagal klaim subdomain."));
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
      toast.success(data.message || "Subdomain diperpanjang!");
      await refreshCredits();
      setExpiresAt(data.expiresAt);
      onSuccess?.();
    } catch (err) {
      toast.error(errorMessage(err, "Gagal perpanjang subdomain."));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = () => {
    if (!successUrl) return;
    navigator.clipboard.writeText(successUrl);
    toast.success("URL disalin!");
  };

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
              <Globe2Icon size={16} /> Premium Subdomain
            </h3>
            <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
              Dapetin link eksklusif <b>namamu.renscraft.cyou</b>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer">
            <XIcon size={16} />
          </button>
        </div>

        {mode === "manage" ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                <CheckCircle2Icon size={12} /> Subdomain Aktif
              </p>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-emerald-700 dark:text-emerald-400 underline break-all flex-1">
                  {successUrl}
                </a>
                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-emerald-100 rounded text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 cursor-pointer">
                  <CopyIcon size={12} />
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2 dark:text-emerald-400/80">
                Aktif sampai:{" "}
                {new Date(expiresAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <button
              onClick={handleRenew}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 py-2.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer">
              {busy && <Loader2Icon size={13} className="animate-spin" />}
              {busy
                ? "Memproses..."
                : `Perpanjang 30 Hari (${SUBDOMAIN_COST} Kredit)`}
            </button>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
                Pilih Subdomain
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 focus-within:border-zinc-900 dark:border-zinc-800 dark:focus-within:border-zinc-50">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder="namamu"
                  maxLength={30}
                  disabled={busy}
                  className="w-full bg-transparent font-mono text-sm outline-none dark:text-zinc-50"
                />
                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                  .renscraft.cyou
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5">
                Huruf kecil, angka, dan strip. Min 3 karakter.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Harga: <b>{SUBDOMAIN_COST} Kredit</b> / 30 hari. <br />
                Kredit akan otomatis terpotong dari saldo Anda.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy || !slug}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 py-2.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer">
              {busy && <Loader2Icon size={13} className="animate-spin" />}
              {busy
                ? "Memproses..."
                : `Klaim Sekarang (${SUBDOMAIN_COST} Kredit)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubdomainModal;
