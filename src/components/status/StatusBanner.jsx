// src/components/status/StatusBanner.jsx
import { useTranslation } from "react-i18next";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { STATUS_STYLES } from "./statusStyles";

const ICONS = {
  operational: CheckCircle2Icon,
  degraded: AlertTriangleIcon,
  outage: XCircleIcon,
  maintenance: WrenchIcon,
  unknown: HelpCircleIcon,
};

const formatRelative = (iso, lang) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / 60000);
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    if (mins < 60) return rtf.format(-mins, "minute");
    const hours = Math.floor(mins / 60);
    return rtf.format(-hours, "hour");
  } catch {
    return d.toLocaleString();
  }
};

const StatusBanner = ({ overall, generatedAt, maintenance }) => {
  const { t, i18n } = useTranslation();
  const key = overall || "unknown";
  const style = STATUS_STYLES[key] || STATUS_STYLES.unknown;
  const Icon = ICONS[key] || HelpCircleIcon;

  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${style.pill}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t(`status.banner.${key}`)}
          </h2>
          {generatedAt && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t("status.updatedAt", {
                time: formatRelative(generatedAt, i18n.language),
              })}
            </p>
          )}
          {maintenance?.active && maintenance?.message && (
            <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              {maintenance.message}
              {maintenance.until && (
                <>
                  {" — "}
                  {t("status.maintenanceUntil", {
                    time: formatRelative(maintenance.until, i18n.language),
                  })}
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default StatusBanner;
