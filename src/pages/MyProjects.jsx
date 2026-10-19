// src/pages/MyProjects.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
  FolderOpenIcon,
  Globe2Icon,
  Grid3x3Icon,
  ListIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  TrashIcon,
} from "lucide-react";
import moment from "moment";
import SiteNav from "../components/SiteNav";
import { useAppContext } from "../context/AppContext";
import usePageMeta from "../utils/usePageMeta";

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

const BUSY_STATUSES = new Set(["pending", "generating", "revising"]);

const SECTIONS = [
  {
    id: "published",
    icon: Globe2Icon,
    test: (p) => p.published === true,
  },
  {
    id: "draft",
    icon: LockIcon,
    test: (p) =>
      !p.published && p.status !== "failed" && !BUSY_STATUSES.has(p.status),
  },
  {
    id: "busy",
    icon: Loader2Icon,
    test: (p) => !p.published && BUSY_STATUSES.has(p.status),
  },
  {
    id: "failed",
    icon: RefreshCwIcon,
    test: (p) => !p.published && p.status === "failed",
  },
];

const STATUS_TONE = {
  published:
    "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  draft:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  busy: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
  failed:
    "bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
};

const categoryOf = (project) =>
  project.published
    ? "published"
    : project.status === "failed"
      ? "failed"
      : BUSY_STATUSES.has(project.status)
        ? "busy"
        : "draft";

// ── Thumbnail ───────────────────────────────────────────────────────────────

const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 800;

