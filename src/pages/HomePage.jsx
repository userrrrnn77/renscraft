import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CoinsIcon, FolderOpenIcon, UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { homeTags } from "../assets/assets";
import BriefWizard from "../components/BriefWizard";
import PromptInput from "../components/PromptInput";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
import { useAppContext } from "../context/AppContext";
import { openTopUp } from "../utils/topup";

const ProjectRowSkeleton = () => (
  <div className="rounded-lg px-4 py-3 bg-white border border-zinc-200 dark:bg-white/5 dark:border-white/10">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-2.5 w-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="size-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  </div>
);

const HomePage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    user,
    credits,
    projects,
    loadingProjects,
    generatingProject,
    loadProjects,
    createFromPrompt,
    brief,
    briefLoading,
    startBrief,
    answerBrief,
    changeBriefCategory,
    cancelBrief,
  } = useAppContext();

  const prefilledPrompt = location.state?.prefilledPrompt || "";

  useEffect(() => {
    if (user) loadProjects();
  }, [user, loadProjects]);

  return (
    <div className="relative h-dvh overflow-y-auto bg-zinc-50 text-zinc-900 font-sans transition-colors dark:bg-zinc-950 dark:text-zinc-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-150 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-160 rounded-full bg-red-500/10 blur-[120px] dark:bg-red-500/20" />
        <div className="absolute top-20 right-1/4 size-90 rounded-full bg-orange-400/10 blur-[100px] dark:bg-orange-500/10" />
      </div>

      {/* Navbar Responsive */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-zinc-50/70 backdrop-blur-md border-b border-zinc-200/70 dark:bg-zinc-950/60 dark:border-zinc-800/70">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.svg"
            alt="logo"
            className="size-6 invert dark:invert-0"
          />
          <span className="text-lg md:text-xl font-semibold tracking-tight hidden sm:inline-block">
            Renscraft
          </span>
        </Link>

        <div className="flex items-center gap-1.5 md:gap-3 text-sm font-medium">
          {typeof credits === "number" && (
            <button
              type="button"
              onClick={() => openTopUp()}
              title={t("nav.topUp")}
              className={`inline-flex items-center gap-1.5 py-1 px-2 md:px-2.5 rounded-full border text-xs cursor-pointer transition-colors ${
                credits === 0
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}>
              <CoinsIcon size={13} />
              <span className="hidden xs:inline">
                {credits === 0
                  ? t("home.noCredits")
                  : t("home.creditsCount", { count: credits })}
              </span>
              <span className="xs:hidden">{credits}</span>
            </button>
          )}

          <Link
            to="/my-projects"
            className="hidden md:inline-flex items-center gap-1.5 py-1.5 px-3 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 text-xs rounded-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <FolderOpenIcon size={13} />
            <span className="max-w-28 truncate">{t("nav.myProjects")}</span>
          </Link>

          <LanguageToggle />
          <ThemeToggle variant="outline" />

          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 py-1.5 px-2 md:px-3 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 text-xs rounded-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <UserIcon size={13} />
            <span className="hidden sm:inline max-w-28 truncate">
              {user?.name || t("nav.profile")}
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 md:px-6 pb-20 mt-8 md:mt-12 xl:mt-20">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <h1 className="text-center text-3xl md:text-5xl lg:text-6xl font-medium mt-4 max-w-2xl tracking-tight">
            {t("home.title")}
          </h1>

          <p className="text-center text-sm md:text-base max-w-xl mt-3 md:mt-4 leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t("home.subtitle")}
          </p>

          {brief ? (
            <div className="w-full mt-6">
              <BriefWizard
                brief={brief}
                onAnswer={answerBrief}
                onCategoryChange={changeBriefCategory}
                onCancel={cancelBrief}
                onGenerate={() => createFromPrompt(null, brief.briefId)}
                generating={generatingProject}
              />
            </div>
          ) : (
            <>
              <div className="w-full mt-6 md:mt-8">
                <PromptInput
                  key={prefilledPrompt || "empty"}
                  onSubmit={startBrief}
                  loading={generatingProject || briefLoading}
                  placeholder={t("home.placeholder")}
                  variant="glass"
                  autoFocus
                  initialValue={prefilledPrompt}
                />
              </div>

              <div className="masked-marquee w-full mt-6 max-w-2xl overflow-hidden py-1">
                <div className="animate-marquee gap-2 md:gap-3">
                  {homeTags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => startBrief(tag)}
                      disabled={generatingProject || briefLoading}
                      className="px-3 md:px-4 py-1.5 border rounded-full text-xs md:text-sm shrink-0 font-medium transition cursor-pointer border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {loadingProjects && (
            <div className="mt-12 w-full">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="space-y-2 max-h-[80vh] overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <ProjectRowSkeleton key={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
