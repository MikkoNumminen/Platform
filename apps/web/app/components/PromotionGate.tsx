"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePromotionPolling } from "@/app/hooks/usePromotionPolling";
import PromotionCelebration from "./PromotionCelebration";

/**
 * Renders the promotion celebration overlay when:
 * - Scenario A: Polling detects pending→vuohi in real-time
 * - Scenario B: User logs in with hasSeenPromotion === false
 */
export default function PromotionGate() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const hasSeenPromotion = session?.user?.hasSeenPromotion;

  // Scenario A: real-time polling while pending
  const { shouldCelebrate, clearCelebration } = usePromotionPolling(role);

  // Scenario B: already promoted but hasn't seen celebration
  const showFromSession = hasSeenPromotion === false && role && role !== "pending";

  const [dismissed, setDismissed] = useState(false);

  const shouldShow = !dismissed && (shouldCelebrate || showFromSession);

  if (!shouldShow) return null;

  return (
    <PromotionCelebration
      onComplete={() => {
        setDismissed(true);
        clearCelebration();
      }}
    />
  );
}
