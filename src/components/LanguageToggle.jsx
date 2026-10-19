import { LanguagesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const LanguageToggle = ({ variant = "outline", className = "" }) => {
  const { i18n, t } = useTranslation();
  const lang = String(i18n.resolvedLanguage || "en").startsWith("id")
    ? "id"
    : "en";
  const next = lang === "id" ? "en" : "id";

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer";
  const styles =
    variant === "outline"
      ? "border border-zinc-200 px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      title={t("language.switchTo", { lang: t(`language.${next}`) })}
      aria-label={t("language.switchTo", { lang: t(`language.${next}`) })}
      className={`${base} ${styles} ${className}`}>
      <LanguagesIcon size={14} />
      {lang.toUpperCase()}
    </button>
  );
};

export default LanguageToggle;
