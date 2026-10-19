import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SandpackCodeEditor,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import {
  detectDependencies,
  PREVIEW_EXTERNAL_RESOURCES,
  isPreviewShellPath,
  withPreviewHtml,
} from "../utils/sandpackUtils";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import SandpackErrorMonitor from "./SandpackErrorMonitor";

const FONT = {
  body: "'Urbanist', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
  size: "13px",
  lineHeight: "1.6",
};

const LIGHT_THEME = {
  colors: {
    surface1: "#ffffff",
    surface2: "#f4f4f5",
    surface3: "#e4e4e7",
    clickable: "#71717a",
    base: "#09090b",
    disabled: "#a1a1aa",
    hover: "#18181b",
    accent: "#18181b",
    error: "#ef4444",
    errorSurface: "#fef2f2",
  },
  font: FONT,
};

const DARK_THEME = {
  colors: {
    surface1: "#09090b",
    surface2: "#18181b",
    surface3: "#27272a",
    clickable: "#a1a1aa",
    base: "#fafafa",
    disabled: "#52525b",
    hover: "#fafafa",
    accent: "#fafafa",
    error: "#ef4444",
    errorSurface: "#450a0a",
  },
  font: FONT,
};

const toCode = (file) =>
  typeof file === "string" ? file : file?.content || "";

// ─── Preview loading overlay ────────────────────────────────────────────────

const PreviewLoadingOverlay = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { sandpack } = useSandpack();

  const status = sandpack.status;
  const hasError = Boolean(sandpack.error);

  const isLoading = !hasError && (status === "initial" || status === "running");

  const [visible, setVisible] = useState(true);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      console.warn(
        `[Preview] overlay force-hidden after 20s (status=${status}, error=${hasError})`,
      );
      setVisible(false);
    }, 20000);
    return () => clearTimeout(t);
  }, [visible, status, hasError]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 transition-opacity duration-300 ${
        isDark ? "bg-zinc-950" : "bg-white"
      }`}>
      <div className="flex items-center gap-1.5">
        <span
          className="size-2 animate-pulse rounded-full bg-zinc-900 dark:bg-zinc-50"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="size-2 animate-pulse rounded-full bg-zinc-900 dark:bg-zinc-50"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="size-2 animate-pulse rounded-full bg-zinc-900 dark:bg-zinc-50"
          style={{ animationDelay: "300ms" }}
        />
      </div>

      <div className="text-center">
        <p className="text-xs font-medium tracking-tight text-zinc-700 dark:text-zinc-300">
          {slow ? t("preview.stillPreparing") : t("preview.preparing")}
        </p>
        <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
          {slow ? t("preview.largeProject") : t("preview.bundling")}
        </p>
      </div>
    </div>
  );
};

// ─── File sync ──────────────────────────────────────────────────────────────

const SandpackFileWatcher = () => {
  const { sandpack } = useSandpack();
  const { files } = sandpack;
  const { activeProject, updateProjectFiles } = useAppContext();

  const activeProjectRef = useRef(activeProject);

  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  useEffect(() => {
    const project = activeProjectRef.current;
    if (!project) return;

    const updatedFiles = {};
    let hasChanges = false;

    for (const [path, fileObj] of Object.entries(files)) {
      if (isPreviewShellPath(path)) continue;
      const fileCode = fileObj.code;
      updatedFiles[path] = fileCode;

      const original = project.files[path];
      const originalContent =
        typeof original === "string" ? original : original?.content;

      if (originalContent !== undefined && originalContent !== fileCode) {
        hasChanges = true;
      }
    }

    if (hasChanges) updateProjectFiles(updatedFiles);
  }, [files]);

  return null;
};

const ActiveFileSync = () => {
  const { sandpack } = useSandpack();
  const { activeFile, setActiveFile } = useAppContext();

  useEffect(() => {
    if (
      activeFile &&
      sandpack.files[activeFile] &&
      sandpack.activeFile !== activeFile
    ) {
      sandpack.openFile(activeFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  useEffect(() => {
    if (sandpack.activeFile && sandpack.activeFile !== activeFile) {
      setActiveFile(sandpack.activeFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandpack.activeFile]);

  return null;
};

// ─── Main component ─────────────────────────────────────────────────────────

const PreviewPanel = ({ project, activeFile, showCode }) => {
  const { isDark } = useTheme();
  const [showErrorOverlay, setShowErrorOverlay] = useState(true);

  const projectKey = `${project._id}-${project.version}`;
  const [snapshot, setSnapshot] = useState({
    key: projectKey,
    files: project.files,
  });

  if (snapshot.key !== projectKey) {
    setSnapshot({ key: projectKey, files: project.files });
  }

  const codeMap = useMemo(() => {
    const map = {};
    for (const [path, file] of Object.entries(snapshot.files)) {
      map[path] = toCode(file);
    }
    return map;
  }, [snapshot.files]);

  const sandpackFiles = useMemo(() => {
    const spFiles = {};
    for (const [path, code] of Object.entries(codeMap)) {
      if (isPreviewShellPath(path)) continue;
      spFiles[path] = { code };
    }
    return withPreviewHtml(spFiles);
  }, [codeMap]);

  const dependencies = useMemo(() => detectDependencies(codeMap), [codeMap]);
  const customSetup = useMemo(() => ({ dependencies }), [dependencies]);

  const options = useMemo(
    () => ({
      activeFile,
      externalResources: PREVIEW_EXTERNAL_RESOURCES,
      classes: {
        "sp-wrapper": "sp-wrapper",
        "sp-layout": "sp-layout",
        "sp-preview": "sp-preview",
      },
      logLevel: 0,
    }),
    [activeFile],
  );

  const sandpackTheme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <div className="w-full h-full">
      <SandpackProvider
        key={project._id}
        template="react"
        files={sandpackFiles}
        customSetup={customSetup}
        options={options}
        theme={sandpackTheme}>
        <SandpackFileWatcher />
        <ActiveFileSync />
        <SandpackErrorMonitor onErrorChange={setShowErrorOverlay} />

        {/* --- PERUBAHAN ADA DI SINI BRE --- */}
        {/* Kita buang SandpackLayout, ganti pakai div flex murni */}
        <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
          {showCode && (
            <div className="w-full h-1/2 md:h-full md:w-1/2 shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          )}

          <div
            className={`relative flex-1 w-full ${
              showCode ? "h-1/2 md:h-full" : "h-full"
            }`}>
            <SandpackPreview
              showNavigator={false}
              showRefreshButton
              showOpenInCodeSandbox={false}
              showSandpackErrorOverlay={showErrorOverlay}
              style={{ height: "100%", width: "100%" }}
            />
            <PreviewLoadingOverlay />
          </div>
        </div>
        {/* -------------------------------- */}
      </SandpackProvider>
    </div>
  );
};

export default PreviewPanel;
