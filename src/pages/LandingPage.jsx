import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleIcon,
  ImageIcon,
  Link2Icon,
  Loader2Icon,
  MessageSquareIcon,
  PaletteIcon,
  SparklesIcon,
  TypeIcon,
  Wand2Icon,
  DownloadIcon,
} from "lucide-react";
import SiteNav from "../components/SiteNav";
import { useAppContext } from "../context/AppContext";
import usePageMeta from "../utils/usePageMeta";
import DisplayProjects from "../components/DisplayProjects";

const GRID_STYLE_LIGHT = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage:
    "radial-gradient(ellipse 55% 50% at 50% 0%, black 25%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 55% 50% at 50% 0%, black 25%, transparent 100%)",
};

const GRID_STYLE_DARK = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage:
    "radial-gradient(ellipse 55% 50% at 50% 0%, black 25%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 55% 50% at 50% 0%, black 25%, transparent 100%)",
};

const STEP_KEYS = [
  { key: "describe", icon: Wand2Icon },
  { key: "build", icon: SparklesIcon },
  { key: "change", icon: MessageSquareIcon },
  { key: "ship", icon: DownloadIcon },
];

const MOCK_FILES = [
  { path: "/App.js", state: "done" },
  { path: "/components/Header.js", state: "done" },
  { path: "/components/Menu.js", state: "active" },
  { path: "/components/Footer.js", state: "todo" },
  { path: "/styles.css", state: "todo" },
];

