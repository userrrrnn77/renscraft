// src/components/BuilderDataTab.jsx
//
// Builder left-sidebar "Data" tab. Shown for completed projects only.
// Two states:
//   1. No DynamicApp yet → review the AI's dataSpec proposal, then create.
//   2. App exists        → show collections, view documents, publish/unpublish.
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  DatabaseIcon,
  Globe2Icon,
  Loader2Icon,
  LockIcon,
  RefreshCwIcon,
  TrashIcon,
} from "lucide-react";
import { errorMessage } from "../api/api";
import {
  createApp,
  createCollection,
  deleteDocument,
  getApp,
  listApps,
  listCollections,
  listDocuments,
  publishApp,
  unpublishApp,
  updateCollection,
} from "../api/dynamicApps";

const POLICY_TONE = {
  private: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  "public-read":
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  "public-create-only":
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

const POLICY_LABEL = {
  private: "policyPrivate",
  "public-read": "policyRead",
  "public-create-only": "policyCreate",
};

const POLICIES = ["private", "public-create-only", "public-read"];

const suggestSlug = (name) => {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return base || "app";
};

// ─── Create App form ────────────────────────────────────────────────────────

const CreateAppForm = ({ project, onCreated }) => {
  const { t } = useTranslation();
  const [slug, setSlug] = useState(() => suggestSlug(project.name));
  const [busy, setBusy] = useState(false);

  const proposed = project.dataSpec?.collections ?? [];

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = slug.trim().toLowerCase();
    if (
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed) ||
      trimmed.length < 3 ||
      trimmed.length > 40
    ) {
      toast.error(t("data.invalidSlug"));
      return;
    }
    setBusy(true);
    try {
      const app = await createApp({
        sourceProjectId: project._id,
        slug: trimmed,
      });
      let created = 0;
      for (const c of proposed) {
        await createCollection(app._id, {
          name: c.name,
          label: c.label || c.name,
          fields: (c.fields ?? []).map((f) => ({
            key: f.key,
            label: f.label,
            type: f.type,
            required: !!f.required,
            options: f.options ?? [],
          })),
          policy: "private", // safe default; user can change later
        });
        created++;
      }
      toast.success(t("data.appCreated", { count: created }));
      onCreated();
    } catch (err) {
      toast.error(errorMessage(err, t("data.createFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
          {proposed.length > 0
            ? t("data.reviewTitle")
            : t("data.noProposalTitle")}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {proposed.length > 0 ? t("data.reviewSub") : t("data.noProposalSub")}
        </p>

        {proposed.length > 0 && (
          <ul className="mt-3 space-y-2">
            {proposed.map((c) => (
              <li
                key={c.name}
                className="rounded-md border border-zinc-100 px-2.5 py-2 text-xs dark:border-zinc-800">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {c.label || c.name}
                  <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500">
                    ({c.name})
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {t("data.fieldsCount", { count: c.fields?.length ?? 0 })}
                  {" · "}
                  {c.fields?.map((f) => f.key).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={submit} className="space-y-2">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {t("data.slugLabel")}
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          maxLength={40}
          disabled={busy}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50"
          spellCheck={false}
        />
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
          {t("data.slugHint")}
        </p>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
          {busy && <Loader2Icon size={12} className="animate-spin" />}
          {busy ? t("data.creating") : t("data.createApp")}
        </button>
      </form>
    </div>
  );
};

// ─── Collection card ────────────────────────────────────────────────────────

const CollectionCard = ({ appId, col, onUpdated }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ phase: "idle" });

  const [savingPolicy, setSavingPolicy] = useState(false);

  const changePolicy = async (next) => {
    if (next === col.policy) return;
    const isPublic = next.startsWith("public");
    if (isPublic && !window.confirm(t("data.policyConfirm"))) return;
    setSavingPolicy(true);
    try {
      const updated = await updateCollection(appId, col._id, {
        policy: next,
        ...(isPublic ? { confirmPublic: true } : {}),
      });
      onUpdated(updated);
      toast.success(t("data.policyUpdated"));
    } catch (err) {
      toast.error(errorMessage(err, t("data.policyUpdateFailed")));
    } finally {
      setSavingPolicy(false);
    }
  };

  const load = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const data = await listDocuments(appId, col._id, { page: 1, limit: 20 });
      setState({
        phase: "ready",
        documents: data.documents ?? [],
        total: data.total ?? 0,
      });
    } catch (err) {
      setState({
        phase: "error",
        message: errorMessage(err, t("data.docsLoadFailed")),
      });
    }
  }, [appId, col._id, t]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const remove = async (docId) => {
    if (!window.confirm(t("data.docDeleteConfirm"))) return;
    try {
      await deleteDocument(appId, col._id, docId);
      toast.success(t("data.docDeleted"));
      load();
    } catch (err) {
      toast.error(errorMessage(err, t("data.docDeleteFailed")));
    }
  };

  const tone = POLICY_TONE[col.policy] ?? POLICY_TONE.private;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-50">
            {col.label}
            <span className="ml-1.5 font-mono text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
              ({col.name})
            </span>
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            {t("data.fieldsCount", { count: col.fields?.length ?? 0 })}
          </p>
        </div>
        <select
          value={col.policy}
          onChange={(e) => changePolicy(e.target.value)}
          disabled={savingPolicy}
          className={`shrink-0 cursor-pointer rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider outline-none disabled:opacity-60 ${tone}`}>
          {POLICIES.map((p) => (
            <option key={p} value={p}>
              {t(`data.${POLICY_LABEL[p]}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          {open ? t("data.hideDocs") : t("data.viewDocs")}
        </button>
      </div>
      {open && (
        <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
          {state.phase === "loading" && (
            <Loader2Icon size={12} className="animate-spin text-zinc-400" />
          )}
          {state.phase === "error" && (
            <p className="text-[11px] text-red-600 dark:text-red-400">
              {state.message}
            </p>
          )}
          {state.phase === "ready" && state.documents.length === 0 && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {t("data.noDocs")}
            </p>
          )}
          {state.phase === "ready" && state.documents.length > 0 && (
            <ul className="space-y-1.5">
              {state.documents.map((d) => (
                <li
                  key={d._id}
                  className="flex items-start gap-2 rounded-md bg-zinc-50 px-2 py-1.5 text-[11px] dark:bg-zinc-900">
                  <div className="min-w-0 flex-1">
                    <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
                      {JSON.stringify(d.data, null, 0).slice(0, 160)}
                    </pre>
                    <p className="mt-0.5 text-[9px] text-zinc-400 dark:text-zinc-500">
                      {new Date(d.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(d._id)}
                    aria-label={t("data.deleteDoc")}
                    className="shrink-0 cursor-pointer rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                    <TrashIcon size={11} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {state.phase === "ready" && state.total > state.documents.length && (
            <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
              {t("data.showingOf", {
                shown: state.documents.length,
                total: state.total,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main tab ───────────────────────────────────────────────────────────────

// Cari function BuilderDataTab, ganti full dengan ini:
const BuilderDataTab = ({ project }) => {
  const { t } = useTranslation();
  const [state, setState] = useState({ phase: "loading" });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const apps = await listApps();
      const owned = apps.find(
        (a) => String(a.sourceProjectId) === String(project._id),
      );
      if (!owned) {
        setState({ phase: "no-app" });
        return;
      }
      const [app, collections] = await Promise.all([
        getApp(owned._id),
        listCollections(owned._id),
      ]);
      setState({ phase: "ready", app, collections });
    } catch (err) {
      setState({
        phase: "error",
        message: errorMessage(err, t("data.loadFailed")),
      });
    }
  }, [project._id, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const togglePublish = async () => {
    if (state.phase !== "ready") return;
    setBusy(true);
    const publish = state.app.status !== "published";
    try {
      const updated = publish
        ? await publishApp(state.app._id)
        : await unpublishApp(state.app._id);
      setState((s) => ({ ...s, app: updated }));
      toast.success(publish ? t("data.publishedOk") : t("data.unpublishedOk"));
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          publish ? t("data.publishFailed") : t("data.unpublishFailed"),
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  if (state.phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2Icon size={16} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="p-3">
        <p className="text-[11px] text-red-600 dark:text-red-400">
          {state.message}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          <RefreshCwIcon size={11} /> {t("common.tryAgain")}
        </button>
      </div>
    );
  }

  if (state.phase === "no-app") {
    return <CreateAppForm project={project} onCreated={refresh} />;
  }

  // state.phase === "ready"
  const { app, collections } = state;
  const hasPublic = collections.some((c) => c.policy !== "private");
  const statusKey =
    app.status === "published"
      ? "appStatusPublished"
      : app.status === "suspended"
        ? "appStatusSuspended"
        : app.status === "archived"
          ? "appStatusArchived"
          : "appStatusDraft";

  // Link ke halaman publik
  const publicUrl =
    window.location.hostname === "localhost"
      ? `/app/${app.slug}` // Fallback buat localhost
      : `https://${app.slug}.renscraft.cyou`;

  return (
    <div className="space-y-3 overflow-y-auto p-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-50">
              <DatabaseIcon size={12} />
              <span className="truncate font-mono">{app.slug}</span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t(`data.${statusKey}`)}
            </p>
          </div>
          <button
            type="button"
            onClick={togglePublish}
            disabled={busy}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            {busy ? (
              <Loader2Icon size={11} className="animate-spin" />
            ) : app.status === "published" ? (
              <LockIcon size={11} />
            ) : (
              <Globe2Icon size={11} />
            )}
            {app.status === "published"
              ? t("data.unpublishApp")
              : t("data.publishApp")}
          </button>
        </div>

        {app.status !== "published" && (
          <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            {t("data.publishWarning")}
          </p>
        )}

        {/* Tampilkan Link Publik kalau udah published */}
        {app.status === "published" && (
          <div className="mt-3 rounded-md bg-emerald-50 px-2 py-1.5 text-[10px] leading-relaxed text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            <p className="font-semibold mb-1">{t("data.liveAt")}:</p>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-mono break-all hover:text-emerald-900 dark:hover:text-emerald-100">
              {window.location.origin}
              {publicUrl}
            </a>
          </div>
        )}
      </div>

      {hasPublic && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-[10px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {t("data.policyWarning")}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {t("data.collections")}
        </p>
        {collections.length === 0 ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {t("data.emptyCollections")}
          </p>
        ) : (
          <div className="space-y-2">
            {collections.map((col) => (
              <CollectionCard
                key={col._id}
                appId={app._id}
                col={col}
                onUpdated={(u) =>
                  setState((s) => ({
                    ...s,
                    collections: s.collections.map((c) =>
                      c._id === u._id ? u : c,
                    ),
                  }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuilderDataTab;
