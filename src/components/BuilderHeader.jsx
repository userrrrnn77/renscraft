import {
  ArrowLeftIcon,
  Code2Icon,
  DownloadCloud,
  ExternalLinkIcon,
  EyeIcon,
  CoinsIcon,
  FolderOpenIcon,
  GlobeIcon,
  Loader2Icon,
  UserIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
// import { openBuyCredits } from "../utils/billing";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { openTopUp } from "../utils/topup";

const BuilderHeader = ({
  projectName,
  version,
  credits,
  showCode,
  publishing,
  onToggleShowCode,
  onOpenPreview,
  onPublish,
  onDonwload,
  onBack,
  onProfile,
  onMyProjects,
}) => {
  const { t } = useTranslation();

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 cursor-pointer dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
          aria-label={t("common.back")}>
          <ArrowLeftIcon size={16} />
        </button>
        <img
          src="/logo.svg"
          alt="logo"
          className="size-5 invert dark:invert-0"
        />
        <span className="text-sm font-semibold truncate max-w-38 md:max-w-50 text-zinc-900 dark:text-zinc-50">
          {projectName}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium dark:bg-zinc-800 dark:text-zinc-400">
          v{version}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {typeof credits === "number" && (
          <button
            type="button"
            onClick={() => openTopUp()}
            title={t("nav.topUp")}
            className={`inline-flex items-center gap-1 py-1.5 px-2.5 text-xs font-medium rounded-lg border cursor-pointer ${
              credits === 0
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}>
            <CoinsIcon size={13} /> {credits}
          </button>
        )}

        <LanguageToggle />
        <ThemeToggle variant="outline" />

        <button
          onClick={onToggleShowCode}
          className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 ${
            showCode
              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
              : ""
          }`}>
          {showCode ? (
            <>
              <EyeIcon size={13} /> {t("builder.preview")}
            </>
          ) : (
            <>
              <Code2Icon size={13} /> {t("builder.code")}
            </>
          )}
        </button>

        <button
          onClick={onOpenPreview}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
          <ExternalLinkIcon size={13} /> {t("builder.openPreview")}
        </button>

        <button
          onClick={onPublish}
          disabled={publishing}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
          {publishing ? (
            <Loader2Icon size={13} className="animate-spin" />
          ) : (
            <GlobeIcon size={13} />
          )}{" "}
          {t("builder.publish")}
        </button>

        <button
          onClick={onDonwload}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
          <DownloadCloud size={13} /> {t("builder.export")}
        </button>

        <button
          onClick={onMyProjects}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
          <FolderOpenIcon size={13} /> {t("builder.projects")}
        </button>

        <button
          onClick={onProfile}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
          <UserIcon size={13} /> {t("builder.profile")}
        </button>
      </div>
    </header>
  );
};

export default BuilderHeader;
