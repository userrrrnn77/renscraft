import { useEffect, useMemo, useRef, useState } from "react";
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
//
// Dipakai DisplayProjects: iframe di dalam landing page butuh tau kapan
// Sandpack di dalam iframe beneran selesai bundling. Parent gak bisa liat
// status Sandpack di dalam iframe, jadi kita kirim postMessage.
//
//   - Setelah sandpack.status === "idle", tunggu 300ms (biar iframe sempat
//     paint frame pertamanya), baru kirim.
//   - Kalau parent === window (dibuka standalone di /preview/:id atau
//     /publish/:name), postMessage cuma no-op. Aman.
//   - Kirim sekali per mount, biar gak spam.

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

// ─── Preview ────────────────────────────────────────────────────────────────

const FullPagePreview = ({ files }) => {
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
    </div>
  );
};

export default FullPagePreview;