const ProjectThumbnail = ({ project, mode = "grid" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(mode === "grid" ? 0.28 : 0.12);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / PREVIEW_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const src = project.published
    ? `/publish/${encodeURIComponent(project.name)}`
    : `/preview/${project._id}`;

  return (
    <div
      ref={ref}
      className="relative overflow-hidden aspect-16/10 bg-zinc-100 dark:bg-zinc-900">
      {visible ? (
        <iframe
          key={`${project._id}-${project.version ?? 0}`}
          src={src}
          title={project.name}
          loading="lazy"
          scrolling="no"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left border-0 bg-white"
          style={{
            width: `${PREVIEW_WIDTH}px`,
            height: `${PREVIEW_HEIGHT}px`,
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
          <Loader2Icon
            size={mode === "grid" ? 20 : 14}
            className="animate-spin text-zinc-300 dark:text-zinc-700"
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-zinc-950/5 dark:ring-white/5" />
    </div>
  );
};

// ── Grid card ───────────────────────────────────────────────────────────────

const ProjectGridCard = ({ project, onDelete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cat = categoryOf(project);
  const canView = project.published;
  const previewSrc = `/preview/${project._id}`;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition duration-200 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-700 dark:hover:shadow-none">
      <button
        type="button"
        onClick={() => navigate(`/chat/${project._id}`)}
        className="block w-full cursor-pointer text-left">
        <ProjectThumbnail project={project} mode="grid" />
      </button>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {project.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onDelete(project)}
            aria-label={t("myProjects.deleteAria", { name: project.name })}
            className="shrink-0 cursor-pointer rounded-md p-1.5 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
            <TrashIcon size={13} />
          </button>
        </div>

        {project.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {project.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ${STATUS_TONE[cat]}`}>
            {t(`myProjects.status.${cat}`)}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <ClockIcon size={10} />
            {moment(project.updatedAt || project.createdAt).fromNow()}
          </span>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            v{project.version}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/chat/${project._id}`)}
            className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            {t("myProjects.open")}
            <ArrowRightIcon size={13} />
          </button>

          {canView && (
            <Link
              to={`/publish/${encodeURIComponent(project.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
              {t("myProjects.viewProject")}
              <ArrowRightIcon size={13} />
            </Link>
          )}

          <Link
            to={previewSrc}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("myProjects.openPreviewAria")}
            className="ml-auto inline-flex size-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
            <ArrowUpRightIcon size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
};

// ── List row ────────────────────────────────────────────────────────────────

const ProjectListRow = ({ project, onDelete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cat = categoryOf(project);

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-3 py-3 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-700">
      <button
        type="button"
        onClick={() => navigate(`/chat/${project._id}`)}
        className="shrink-0 cursor-pointer overflow-hidden rounded-md"
        style={{ width: 96 }}>
        <div className="w-24">
          <ProjectThumbnail project={project} mode="list" />
        </div>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/chat/${project._id}`)}
            className="min-w-0 cursor-pointer truncate text-left text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50">
            {project.name}
          </button>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ${STATUS_TONE[cat]}`}>
            {t(`myProjects.status.${cat}`)}
          </span>
        </div>

        {project.description && (
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {project.description}
          </p>
        )}

        <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <ClockIcon size={10} />
            {moment(project.updatedAt || project.createdAt).fromNow()}
          </span>
          <span>v{project.version}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {project.published && (
          <Link
            to={`/publish/${encodeURIComponent(project.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("myProjects.openLiveAria")}
            className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
            <Globe2Icon size={14} />
          </Link>
        )}
        <button
          type="button"
          onClick={() => onDelete(project)}
          aria-label={t("myProjects.deleteAria", { name: project.name })}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
          <TrashIcon size={14} />
        </button>
        <Link
          to={`/chat/${project._id}`}
          aria-label={t("myProjects.openProjectAria")}
          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </div>
  );
};

// ── Section ─────────────────────────────────────────────────────────────────

const Section = ({ section, projects, viewMode, onDelete }) => {
  const { t } = useTranslation();
  const Icon = section.icon;

  return (
    <section className="mt-12 first:mt-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Icon size={12} className="text-zinc-400 dark:text-zinc-500" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {t(`myProjects.sections.${section.id}.label`)}
            <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-600">
              — {t(`myProjects.sections.${section.id}.sub`)}
            </span>
          </span>
        </div>

        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />

        <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">
          {t("myProjects.projectsCount", { count: projects.length })}
        </span>
      </div>

      {viewMode === "grid" ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectGridCard key={p._id} project={p} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {projects.map((p) => (
            <ProjectListRow key={p._id} project={p} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
};

// ── Delete modal ────────────────────────────────────────────────────────────

const DeleteConfirm = ({ project, busy, onClose, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs dark:bg-zinc-950/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <h3 className="text-base font-semibold">
          {t("myProjects.delete.title")}
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Trans
            i18nKey="myProjects.delete.body"
            values={{ name: project.name }}
            components={[
              <span
                key="0"
                className="font-medium text-zinc-900 dark:text-zinc-50"
              />,
            ]}
          />
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {busy && <Loader2Icon size={12} className="animate-spin" />}
            {busy ? t("myProjects.delete.deleting") : t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────

const VIEW_KEY = "renscraft:my-projects-view";

const readStoredView = () => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
};

const MyProjects = () => {
  const { t } = useTranslation();
  const { user, projects, loadProjects, handleDelete } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState(readStoredView);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  usePageMeta({
    title: t("meta.myProjectsTitle", "My Projects — Renscraft"),
    description: t(
      "meta.myProjectsDescription",
      "All your Renscraft projects: drafts, building, and published sites.",
    ),
  });

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, viewMode);
    } catch {
      // ignore
    }
  }, [viewMode]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadProjects().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, loadProjects]);

  const grouped = useMemo(() => {
    return SECTIONS.map((s) => ({
      ...s,
      projects: projects.filter(s.test),
    }));
  }, [projects]);

  const filterTabs = [
    { id: "all", count: projects.length },
    ...grouped.map((s) => ({ id: s.id, count: s.projects.length })),
  ].filter((f) => f.id === "all" || f.count > 0);

  const sectionsToRender =
    filter === "all" ? grouped : grouped.filter((s) => s.id === filter);
  const visibleSections = sectionsToRender.filter((s) => s.projects.length > 0);

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await handleDelete(pendingDelete._id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const EXAMPLE_KEYS = ["portfolio", "landing", "culinary", "wedding"];

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

        <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10 md:pt-14">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {t("myProjects.label")}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                {t("myProjects.title")}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t("myProjects.subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!loading && projects.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 rounded-full border border-zinc-200 bg-white/60 p-1 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                  {filterTabs.map((f) => {
                    const active = filter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}>
                        {t(`myProjects.filters.${f.id}`)}
                        <span
                          className={`text-[10px] font-semibold ${
                            active
                              ? "opacity-70"
                              : "text-zinc-400 dark:text-zinc-500"
                          }`}>
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!loading && projects.length > 0 && (
                <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white/60 p-0.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    aria-label={t("myProjects.views.gridAria")}
                    aria-pressed={viewMode === "grid"}
                    className={`inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition ${
                      viewMode === "grid"
                        ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                        : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}>
                    <Grid3x3Icon size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-label={t("myProjects.views.listAria")}
                    aria-pressed={viewMode === "list"}
                    className={`inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition ${
                      viewMode === "list"
                        ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                        : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}>
                    <ListIcon size={13} />
                  </button>
                </div>
              )}

              <Link
                to="/chat"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                <PlusIcon size={14} />
                {t("myProjects.new")}
              </Link>
            </div>
          </header>

          {loading && (
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="aspect-16/10 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-800">
              <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <FolderOpenIcon size={22} />
              </div>
              <h2 className="text-lg font-semibold">
                {t("myProjects.emptyTitle")}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("myProjects.emptySub")}
              </p>

              <div className="mt-8 w-full max-w-md">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                  {t("myProjects.emptyTry")}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EXAMPLE_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        navigate("/chat", {
                          state: {
                            prefilledPrompt: t(`myProjects.emptyExamples.${k}`),
                          },
                        })
                      }
                      className="group cursor-pointer rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-700">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                        {t(`myProjects.filters.${k}`, k)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {t(`myProjects.emptyExamples.${k}`)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Link
                to="/chat"
                className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                <PlusIcon size={15} />
                {t("myProjects.emptyStartScratch")}
              </Link>
            </div>
          )}

          {!loading && projects.length > 0 && visibleSections.length === 0 && (
            <div className="mt-16 rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-800">
              <RefreshCwIcon
                size={22}
                className="mx-auto text-zinc-400 dark:text-zinc-500"
              />
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {t("myProjects.filteredEmpty")}
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-4 cursor-pointer text-xs font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-50">
                {t("myProjects.filteredEmptyViewAll")}
              </button>
            </div>
          )}

          {!loading &&
            visibleSections.map((section) => (
              <Section
                key={section.id}
                section={section}
                projects={section.projects}
                viewMode={viewMode}
                onDelete={setPendingDelete}
              />
            ))}

          {!loading && projects.length > 0 && (
            <p className="mt-16 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
              {t("myProjects.totalCount", { count: projects.length })}
            </p>
          )}
        </main>
      </div>

      {pendingDelete && (
        <DeleteConfirm
          project={pendingDelete}
          busy={deleting}
          onClose={() => setPendingDelete(null)}
          onConfirm={onConfirmDelete}
        />
      )}
    </div>
  );
};

export default MyProjects;
