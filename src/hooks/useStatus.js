// src/hooks/useStatus.js
import { useCallback, useEffect, useState } from "react";
import { fetchStatus } from "../api/status";

export default function useStatus() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  const refetch = useCallback(() => setRefresh((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    const load = async () => {
      try {
        const result = await fetchStatus(controller.signal);
        if (!alive) return;
        setData(result);
        setError(null);
      } catch (e) {
        if (!alive || e?.name === "AbortError") return;
        setError(e?.message || "STATUS_ERROR");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60000);

    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  return { data, error, loading, refetch };
}
