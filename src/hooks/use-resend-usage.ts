"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getResendUsage } from "@/actions/resend-usage";
import type { ResendUsage } from "@/types";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useResendUsage() {
  const [usage, setUsage] = useState<ResendUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const load = useCallback(async (force: boolean) => {
    const requestId = ++requestIdRef.current;

    try {
      const result = await getResendUsage(force);
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setUsage(result.usage);
      setError(result.error);
      setFetchedAt(result.fetchedAt);
    } catch {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError("Could not load Resend usage.");
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const initialId = window.setTimeout(() => void load(false), 0);

    const intervalId = window.setInterval(() => void load(false), POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load(false);
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load(true);
  }, [load]);

  return { usage, error, fetchedAt, loading, refreshing, refresh };
}
