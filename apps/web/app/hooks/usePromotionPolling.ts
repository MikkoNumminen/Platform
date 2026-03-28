"use client";

import { useState, useEffect, useRef } from "react";

interface PromotionStatus {
  promoted: boolean;
  hasSeenPromotion: boolean;
}

/**
 * Polls /api/check-promotion every 5s while user role is "pending".
 * Returns { shouldCelebrate } when promotion is detected and unseen.
 * Stops polling after detection or if user is already promoted.
 */
export function usePromotionPolling(currentRole: string | undefined) {
  const [shouldCelebrate, setShouldCelebrate] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (currentRole !== "pending" || stoppedRef.current) return;

    async function check() {
      try {
        const res = await fetch("/api/check-promotion");
        if (!res.ok) return;
        const data: PromotionStatus = await res.json();
        if (data.promoted && !data.hasSeenPromotion) {
          setShouldCelebrate(true);
          stoppedRef.current = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (data.promoted && data.hasSeenPromotion) {
          stoppedRef.current = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Silently ignore network errors during polling
      }
    }

    intervalRef.current = setInterval(check, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentRole]);

  return { shouldCelebrate, clearCelebration: () => setShouldCelebrate(false) };
}
