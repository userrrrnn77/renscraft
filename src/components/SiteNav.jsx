import { Link, NavLink } from "react-router-dom";
import { CoinsIcon, UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/AppContext";
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
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Kiri: Logo & Link (Link disembunyiin di mobile) */}
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.svg"
              alt=""
              className="size-6 invert dark:invert-0"
            />
            <span className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 hidden sm:inline-block">
              Renscraft
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={linkClass}>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/pricing" className={linkClass}>
              {t("nav.pricing")}
            </NavLink>
            <NavLink to="/webpub" className={linkClass}>
              {t("nav.webpub")}
            </NavLink>
            {user && (
              <NavLink to="/my-projects" className={linkClass}>
                {t("nav.myProjects")}
              </NavLink>
            )}
          </div>
        </div>

        {/* Kanan: Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <LanguageToggle />
          <ThemeToggle variant="outline" />
          {loadingUser ? null : user ? (
            <>
              {typeof credits === "number" && (
                <button
                  type="button"
                  onClick={() => openTopUp()}
                  title={t("nav.topUp")}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 md:px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 cursor-pointer dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <CoinsIcon size={13} />
                  <span className="hidden sm:inline">{credits}</span>
                </button>
              )}
              <Link
                to="/chat"
                className="hidden sm:inline-block rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                {t("nav.openBuilder")}
              </Link>
              <Link
                to="/profile"
                aria-label={t("nav.profile")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 md:px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <UserIcon size={13} />
                <span className="hidden md:inline max-w-24 truncate">
                  {user.name}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-2 md:px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
                {t("nav.signIn")}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-zinc-950 px-2 md:px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
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
