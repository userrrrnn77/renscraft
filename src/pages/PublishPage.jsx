// src/pages/PublishPage.jsx

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { errorMessage } from "../api/api";
import Loading from "../components/Loading";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import FullPagePreview from "../components/FullPagePreview";
import usePageMeta from "../utils/usePageMeta"; 

const GRID_STYLE_LIGHT = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
  maskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
};

const GRID_STYLE_DARK = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
  maskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
};

const PublishPage = () => {
  const { t } = useTranslation();
  const { name } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── INI DIA YANG KITA TAMBAHIN BRE ───
  usePageMeta({
    title: project
      ? `${project.name} — Renscraft`
      : loading
        ? "Loading... — Renscraft"
        : "Website unavailable — Renscraft",
    description: project
      ? `View ${project.name}, a website built with Renscraft AI.`
      : "This website is not available or is not published yet.",
  });
  // ─────────────────────────────────────

  useEffect(() => {
    if (!name) return;

    setLoading(true);
    setError("");
    setProject(null);

    const fetchPublicProject = async () => {
      try {
        const { data } = await api.get(
          `/api/projects/public/${encodeURIComponent(name)}`,
        );
        setProject(data);
      } catch (err) {
        console.error("Failed to fetch public project: ", err);
        setError(errorMessage(err, t("publishPage.errorFallback")));
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProject();
  }, [name, t]);

  if (loading) return <Loading />;

  if (error || !project) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-4 text-center dark:bg-zinc-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 dark:hidden"
            style={GRID_STYLE_LIGHT}
          />
          <div
            className="absolute inset-0 hidden dark:block"
            style={GRID_STYLE_DARK}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-105 rounded-full bg-red-500/6 blur-[120px] dark:bg-red-500/10" />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-5 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
            <AlertCircleIcon size={24} />
          </div>

          <h1 className="text-xl font-semibold text-zinc-900 mb-2 dark:text-zinc-50">
            {t("publishPage.errorTitle")}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-7 dark:text-zinc-400">
            {error}
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
            <ArrowLeftIcon size={13} />
            {t("publishPage.backToRenscraft")}
          </Link>
        </div>
      </div>
    );
  }

  return <FullPagePreview files={project.files} />;
};

export default PublishPage;
