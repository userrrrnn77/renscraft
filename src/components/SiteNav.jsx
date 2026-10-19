import { Link, NavLink } from "react-router-dom";
import { CoinsIcon, UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/AppContext";
// import { openBuyCredits } from "../utils/billing";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { openTopUp } from "../utils/topup";

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? "text-zinc-950 dark:text-zinc-50"
      : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
  }`;

const SiteNav = () => {
  const { t } = useTranslation();
  const { user, loadingUser, credits } = useAppContext();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt=""
              className="size-6 invert dark:invert-0"
            />
            <span className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Renscraft
            </span>
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            <NavLink to="/" end className={linkClass}>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/pricing" className={linkClass}>
              {t("nav.pricing")}
            </NavLink>
            {user && (
              <NavLink to="/my-projects" className={linkClass}>
                {t("nav.myProjects")}
              </NavLink>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle variant="outline" />
          {loadingUser ? null : user ? (
            <>
              {typeof credits === "number" && (
                <button
                  type="button"
                  onClick={() => openTopUp()}
                  title={t("nav.topUp")}
                  className="hidden items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 cursor-pointer sm:inline-flex dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <CoinsIcon size={13} /> {credits}
                </button>
              )}
              <Link
                to="/chat"
                className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                {t("nav.openBuilder")}
              </Link>
              <Link
                to="/profile"
                aria-label={t("nav.profile")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <UserIcon size={13} />
                <span className="max-w-24 truncate">{user.name}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
                {t("nav.signIn")}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                {t("nav.getStarted")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default SiteNav;
