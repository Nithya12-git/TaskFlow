"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";

// Loads data from the API. Pass null to skip. Ignores stale responses
// when the path changes quickly (e.g. while typing in a search box).
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      if (!path) {
        setLoading(false);
        return;
      }
      const id = ++requestId.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const result = await api.get<T>(path);
        if (id === requestId.current) setData(result);
      } catch (err) {
        if (id === requestId.current) {
          setError(errorMessage(err, "Unable to load data. Please check your connection and try again."));
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [path]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    setData,
    error,
    loading,
    retry: () => load(),
    reload: () => load(true),
  };
}