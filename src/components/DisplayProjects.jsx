import { memo, useEffect, useMemo, useRef, useState } from "react";
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

const PAGE_SIZE = 3;
const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 800;
const READY_TIMEOUT_MS = 20000;
const MAX_MOUNTED_PAGES = 2;

// sessionStorage: tahan refresh, hilang saat tab ditutup. Cache-nya kecil
// (cuma list project + page number), jadi aman.
const PROJECTS_KEY = "renscraft:publicProjects";
const PAGE_KEY = "renscraft:publicProjectsPage";

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
    // quota penuh / storage diblokir → cache no-op
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
      const getTime = (project) => {
        const time = Date.parse(project.updatedAt || project.createdAt || "");
        return Number.isFinite(time) ? time : 0;
      };
      return getTime(b) - getTime(a);
    });
};

const CardLoadingOverlay = ({ visible, isDark }) => {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${
        isDark ? "bg-zinc-950" : "bg-white"
      } ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex items-center gap-1">
        <span
          className="size-1.5 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-600"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="size-1.5 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-600"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="size-1.5 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-600"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <p className="text-[10px] font-medium tracking-tight text-zinc-400 dark:text-zinc-500">
        {t("preview.preparing")}
      </p>
    </div>
  );
};

export const ProjectCard = memo(({ project, hidden = false }) => {
  const { t } = useTranslation();
  const previewRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(0.25);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  const publishPath = `/publish/${encodeURIComponent(project.name)}`;

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const updateScale = () => {
      const width = container.clientWidth;
      if (width > 0) setScale(width / PREVIEW_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const win = iframeRef.current?.contentWindow;
      if (!win || e.source !== win) return;
      if (e.data?.type !== "renscraft:preview-ready") return;
      setReady(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!ready) {
        console.warn(
          `[DisplayProjects] preview for "${project.name}" didn't signal ready within ${READY_TIMEOUT_MS}ms`,
        );
      }
      setVisible(false);
    }, READY_TIMEOUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.name]);

  return (
    <article
      className={`${
        hidden ? "hidden" : ""
      } group min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-none`}>
      <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-10 items-center gap-3 border-b border-zinc-200 px-3 dark:border-zinc-800">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950">
            <Globe2Icon
              size={11}
              className="shrink-0 text-zinc-400 dark:text-zinc-500"
            />
            <span className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
              {project.name}
            </span>
          </div>
        </div>

        <div
          ref={previewRef}
          className="relative aspect-16/10 overflow-hidden bg-white dark:bg-zinc-950">
          <iframe
            ref={iframeRef}
            key={`${project._id || project.name}-${project.version ?? 0}`}
            src={publishPath}
            title={t("displayProjects.previewOf", { name: project.name })}
            loading="lazy"
            scrolling="no"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute left-0 top-0 max-w-none border-0 bg-white"
            style={{
              width: `${PREVIEW_WIDTH}px`,
              height: `${PREVIEW_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />

          <div className="absolute inset-0 z-20">
            <div className="block dark:hidden h-full w-full">
              <CardLoadingOverlay visible={visible} isDark={false} />
            </div>
            <div className="hidden dark:block h-full w-full">
              <CardLoadingOverlay visible={visible} isDark={true} />
            </div>
          </div>

          <Link
            to={publishPath}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("displayProjects.openInNewTab", {
              name: project.name,
            })}
            className="absolute inset-0 z-30"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {project.name}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t("displayProjects.published")}
            </p>
          </div>

          <Link
            to={publishPath}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("displayProjects.viewWebsite")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-900 hover:bg-zinc-950 hover:text-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-950">
            <ArrowUpRightIcon size={17} />
          </Link>
        </div>

        <Link
          to={publishPath}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
          {t("displayProjects.viewWebsite")}
          <ArrowUpRightIcon size={14} />
        </Link>
      </div>
    </article>
  );
});
ProjectCard.displayName = "ProjectCard";

const DisplayProjects = () => {
  const { t } = useTranslation();

  // Ambil dari cache dulu. Kalau ada, jangan tampilkan loading skeleton,
  // langsung render list-nya. Fetch tetap jalan di belakang buat revalidate.
  const cachedProjects = useMemo(() => readProjects(), []);
  const [projects, setProjects] = useState(cachedProjects ?? []);
  const [loading, setLoading] = useState(cachedProjects === null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(() => readPage());
  const [reloadKey, setReloadKey] = useState(0);
  const [mountedPages, setMountedPages] = useState(() => [readPage()]);

  // Persist page setiap berubah
  useEffect(() => {
    writePage(page);
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPublicProjects = async () => {
      // Skeleton cuma kalau memang belum ada cache
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

        console.error(
          "[DisplayProjects] Failed to fetch public projects:",
          err,
        );

        // Kalau ada cache, biarin user lihat cache-nya; cuma log error.
        // Kalau nggak ada, baru tampilkan error screen.
        if (projects.length === 0) {
          setError(errorMessage(err, t("displayProjects.errorFallback")));
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

  useEffect(() => {
    setMountedPages((prev) => {
      if (prev[prev.length - 1] === currentPage) return prev;
      const next = [...prev.filter((p) => p !== currentPage), currentPage];
      return next.slice(-MAX_MOUNTED_PAGES);
    });
  }, [currentPage]);

  const isMounted = (pageNum) => mountedPages.includes(pageNum);

  return (
    <section
      aria-labelledby="published-projects-title"
      aria-busy={loading}
      className="mx-auto w-full max-w-6xl px-6 pb-24 pt-8 md:pb-32">
      <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {t("displayProjects.label")}
          </p>

          <h2
            id="published-projects-title"
            className="text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
            {t("displayProjects.title1")}
            <br className="hidden sm:block" /> {t("displayProjects.title2")}
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("displayProjects.subtitle")}
          </p>
        </div>

        {!loading && !error && projects.length > 0 && (
          <p className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
            {t("displayProjects.publishedCount", { count: projects.length })}
          </p>
        )}
      </div>

      {loading && (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          aria-label={t("displayProjects.loadingLabel")}>
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <div
              key={index}
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
            onClick={() => setReloadKey((key) => key + 1)}
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

          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t("displayProjects.emptyTitle")}
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t("displayProjects.emptySub")}
          </p>

          <Link
            to="/chat"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
            {t("displayProjects.buildWebsite")}
            <ArrowUpRightIcon size={14} />
          </Link>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => {
              const itemPage = Math.floor(i / PAGE_SIZE) + 1;
              if (!isMounted(itemPage)) return null;
              return (
                <ProjectCard
                  key={project._id || project.name}
                  project={project}
                  hidden={itemPage !== currentPage}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label={t("displayProjects.pagination")}
              className="mt-9 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                aria-label={t("displayProjects.previousPage")}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <ChevronLeftIcon size={18} />
              </button>

              <span
                aria-live="polite"
                className="min-w-24 text-center text-sm text-zinc-600 dark:text-zinc-400">
                {t("displayProjects.page", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                aria-label={t("displayProjects.nextPage")}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <ChevronRightIcon size={18} />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
};

export default DisplayProjects;
