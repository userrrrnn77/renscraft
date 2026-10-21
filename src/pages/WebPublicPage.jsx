// src/pages/WebPublicPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Globe2Icon,
  RefreshCwIcon,
} from "lucide-react";
import api, { errorMessage } from "../api/api";
import SiteNav from "../components/SiteNav";
import usePageMeta from "../utils/usePageMeta";
import { ProjectCard } from "../components/DisplayProjects";

// 3 kolom × 5 baris = 15 kartu per halaman
const PAGE_SIZE = 15;
// Simpan maksimal 2 halaman ter-mount biar back/forward instan,
// halaman lama otomatis di-unmount.
const MAX_MOUNTED_PAGES = 2;

// Cache list pakai sessionStorage: refresh nggak nge-flicker.
// Di-share dengan DisplayProjects (key sama) biar sekali fetch, dua tempat pakai.
const PROJECTS_KEY = "renscraft:publicProjects";
const PAGE_KEY = "renscraft:webpubPage";

const readProjects = () => {
  try {
    const raw = sessionStorage.getItem(PROJECTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeProjects = (list) => {
  try {
    sessionStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
  } catch {
    // quota penuh / diblokir → no-op
  }
};

const readPage = () => {
  try {
    const raw = sessionStorage.getItem(PAGE_KEY);
    const n = parseInt(raw ?? "", 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
};

const writePage = (page) => {
  try {
    sessionStorage.setItem(PAGE_KEY, String(page));
  } catch {
    // ignore
  }
};

const getProjects = (payload) => {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.projects)
        ? payload.projects
        : [];

  return rows
    .filter(
      (project) =>
        project &&
        typeof project.name === "string" &&
        project.name.trim() &&
        project.published !== false,
    )
    .sort((a, b) => {
      const getTime = (p) => {
        const time = Date.parse(p.updatedAt || p.createdAt || "");
        return Number.isFinite(time) ? time : 0;
      };
      return getTime(b) - getTime(a);
    });
};

const WebPublicPage = () => {
  const { t } = useTranslation();

  usePageMeta({
    title: t("webpub.metaTitle", "Published Websites — Renscraft"),
    description: t(
      "webpub.metaDescription",
      "Browse websites built and published with Renscraft.",
    ),
  });

  const cachedProjects = useMemo(() => readProjects(), []);
  const [projects, setProjects] = useState(cachedProjects ?? []);
  const [loading, setLoading] = useState(cachedProjects === null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(() => readPage());
  const [reloadKey, setReloadKey] = useState(0);
  const [mountedPages, setMountedPages] = useState(() => [readPage()]);
  const topRef = useRef(null);

  useEffect(() => {
    writePage(page);
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPublicProjects = async () => {
      if (projects.length === 0) setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/api/projects/public", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        const list = getProjects(data);
        setProjects(list);
        writeProjects(list);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("[WebPublicPage] fetch failed:", err);
        if (projects.length === 0) {
          setError(errorMessage(err, t("webpub.errorFallback")));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchPublicProjects();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, t]);

  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  // Keep last 2 pages mounted; the rest unmount so we don't leak 100 iframes.
  useEffect(() => {
    setMountedPages((prev) => {
      if (prev[prev.length - 1] === currentPage) return prev;
      const next = [...prev.filter((p) => p !== currentPage), currentPage];
      return next.slice(-MAX_MOUNTED_PAGES);
    });
  }, [currentPage]);

  // Scroll balik ke atas tiap ganti halaman (bukan tiap render).
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const isMounted = (p) => mountedPages.includes(p);
  const startIdx = (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(currentPage * PAGE_SIZE, projects.length);

  return (
    <div className="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <SiteNav />

      <main
        ref={topRef}
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-24 pt-8 md:pt-14">
        <header className="mb-8 md:mb-10">
          <p className="mb-2 md:mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            {t("webpub.label")}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            {t("webpub.title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("webpub.subtitle")}
          </p>
          {!loading && !error && projects.length > 0 && (
            <p className="mt-4 text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
              {t("webpub.showing", {
                start: startIdx,
                end: endIdx,
                total: projects.length,
              })}
            </p>
          )}
        </header>

        {loading && (
          <div
            aria-label={t("webpub.loading")}
            className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="h-10 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
                <div className="aspect-16/10 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl border border-zinc-200 px-6 py-12 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              <RefreshCwIcon size={14} />
              {t("common.tryAgain")}
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
            <Globe2Icon
              size={28}
              className="mx-auto text-zinc-400 dark:text-zinc-500"
            />
            <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {t("webpub.emptyTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("webpub.emptySub")}
            </p>
            <Link
              to="/chat"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              {t("webpub.buildWebsite")}
              <ArrowUpRightIcon size={14} />
            </Link>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {/* Hanya render halaman yang masih "mounted".
                  Halaman lain di-unmount supaya browser nggak nyimpen 100+ iframe. */}
              {mountedPages.flatMap((p) => {
                const start = (p - 1) * PAGE_SIZE;
                const end = start + PAGE_SIZE;
                return projects
                  .slice(start, end)
                  .map((project) => (
                    <ProjectCard
                      key={project._id || project.name}
                      project={project}
                      hidden={p !== currentPage}
                    />
                  ));
              })}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label={t("webpub.pagination")}
                className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  aria-label={t("webpub.previous")}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <ChevronLeftIcon size={16} />
                </button>

                <span className="min-w-28 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  {t("webpub.page", {
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  aria-label={t("webpub.next")}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <ChevronRightIcon size={16} />
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default WebPublicPage;
