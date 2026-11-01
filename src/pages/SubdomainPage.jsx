// src/pages/SubdomainPage.jsx

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircleIcon, ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import api from "../api/api";
import FullPagePreview from "../components/FullPagePreview";
import Loading from "../components/Loading";
import { SUBDOMAIN_ROOT, getSubdomainFromHostname } from "../utils/subdomain";

const SubdomainPage = () => {
  const { t } = useTranslation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  // null | "unavailable" (404: tidak ada / belum publish / expired) | "failed" (jaringan / 5xx)
  const [errorKind, setErrorKind] = useState(null);

  const load = useCallback(async () => {
    const slug = getSubdomainFromHostname();
    if (!slug) {
      setErrorKind("unavailable");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorKind(null);
    try {
      const { data } = await api.get(
        `/api/projects/public/subdomain/${encodeURIComponent(slug)}`,
      );
      setProject(data);
    } catch (err) {
      setErrorKind(err?.response?.status === 404 ? "unavailable" : "failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;

  if (errorKind) {
    const failed = errorKind === "failed";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircleIcon size={28} />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {failed
            ? t("subdomainPage.loadFailedTitle")
            : t("subdomainPage.unavailableTitle")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
          {failed
            ? t("subdomainPage.loadFailedBody")
            : t("subdomainPage.unavailableBody")}
        </p>
        <div className="flex items-center gap-2">
          {failed && (
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 border border-zinc-200 px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer">
              <RefreshCwIcon size={14} /> {t("common.tryAgain")}
            </button>
          )}
          {/* <a>, bukan <Link>: "/" di subdomain ini merender halaman ini lagi. */}
          <a
            href={`https://${SUBDOMAIN_ROOT}`}
            className="inline-flex items-center gap-2 bg-zinc-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950">
            <ArrowLeftIcon size={14} /> {t("subdomainPage.backHome")}
          </a>
        </div>
      </div>
    );
  }

  return <FullPagePreview files={project.files} />;
};

export default SubdomainPage;
