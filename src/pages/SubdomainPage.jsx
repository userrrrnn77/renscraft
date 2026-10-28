// src/pages/SubdomainPage.jsx

import { useEffect, useState } from "react";
import api from "../api/api";
import FullPagePreview from "../components/FullPagePreview";
import Loading from "../components/Loading";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";

const SubdomainPage = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const hostname = window.location.hostname;
    const slug = hostname.replace(".renscraft.cyou", "");

    api
      .get(`/api/projects/public/subdomain/${slug}`)
      .then(({ data }) => setProject(data))
      .catch((err) => {
        const msg =
          err?.response?.data?.error ||
          "Website tidak ditemukan, belum dipublish, atau langganan subdomain sudah habis.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircleIcon size={28} />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Website Tidak Tersedia
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
          {error}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-zinc-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950">
          <ArrowLeftIcon size={14} /> Balik ke Renscraft
        </Link>
      </div>
    );
  }

  return <FullPagePreview files={project.files} />;
};

export default SubdomainPage;