const BuildMock = () => {
  const { t } = useTranslation();
  const done = MOCK_FILES.filter((f) => f.state === "done").length;
  const total = MOCK_FILES.length;

  return (
    <div className="relative mx-auto mt-16 w-full max-w-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-4xl bg-linear-to-b from-red-500/[0.07] to-transparent blur-2xl dark:from-red-500/15"
      />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-3 flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              renscraft.my.id/builder
            </span>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
            {t("landing.mockPrompt")}
          </p>

          <div className="mt-5 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Loader2Icon
                size={11}
                className="animate-spin motion-reduce:animate-none text-zinc-500 dark:text-zinc-400"
              />
              {t("landing.mockWriting")}
            </span>
            <span>{t("landing.mockFilesCount", { done, total })}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full w-2/5 rounded-full bg-zinc-800 dark:bg-zinc-200" />
          </div>

          <ul className="mt-4 space-y-2">
            {MOCK_FILES.map((f) => (
              <li
                key={f.path}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs font-medium ${
                  f.state === "active"
                    ? "border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    : f.state === "done"
                      ? "border-zinc-100 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                      : "border-zinc-100 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500"
                }`}>
                {f.state === "done" && (
                  <CheckCircle2Icon
                    size={15}
                    className="shrink-0 text-emerald-500"
                  />
                )}
                {f.state === "active" && (
                  <Loader2Icon
                    size={15}
                    className="shrink-0 animate-spin motion-reduce:animate-none text-zinc-900 dark:text-zinc-50"
                  />
                )}
                {f.state === "todo" && (
                  <CircleIcon
                    size={15}
                    className="shrink-0 text-zinc-300 dark:text-zinc-700"
                  />
                )}
                {f.path}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const REFERENCE_ITEM_KEYS = [
  { key: "content", icon: MessageSquareIcon },
  { key: "images", icon: ImageIcon },
  { key: "colors", icon: PaletteIcon },
  { key: "fonts", icon: TypeIcon },
];

const ReferenceMock = () => {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto mt-14 w-full max-w-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-4xl bg-linear-to-b from-sky-500/[0.07] to-transparent blur-2xl dark:from-sky-500/15"
      />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3.5 md:px-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <Link2Icon size={13} className="text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
              https://my-portfolio.vercel.app
            </span>
            <span className="relative ml-auto flex size-2 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
            </span>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
            {t("landing.referenceAnalyze")}
          </button>
        </div>

        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Loader2Icon size={11} className="animate-spin text-sky-500" />
            <span>{t("landing.referenceReading")}</span>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full w-3/4 rounded-full bg-linear-to-r from-sky-400 to-sky-600" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {REFERENCE_ITEM_KEYS.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-2">
                  <Icon
                    size={13}
                    className="text-zinc-500 dark:text-zinc-400"
                  />
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                    {t(`landing.referenceItems.${key}.title`)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t(`landing.referenceItems.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[11px] text-zinc-400 dark:text-zinc-500">
            {t("landing.referenceFootnote")}
          </p>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loadingUser } = useAppContext();

  usePageMeta({
    title: t("meta.landingTitle", "Renscraft — Crafting your web with Rensdev"),
    description: t(
      "meta.landingDescription",
      "Describe your website, watch it get built, revise it by chat, then publish it or export the code.",
    ),
  });

  const handleStart = () => {
    if (loadingUser) return;
    if (!user) navigate("/login");
    else navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <SiteNav />

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center md:pb-28 md:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-180 overflow-hidden">
          <div
            className="absolute inset-0 dark:hidden"
            style={GRID_STYLE_LIGHT}
          />
          <div
            className="absolute inset-0 hidden dark:block"
            style={GRID_STYLE_DARK}
          />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-130 rounded-full bg-red-500/8 blur-[140px] dark:bg-red-500/20" />
        </div>

        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          {t("landing.heroTitle1")}
          <br />
          {t("landing.heroTitle2")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-600 md:text-lg dark:text-zinc-400">
          {t("landing.heroSub")}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-50">
            {t("landing.ctaBuild")} <ArrowRightIcon size={16} />
          </button>
          <Link
            to="/pricing"
            className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
            {t("landing.ctaPricing")}
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {t("landing.freeCreditsNote")}
        </p>

        <BuildMock />
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-6 pb-24 md:pb-32">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("landing.stepsTitle")}
        </h2>
        <ol className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {STEP_KEYS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.key} className="flex gap-5 py-6">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  <Icon size={15} />
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-medium">
                    <span className="mr-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      0{i + 1}
                    </span>
                    {t(`landing.steps.${s.key}.title`)}
                  </h3>
                  <p className="mt-1 max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {t(`landing.steps.${s.key}.text`)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Reference */}
      <section className="relative mx-auto max-w-4xl px-6 pb-24 md:pb-32">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {t("landing.referenceLabel")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {t("landing.referenceTitle1")}
            <br />
            {t("landing.referenceTitle2")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("landing.referenceSub")}
          </p>
        </div>

        <ReferenceMock />
      </section>

      <DisplayProjects />

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-12 text-white md:px-10 md:py-16 dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-100 rounded-full bg-red-500/20 blur-[120px]"
            />
            <div className="relative">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {t("landing.ctaDiyLabel")}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("landing.ctaDiyTitle")}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
                {t("landing.ctaDiyText")}
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                {t("landing.ctaDiyButton")} <ArrowRightIcon size={15} />
              </button>
              <p className="mt-4 text-xs text-zinc-500">
                {t("landing.ctaDiyNote")}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-50 to-white px-6 py-12 md:px-10 md:py-16 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 right-0 size-100 rounded-full bg-sky-500/[0.07] blur-[120px] dark:bg-sky-500/10"
            />
            <div className="relative">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                {t("landing.ctaCustomLabel")}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("landing.ctaCustomTitle")}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t("landing.ctaCustomText")}
              </p>
              <a
                href="https://rensdev.my.id/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-50">
                {t("landing.ctaCustomButton")} <ArrowRightIcon size={15} />
              </a>
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                {t("landing.ctaCustomNote")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white pt-16 pb-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="Renscraft Logo"
                  className="size-6 invert dark:invert-0"
                />
                <span className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Renscraft
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("landing.footerTagline")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {t("landing.footerConnect")}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                <li>
                  <a
                    href="https://rensdev.my.id"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("landing.footerDeveloperPortal")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/userrrrnn77"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("landing.footerGithub")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/userrrrnn77"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("landing.footerInstagram")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://tiktok.com/@userrrrnn77"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("landing.footerTiktok")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {t("landing.footerLegal")}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("auth.agreeTerms")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("auth.agreePrivacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/refund"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("auth.agreeRefund")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    {t("contact.label")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 sm:flex-row dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("landing.footerCopyright", { year: new Date().getFullYear() })}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              {t("landing.footerBuiltBy")}
              <a
                href="https://rensdev.my.id"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                Rensdev
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
