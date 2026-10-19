// src/pages/ContactPage.jsx

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon, ArrowUpRightIcon, MailIcon } from "lucide-react";
import { FaGithub, FaInstagram, FaTiktok } from "react-icons/fa6";
import SiteNav from "../components/SiteNav";
import usePageMeta from "../utils/usePageMeta";

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

const CHANNELS = [
  {
    id: "email",
    handle: "developer@rensdev.my.id",
    href: "mailto:developer@rensdev.my.id",
    Icon: MailIcon,
    tone: "sky",
  },
  {
    id: "instagram",
    handle: "@userrrrnn77",
    href: "https://instagram.com/userrrrnn77",
    Icon: FaInstagram,
    tone: "violet",
  },
  {
    id: "github",
    handle: "userrrrnn77",
    href: "https://github.com/userrrrnn77",
    Icon: FaGithub,
    tone: "zinc",
  },
  {
    id: "tiktok",
    handle: "@userrrrnn77",
    href: "https://tiktok.com/@userrrrnn77",
    Icon: FaTiktok,
    tone: "rose",
  },
];

const TONE = {
  sky: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 ring-sky-100 dark:ring-sky-500/20",
  violet:
    "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 ring-violet-100 dark:ring-violet-500/20",
  zinc: "text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 ring-zinc-200 dark:ring-zinc-700",
  rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 ring-rose-100 dark:ring-rose-500/20",
};

const ContactPage = () => {
  const { t } = useTranslation();

  usePageMeta({
    title: t("meta.contactTitle", "Contact — Renscraft"),
    description: t(
      "meta.contactDescription",
      "Get in touch with the Renscraft team. Email, Instagram, GitHub, and TikTok.",
    ),
  });

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
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
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            <ArrowLeftIcon size={13} />
            {t("contact.backToHome")}
          </Link>

          <header className="mt-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {t("contact.label")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("contact.title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("contact.subtitle")}
            </p>
          </header>

          <section className="mt-10 grid gap-3 sm:grid-cols-2">
            {CHANNELS.map((c) => {
              const Icon = c.Icon;
              return (
                <a
                  key={c.id}
                  href={c.href}
                  target={c.id === "email" ? undefined : "_blank"}
                  rel={c.id === "email" ? undefined : "noopener noreferrer"}
                  className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${TONE[c.tone]}`}>
                      <Icon size={16} />
                    </div>
                    <ArrowUpRightIcon
                      size={14}
                      className="mt-1 shrink-0 text-zinc-300 transition group-hover:text-zinc-900 dark:text-zinc-600 dark:group-hover:text-zinc-50"
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {t(`contact.channels.${c.id}Label`)}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    {c.handle}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {t(`contact.channels.${c.id}Desc`)}
                  </p>
                </a>
              );
            })}
          </section>

          <section className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("contact.beforeWrite")}
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">
                  {t("contact.refundTitle")}
                </strong>{" "}
                {t("contact.refundText")}
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">
                  {t("contact.bugTitle")}
                </strong>{" "}
                {t("contact.bugText")}
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">
                  {t("contact.featureTitle")}
                </strong>{" "}
                {t("contact.featureText")}
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">
                  {t("contact.accountTitle")}
                </strong>{" "}
                {t("contact.accountText")}
              </li>
            </ul>
          </section>

          <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
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
            </ul>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ContactPage;
