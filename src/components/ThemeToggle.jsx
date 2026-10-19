import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = ({ variant = "ghost", className = "" }) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  const base =
    "inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer";
  const sizes = "size-8";
  const styles =
    variant === "outline"
      ? "border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800";

  const label = isDark ? t("theme.lightMode") : t("theme.darkMode");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.enableLight") : t("theme.enableDark")}
      title={label}
      className={`${base} ${sizes} ${styles} ${className}`}>
      {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
    </button>
  );
};

export default ThemeToggle;
