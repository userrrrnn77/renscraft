import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  detectDependencies,
  PREVIEW_EXTERNAL_RESOURCES,
  isPreviewShellPath,
  withPreviewHtml,
} from "../utils/sandpackUtils";
import SandpackErrorMonitor from "./SandpackErrorMonitor";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";

// ─── Ready signal ───────────────────────────────────────────────────────────

const ReadySignal = () => {
  const { sandpack } = useSandpack();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    if (sandpack.status !== "idle") return;

    sentRef.current = true;
    const t = setTimeout(() => {
      try {
        window.parent?.postMessage({ type: "renscraft:preview-ready" }, "*");
      } catch {
        // cross-origin parent: nggak masalah, skip
      }
    }, 300);

    return () => clearTimeout(t);
  }, [sandpack.status]);

  return null;
};

// ─── Remake badge ───────────────────────────────────────────────────────────
//
// Ditampilkan HANYA kalau project ini ditandai remake (project.remakeOf tidak
// kosong). Badge ada di luar iframe Sandpack, di atas konten preview. Link
// "Laporkan" menuju ContactPage (default: /contact?report=<projectId>).

const RemakeBadge = ({ remakeOf, reportHref }) => {
  const { t } = useTranslation();
  const hasRemake = Array.isArray(remakeOf) && remakeOf.length > 0;
  if (!hasRemake) return null;

  const more =
    remakeOf.length > 1
      ? t("preview.remakeBadge.more", { count: remakeOf.length - 1 })
      : "";
  const from = t("preview.remakeBadge.from", {
    domain: remakeOf[0],
    more,
  });

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-medium text-zinc-600 shadow-lg ring-1 ring-zinc-200 backdrop-blur dark:bg-zinc-900/95 dark:text-zinc-300 dark:ring-zinc-700">
      <span>{from}</span>
      <span className="text-zinc-400 dark:text-zinc-500">·</span>
      <span>{t("preview.remakeBadge.madeWith")}</span>
      <span className="text-zinc-400 dark:text-zinc-500">·</span>
      <a
        href={reportHref}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-red-600 hover:underline dark:text-red-400">
        {t("preview.remakeBadge.report")}
      </a>
    </div>
  );
};

// ─── Preview ────────────────────────────────────────────────────────────────

const FullPagePreview = ({ files, remakeOf, projectId, reportHref }) => {
  const [showErrorOverlay, setShowErrorOverlay] = useState(true);

  const sandpackFiles = useMemo(() => {
    const spFiles = {};
    if (!files) return {};
    for (const [path, content] of Object.entries(files)) {
      if (isPreviewShellPath(path)) continue;
      spFiles[path] = { code: content };
    }
    return withPreviewHtml(spFiles);
  }, [files]);

  const dependencies = useMemo(() => {
    if (!files) return {};
    return detectDependencies(files);
  }, [files]);

  const resolvedReportHref =
    reportHref ||
    (projectId
      ? `/contact?report=${encodeURIComponent(projectId)}`
      : "/contact");

  return (
    <div className="h-screen w-screen bg-white overflow-hidden">
      <SandpackProvider
        template="react"
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          externalResources: PREVIEW_EXTERNAL_RESOURCES,
          logLevel: 0,
        }}
        className={`h-full w-full`}>
        <ReadySignal />
        <SandpackErrorMonitor onErrorChange={setShowErrorOverlay} />
        <SandpackLayout
          className={`h-full w-full border-none! bg-transparent!`}>
          <SandpackPreview
            showNavigator={false}
            showRefreshButton={false}
            showOpenInCodeSandbox={false}
            showSandpackErrorOverlay={showErrorOverlay}
            className="h-full w-full"
          />
        </SandpackLayout>
      </SandpackProvider>
      <RemakeBadge remakeOf={remakeOf} reportHref={resolvedReportHref} />
    </div>
  );
};

export default FullPagePreview;
