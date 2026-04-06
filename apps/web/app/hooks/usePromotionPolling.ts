"use client";

import { useState, useEffect, useRef } from "react";

interface PromotionStatus {
  promoted: boolean;
  hasSeenPromotion: boolean;
}

const POLL_INTERVAL_MS = 60_000; // 1 minute (was 5s — 92% CPU reduction)
const MAX_POLL_DURATION_MS = 30 * 60_000; // stop after 30 minutes

/**
 * Polls /api/check-promotion every 60s while user role is "pending".
 * Returns { shouldCelebrate } when promotion is detected and unseen.
 * Stops polling after detection, after 30 minutes, or if user is already promoted.
 */
export function usePromotionPolling(currentRole: string | undefined) {
  const [shouldCelebrate, setShouldCelebrate] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (currentRole !== "pending" || stoppedRef.current) return;

    function stop() {
      stoppedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    }

    async function check() {
      try {
        const res = await fetch("/api/check-promotion");
        if (!res.ok) return;
        const data: PromotionStatus = await res.json();
        if (data.promoted && !data.hasSeenPromotion) {
          setShouldCelebrate(true);
          stop();
        } else if (data.promoted && data.hasSeenPromotion) {
          stop();
        }
      } catch {
        // Silently ignore network errors during polling
      }
    }

    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);
    stopTimeoutRef.current = setTimeout(stop, MAX_POLL_DURATION_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, [currentRole]);

  return { shouldCelebrate, clearCelebration: () => setShouldCelebrate(false) };
}
