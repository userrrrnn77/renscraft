// FILE: client/src/components/QualityBadge.jsx

import { AlertCircleIcon, CheckCircle2Icon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getQualitySummary } from "../utils/quality";

const MAX_TOOLTIP_ISSUES = 3;

const STYLES = {
  passed: {
    Icon: CheckCircle2Icon,
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  passed_with_warnings: {
    Icon: AlertCircleIcon,
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  failed: {
    Icon: XIcon,
    cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
};

// Render null kalau project belum pernah dinilai (quality null).
// responsiveLabel: teks disembunyikan di layar kecil (dipakai di header).
const QualityBadge = ({ quality, responsiveLabel = false, className = "" }) => {
  const { t } = useTranslation();
  const summary = getQualitySummary(quality);
  if (!summary) return null;

  const { Icon, cls } = STYLES[summary.status];
  const label = t(`quality.status.${summary.status}`);

  const issues = [...summary.blocking, ...summary.warnings];
  const shown = issues.slice(0, MAX_TOOLTIP_ISSUES);
  const rest = issues.length - shown.length;

  const tooltip = [
    t("quality.title", { status: label }),
    t("quality.counts", {
      blocking: summary.blocking.length,
      warnings: summary.warnings.length,
    }),
    ...shown.map((i) => `• ${i.code}${i.path ? ` (${i.path})` : ""}`),
    ...(rest > 0 ? [t("quality.more", { count: rest })] : []),
  ].join("\n");

  return (
    <span
      title={tooltip}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${cls} ${className}`}>
      <Icon size={11} />
      <span className={responsiveLabel ? "hidden sm:inline" : ""}>{label}</span>
    </span>
  );
};

export default QualityBadge;
