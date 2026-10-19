import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
  Wand2Icon,
} from "lucide-react";
import { projectErrorMessage } from "../api/api";

const GRID_STYLE_LIGHT = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)",
  backgroundSize: "36px 36px",
  maskImage:
    "radial-gradient(ellipse 60% 50% at 50% 45%, black 20%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 60% 50% at 50% 45%, black 20%, transparent 100%)",
};

const GRID_STYLE_DARK = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
  backgroundSize: "36px 36px",
  maskImage:
    "radial-gradient(ellipse 60% 50% at 50% 45%, black 20%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 60% 50% at 50% 45%, black 20%, transparent 100%)",
};

const StatusDot = ({ tone = "sky" }) => {
  const toneMap = {
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
  };
  const dot = toneMap[tone] ?? toneMap.sky;
  return (
    <span className="relative flex size-2">
      <span
        className={`absolute inset-0 rounded-full opacity-60 animate-ping ${dot}`}
      />
      <span className={`relative inline-flex size-2 rounded-full ${dot}`} />
    </span>
  );
};

export default function AgentProgressDashboard({
  project,
  onBack,
  onRetry,
  onRetryNew,
}) {
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);

  const planned = project.filesPlanned || [];
  const completed = project.filesGenerated || [];
  const current = project.currentFile;
  const isFailed = project.status === "failed";
  const isPlanning = project.status === "pending";
  const percent =
    planned.length > 0
      ? Math.round((completed.length / planned.length) * 100)
      : 0;

  const statusTone = isFailed ? "red" : isPlanning ? "sky" : "emerald";
  const statusLabel = isFailed
    ? t("progress.failed")
    : isPlanning
      ? t("progress.planning")
      : t("progress.generating");

  // Translate errorCode -> message. Fallback ke project.error kalau code
  // tidak ada di locale (mis. versi lama) atau tidak ada code sama sekali.
  const errorText = projectErrorMessage(project, "");

  const handleRetry = async () => {
    if (retrying || !onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-50 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto dark:bg-zinc-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 dark:hidden" style={GRID_STYLE_LIGHT} />
        <div
          className="absolute inset-0 hidden dark:block"
          style={GRID_STYLE_DARK}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-130 rounded-full blur-[140px] ${
            isFailed
              ? "bg-red-500/8 dark:bg-red-500/15"
              : "bg-sky-500/6 dark:bg-sky-500/12"
          }`}
        />
      </div>

      <div className="relative z-10 max-w-xl w-full rounded-2xl border border-zinc-200 bg-white/90 backdrop-blur-xl p-6 md:p-8 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950/70 dark:shadow-none">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <StatusDot tone={statusTone} />
                {statusLabel}
              </span>
            </div>
            <h2 className="text-base font-medium text-zinc-800 dark:text-zinc-100">
              {isFailed
                ? t("progress.generationFailed")
                : isPlanning
                  ? t("progress.planningArch")
                  : t("progress.building")}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">
              {isFailed
                ? t("progress.errorDuringBuild")
                : t("progress.writingCode")}
            </p>
          </div>

          {planned.length > 0 && !isFailed && (
            <div className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-lg font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                {percent}
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                  %
                </span>
              </div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {t("progress.done")}
              </div>
            </div>
          )}
        </div>

        {isFailed && errorText && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
            <p className="font-medium leading-relaxed">{errorText}</p>
          </div>
        )}

        {isFailed && (
          <div className="mb-6 space-y-3">
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              <Trans
                i18nKey="progress.notCharged"
                components={[
                  <strong
                    key="0"
                    className="text-zinc-700 dark:text-zinc-300"
                  />,
                ]}
              />
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              {onRetry && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {retrying ? (
                    <Loader2Icon size={13} className="animate-spin" />
                  ) : (
                    <RefreshCwIcon size={13} />
                  )}
                  {retrying ? t("progress.retrying") : t("progress.retry")}
                </button>
              )}
              {onRetryNew && (
                <button
                  type="button"
                  onClick={onRetryNew}
                  disabled={retrying}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Wand2Icon size={13} />
                  {t("progress.newPrompt")}
                </button>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
              <Trans
                i18nKey="progress.retryHint"
                components={[
                  <strong
                    key="0"
                    className="text-zinc-500 dark:text-zinc-400"
                  />,
                ]}
              />
              <br />
              <Trans
                i18nKey="progress.newPromptHint"
                components={[
                  <strong
                    key="0"
                    className="text-zinc-500 dark:text-zinc-400"
                  />,
                ]}
              />
            </p>
          </div>
        )}

        {planned.length > 0 && !isFailed && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <SparklesIcon size={11} />
                {t("progress.progress")}
              </span>
              <span>
                {t("progress.filesCount", {
                  done: completed.length,
                  total: planned.length,
                })}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="relative h-full rounded-full bg-zinc-900 transition-all duration-700 ease-out dark:bg-zinc-100"
                style={{ width: `${percent}%` }}
              >
                {percent > 0 && percent < 100 && (
                  <span className="absolute right-0 top-0 h-full w-8 bg-linear-to-r from-transparent to-white/40 dark:to-white/60" />
                )}
              </div>
            </div>
          </div>
        )}

        {planned.length > 0 ? (
          <div>
            <span className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {t("progress.files")}
            </span>
            <div className="max-h-75 space-y-2 overflow-y-auto pr-1">
              {planned.map((file, idx) => {
                const isCompleted = completed.includes(file.path);
                const isGenerating = current === file.path;

                return (
                  <div
                    key={file.path}
                    style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                    className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all duration-300 ${
                      isGenerating
                        ? "border-sky-200 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/6"
                        : isCompleted
                          ? "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                          : "border-zinc-100 bg-white opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2Icon
                        size={16}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : isGenerating ? (
                      <Loader2Icon
                        size={16}
                        className="shrink-0 animate-spin text-sky-500 dark:text-sky-400"
                      />
                    ) : (
                      <CircleIcon
                        size={16}
                        className="shrink-0 text-zinc-300 dark:text-zinc-700"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-medium ${
                          isGenerating
                            ? "text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {file.path}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                        {file.description}
                      </p>
                    </div>
                    {isGenerating && (
                      <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sky-700 animate-pulse dark:bg-sky-500/20 dark:text-sky-300">
                        {t("progress.active")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !isFailed && (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
              <div className="relative mb-3">
                <Loader2Icon size={26} className="animate-spin" />
              </div>
              <p className="text-xs">{t("progress.analyzing")}</p>
            </div>
          )
        )}

        {onBack && (
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onBack}
              disabled={retrying}
              className="cursor-pointer text-xs text-zinc-400 underline-offset-2 transition hover:text-zinc-700 hover:underline disabled:opacity-50 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              {isFailed ? t("progress.backToProjects") : t("progress.cancelAndGoBack")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}