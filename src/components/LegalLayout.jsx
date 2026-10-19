// src/components/LegalLayout.jsx

import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import SiteNav from "./SiteNav";
import usePageMeta from "../utils/usePageMeta";

// Grid background yang sama dengan halaman lain, biar masih kerasa Renscraft.
const GRID_STYLE_LIGHT = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 25%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 25%, transparent 100%)",
};

const GRID_STYLE_DARK = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 25%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 25%, transparent 100%)",
};

// `children` = konten legal (paragraf, list, heading)
// `metaTitle` + `metaDescription` = buat usePageMeta
// `updated` = tanggal revisi terakhir (string bebas, mis. "14 October 2026")
const LegalLayout = ({
  title,
  intro,
  updated = "14 October 2026",
  metaTitle,
  metaDescription,
  children,
}) => {
  const { t } = useTranslation();

  usePageMeta({
    title: metaTitle ?? `${title} — Renscraft`,
    description: metaDescription ?? intro,
  });

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Hero grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-100 overflow-hidden">
        <div
          className="absolute inset-0 dark:hidden"
          style={GRID_STYLE_LIGHT}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={GRID_STYLE_DARK}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-130 rounded-full bg-red-500/[0.07] blur-[140px] dark:bg-red-500/15" />
      </div>

      <div className="relative z-10">
        <SiteNav />

        <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-12 md:pt-16">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            <ArrowLeftIcon size={13} />
            {t("legal.backToHome")}
          </Link>

          {/* Header */}
          <header className="mt-6 pb-8 border-b border-zinc-200 dark:border-zinc-800">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {t("legal.label")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {title}
            </h1>
            {intro && (
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {intro}
              </p>
            )}
            <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
              {t("legal.lastUpdated", { date: updated })}
            </p>
          </header>

          {/* Content */}
          <div className="mt-10 max-w-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-900 [&_h2]:dark:text-zinc-50 [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-zinc-900 [&_h3]:dark:text-zinc-50 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:mt-3 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_a]:font-medium [&_a]:text-zinc-900 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-sky-600 [&_a]:dark:text-zinc-50 [&_a]:dark:hover:text-sky-400 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:font-mono [&_code]:dark:bg-zinc-800">
            {children}
          </div>

          {/* Footer nav */}
          <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("legal.questions")}{" "}
              <Link
                to="/contact"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-50">
                {t("legal.contactUs")}
              </Link>
              .
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <li>
                <Link
                  to="/terms"
                  className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  {t("auth.agreeTerms")}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  {t("auth.agreePrivacy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  {t("auth.agreeRefund")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  {t("contact.label")}
                </Link>
              </li>
            </ul>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default LegalLayout;
