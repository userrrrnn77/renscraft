// src/pages/StatusPage.jsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import SiteNav from "../components/SiteNav";
import usePageMeta from "../utils/usePageMeta";
import useStatus from "../hooks/useStatus";
import StatusBanner from "../components/status/StatusBanner";
import ServiceCard from "../components/status/ServiceCard";
import IncidentList from "../components/status/IncidentList";

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

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60"
      />
    ))}
  </div>
);

const StatusPage = () => {
  const { t } = useTranslation();
  const { data, error, loading, refetch } = useStatus();

  usePageMeta({
    title: t("status.metaTitle", "System Status — Renscraft"),
    description: t(
      "status.metaDescription",
      "Live status and 30-day uptime history of Renscraft services.",
    ),
  });

  const isNotConfigured = error === "STATUS_NOT_CONFIGURED";

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
            {t("legal.backToHome")}
          </Link>

          <header className="mt-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {t("status.label")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("status.title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("status.subtitle")}
            </p>
          </header>

          <div className="mt-8 space-y-4">
            {loading && !data && <Skeleton />}

            {!loading && isNotConfigured && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                {t("status.notConfigured")}
              </div>
            )}

            {!loading && !data && error && !isNotConfigured && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                <p>{t("status.loadError")}</p>
                <button
                  type="button"
                  onClick={refetch}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                  <RefreshCwIcon size={12} />
                  {t("status.retry")}
                </button>
              </div>
            )}

            {data && (
              <>
                {data.stale && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    {t("status.stale")}
                  </div>
                )}
                {error && !isNotConfigured && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    {t("status.loadError")}
                  </div>
                )}

                <StatusBanner
                  overall={data.overall}
                  generatedAt={data.generated_at}
                  maintenance={data.maintenance}
                />

                <div className="space-y-4">
                  {data.services.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </div>

                <IncidentList incidents={data.incidents} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StatusPage;
