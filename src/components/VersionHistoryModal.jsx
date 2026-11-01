// FILE: client/src/components/VersionHistoryModal.jsx

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { HistoryIcon, Loader2Icon, RotateCcwIcon, XIcon } from "lucide-react";
import { errorMessage } from "../api/api";
import { listVersions, restoreVersion } from "../api/projects";
import { useAppContext } from "../context/AppContext";
import ConfirmModal from "./ConfirmModal";
import QualityBadge from "./QualityBadge";

const PROMPT_PREVIEW_CHARS = 120;
const RELATIVE_UNITS = [
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const shortPrompt = (prompt) => {
  const s = String(prompt).trim().replace(/\s+/g, " ");
  return s.length > PROMPT_PREVIEW_CHARS
    ? `${s.slice(0, PROMPT_PREVIEW_CHARS)}…`
    : s;
};

const formatRelative = (value, lang) => {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";
  const diff = (time - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= seconds) {
      return rtf.format(Math.round(diff / seconds), unit);
    }
  }
  return rtf.format(0, "second");
};

const formatFull = (value, lang) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(lang);
};

// busy = project sedang pending/generating/revising (restore dimatikan).
const VersionHistoryModal = ({ project, busy = false, onClose }) => {
  const { t, i18n } = useTranslation();
  const { setActiveProject, flushAutosave } = useAppContext();

  const [versions, setVersions] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [target, setTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    setVersions(null);
    try {
      setVersions(await listVersions(project._id));
    } catch (err) {
      setLoadError(errorMessage(err, i18n.t("versions.loadFailed")));
    }
  }, [project._id, i18n]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRestore = async () => {
    if (!target || restoring) return;
    setRestoring(true);
    try {
      // Edit manual yang masih tertahan debounce harus tersimpan dulu, kalau
      // tidak PUT /files yang telat bisa menimpa hasil restore.
      await flushAutosave();
      const data = await restoreVersion(project._id, target.version);
      setActiveProject(data);
      toast.success(t("versions.restored", { version: target.version }));
      setTarget(null);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, t("versions.restoreFailed")));
      setTarget(null);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs dark:bg-zinc-950/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !restoring) onClose();
      }}>
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2 dark:text-zinc-50">
              <HistoryIcon size={16} /> {t("versions.title")}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
              {t("versions.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={restoring}
            aria-label={t("common.close")}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer">
            <XIcon size={16} />
          </button>
        </div>

        {busy && (
          <p className="mb-3 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            {t("versions.busyHint")}
          </p>
        )}

        {versions === null && !loadError && (
          <p className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
            <Loader2Icon size={13} className="animate-spin" />
            {t("common.loading")}
          </p>
        )}

        {loadError && (
          <div className="space-y-3 py-4 text-center">
            <p className="text-xs text-red-600 dark:text-red-400">
              {loadError}
            </p>
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer">
              {t("common.tryAgain")}
            </button>
          </div>
        )}

        {versions && versions.length === 0 && (
          <p className="py-8 text-center text-xs text-zinc-500">
            {t("versions.empty")}
          </p>
        )}

        {versions && versions.length > 0 && (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {versions.map((v) => {
              const isCurrent = v.version === project.version;
              return (
                <li
                  key={v._id ?? v.version}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                      v{v.version}
                    </span>
                    {isCurrent && (
                      <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
                        {t("versions.current")}
                      </span>
                    )}
                    <QualityBadge quality={v.quality} />
                    <span
                      className="ml-auto text-[10px] text-zinc-400"
                      title={formatFull(v.createdAt, i18n.language)}>
                      {formatRelative(v.createdAt, i18n.language)}
                    </span>
                  </div>

                  <p className="mt-1.5 wrap-break-word text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                    {v.prompt ? (
                      shortPrompt(v.prompt)
                    ) : (
                      <span className="italic text-zinc-400">
                        {t("versions.noPrompt")}
                      </span>
                    )}
                  </p>

                  {!isCurrent && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setTarget(v)}
                        disabled={busy || restoring}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer">
                        <RotateCcwIcon size={11} />
                        {t("versions.restore")}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={Boolean(target)}
        title={t("versions.restoreConfirmTitle", { version: target?.version })}
        description={t("versions.restoreConfirmBody")}
        confirmLabel={t("versions.restoreConfirmButton")}
        cancelLabel={t("common.cancel")}
        busyLabel={t("versions.restoring")}
        busy={restoring}
        onConfirm={handleRestore}
        onClose={() => !restoring && setTarget(null)}
      />
    </div>
  );
};

export default VersionHistoryModal;
