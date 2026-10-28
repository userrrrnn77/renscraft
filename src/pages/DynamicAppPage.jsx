// src/pages/DynamicAppPage.jsx
import { useEffect, useState } from "react";
import { Link, useParams, Link, useParams } from "react-router-dom";
import { AlertCircleIcon, ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { getPublicApp } from "../api/dynamicApps";
import { errorMessage } from "../api/api";
import FullPagePreview from "../components/FullPagePreview";
import usePageMeta from "../utils/usePageMeta";
import { useTranslation } from "react-i18next";

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

const DynamicAppPage = () => {
  const params = useParams();

  const { t } = useTranslation();
  const [dynamicAppData, setDynamicAppData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessageText, setErrorMessageText] = useState("");

  const getSlug = () => {
    const hostname = window.location.hostname;
    const baseDomain = "renscraft.cyou";

    // Cek apakah ini subdomain (bukan renscraft.cyou atau www.renscraft.cyou)
    if (
      hostname.endsWith(baseDomain) &&
      hostname !== baseDomain &&
      hostname !== `www.${baseDomain}`
    ) {
      return hostname.replace(`.${baseDomain}`, ""); // Output: "toko-buket"
    }
    return params.slug; // Fallback kalau diakses via /app/:slug
  };

  const slug = getSlug();

  usePageMeta({
    title: dynamicAppData
      ? `${dynamicAppData.slug} — Renscraft`
      : t("dynamicApp.metaTitle"),
    description: t("dynamicApp.metaDescription"),
  });

  useEffect(() => {
    if (!slug) return;

    setIsLoading(true);
    setErrorMessageText("");
    setDynamicAppData(null);

    const fetchPublicDynamicApp = async () => {
      try {
        const responseData = await getPublicApp(slug);
        setDynamicAppData(responseData);
      } catch (err) {
        console.error("Failed to load dynamic app: ", err);
        setErrorMessageText(
          errorMessage(err, "This app is not available or not published yet."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicDynamicApp();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2Icon className="animate-spin text-zinc-400" size={24} />
      </div>
    );
  }

  if (errorMessageText || !dynamicAppData) {
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
            {t("dynamicApp.unavailableTitle")}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-7 dark:text-zinc-400">
            {errorMessageText}
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
            <ArrowLeftIcon size={13} />
            {t("dynamicApp.backToRenscraft")}
          </Link>
        </div>
      </div>
    );
  }

  // Konversi format file dari DB ({ content: "..." }) ke format Sandpack (string)
  const sandpackFiles = {};
  for (const [path, entry] of Object.entries(dynamicAppData.files)) {
    sandpackFiles[path] = entry.content || entry;
  }

  return <FullPagePreview files={sandpackFiles} />;
};

export default DynamicAppPage;
