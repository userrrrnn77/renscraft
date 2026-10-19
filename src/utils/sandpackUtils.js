// The generator is told to use plain React only, but a prompt can ask for a
// library. Only these well-known packages are ever added as dependencies. An
// import of anything else (a name the model made up, or a typo-squat of a real
// package) is NOT installed: the preview shows "could not find module" and the
// exported package.json stays clean. Add a package here to allow it.
export const ALLOWED_PACKAGES = new Set([
    "lucide-react",
    "react-icons",
    "@heroicons/react",
    "@headlessui/react",
    "framer-motion",
    "motion",
    "react-router-dom",
    "recharts",
    "chart.js",
    "react-chartjs-2",
    "swiper",
    "clsx",
    "classnames",
    "date-fns",
    "dayjs",
    "axios",
    "uuid",
    "zustand",
    "lodash",
    "react-hot-toast",
    "react-countup",
    "react-intersection-observer",
]);

// Scans source files to detect npm dependencies from import statements
export function detectDependencies(files) {
    const deps = {};
    if (!files) return deps;

    const allCode = Object.values(files).join("\n");
    const filePaths = Object.keys(files);

    const isLocalFileOrFolder = (pkgName) => {
        const name = pkgName.startsWith("@/") ? pkgName.substring(2) : pkgName;
        return (
            pkgName.startsWith("@/") ||
            pkgName === "@" ||
            filePaths.some(p => 
                p === `/${name}` || 
                p.startsWith(`/${name}/`) || 
                p.replace(/\.[^/.]+$/, "") === `/${name}`
            )
        );
    };

    const importRegex = /from\s+['"]([^./][^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(allCode)) !== null) {
        const rawImport = match[1];

        // Scoped packages like @scope/package, normal packages like package
        const pkg = rawImport.startsWith("@") && !rawImport.startsWith("@/")
            ? rawImport.split("/").slice(0, 2).join("/")
            : rawImport.split("/")[0];

        // Skip react (included in template), react-dom, and local modules
        if (pkg !== "react" && pkg !== "react-dom" && !isLocalFileOrFolder(pkg)) {
            if (ALLOWED_PACKAGES.has(pkg)) {
                deps[pkg] = "latest";
            } else {
                console.warn(`[deps] "${pkg}" is not in the allowed package list, not installed`);
            }
        }
    }
    return deps;
}

// ---------------------------------------------------------------------------
// Tailwind Play CDN defaults to darkMode:'media' (follows the OS), so `dark:`
// classes never react to the `.dark` class a theme toggle puts on <html>.
// Sandpack injects scripts from index.html dynamically, so an inline
// `tailwind.config = ...` can run BEFORE the CDN script has loaded (then it
// throws and is silently lost). Therefore the config is set in two places:
//   1. index.html: onload handler of the CDN <script>
//   2. entry /index.js: waits until `window.tailwind` exists, sets the config,
//      and only then renders the app (guaranteed to run, no race).
// Both files are injected at render time and never saved to the project.
// ---------------------------------------------------------------------------
export const PREVIEW_INDEX_PATH = "/public/index.html";
export const PREVIEW_ENTRY_PATH = "/index.js";

export const PREVIEW_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script
      src="https://cdn.tailwindcss.com"
      onload="try{tailwind.config={darkMode:'class'}}catch(e){}"
    ></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

export const PREVIEW_ENTRY_JS = `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

function addScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { resolve(); };
    s.onerror = function () { reject(new Error("gagal load " + src)); };
    document.head.appendChild(s);
  });
}

function setDarkClass() {
  try {
    window.tailwind.config = Object.assign({}, window.tailwind.config, { darkMode: "class" });
  } catch (e) {}
}

// Jaring pengaman: kalau Tailwind dari index.html ga muncul, coba lagi lewat script
// yang dibuat dari sini (file ini PASTI jalan), lalu Tailwind v4 browser build
// sebagai cadangan terakhir. Kegagalan kelihatan di console, ga diam-diam lagi.
async function tailwindFallback() {
  try {
    await addScript("https://cdn.tailwindcss.com");
    if (window.tailwind) { setDarkClass(); return; }
  } catch (e) { console.warn("[preview] " + e.message); }
  try {
    var st = document.createElement("style");
    st.setAttribute("type", "text/tailwindcss");
    st.textContent = "@custom-variant dark (&:where(.dark, .dark *));";
    document.head.appendChild(st);
    await addScript("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4");
    console.warn("[preview] Tailwind v3 CDN gagal, pakai Tailwind v4 (cadangan)");
  } catch (e) { console.warn("[preview] semua Tailwind CDN gagal: " + e.message); }
}

// Tunggu Tailwind max ~3 detik. Habis itu app tetap dirender; Tailwind CDN
// nge-style elemen belakangan lewat MutationObserver begitu ketemu.
function whenTailwindReady(done) {
  var tries = 0;
  var tick = function () {
    if (window.tailwind) { setDarkClass(); done(); }
    else if (tries++ > 120) { done(); tailwindFallback(); }
    else setTimeout(tick, 25);
  };
  tick();
}

whenTailwindReady(function () {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
`;

export const isPreviewShellPath = (path) =>
  path === PREVIEW_INDEX_PATH || path === PREVIEW_ENTRY_PATH;

// Only Font Awesome stays as an external resource; Tailwind is in index.html
export const PREVIEW_EXTERNAL_RESOURCES = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
];

// Adds the controlled index.html + entry (hidden from the editor) to Sandpack files
export function withPreviewHtml(spFiles) {
  return {
    ...spFiles,
    [PREVIEW_INDEX_PATH]: { code: PREVIEW_INDEX_HTML, hidden: true },
    [PREVIEW_ENTRY_PATH]: { code: PREVIEW_ENTRY_JS, hidden: true },
  };
}