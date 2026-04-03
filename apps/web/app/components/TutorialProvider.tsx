"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getStepsForRole,
  matchRoute,
  TIER_NAMES,
  type TutorialStep,
} from "@/lib/tutorial/tutorial-config";
import { completeTourStep, getMyTourProgress } from "@/lib/tutorial/tutorial-service";

interface TutorialContextValue {
  isActive: boolean;
  steps: TutorialStep[];
  completedSteps: Set<string>;
  currentStep: TutorialStep | null;
  completeStep: (stepId: string) => void;
  totalSteps: number;
  completedCount: number;
  allComplete: boolean;
  celebratingStep: string | null;
  celebratingTier: { tier: number; name: string; bonus: number } | null;
  dismissCelebration: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}

export function useTutorialMaybe() {
  return useContext(TutorialContext);
}

export default function TutorialProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [celebratingStep, setCelebratingStep] = useState<string | null>(null);
  const [celebratingTier, setCelebratingTier] = useState<{
    tier: number;
    name: string;
    bonus: number;
  } | null>(null);
  const completingRef = useRef<Set<string>>(new Set());

  const role = session?.user?.role ?? "pending";
  const isDemoUser = Boolean(session?.user?.demoSessionId);
  const isActive = !!session?.user && (role !== "pending" || isDemoUser);

  const steps = useMemo(() => getStepsForRole(role), [role]);

  // Load progress on mount
  useEffect(() => {
    if (!session?.user) return;
    getMyTourProgress()
      .then((result) => {
        if (result) {
          setCompletedSteps(new Set(result.completedSteps));
        }
      })
      .catch((error) => {
        console.error("[tutorial] Failed to load progress:", error);
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [session?.user]);

  const currentStep = useMemo(() => {
    if (!loaded) return null;
    return steps.find((s) => !completedSteps.has(s.id)) ?? null;
  }, [steps, completedSteps, loaded]);

  const completeStep = useCallback(
    async (stepId: string) => {
      if (completedSteps.has(stepId)) return;
      if (completingRef.current.has(stepId)) return;
      completingRef.current.add(stepId);

      try {
        const result = await completeTourStep(stepId);
        if (result.completed) {
          setCompletedSteps((prev) => new Set([...prev, stepId]));
          setCelebratingStep(stepId);

          if (result.tierCompleted) {
            setCelebratingTier({
              tier: result.tierCompleted,
              name: TIER_NAMES[result.tierCompleted] ?? "",
              bonus: result.tierBonus,
            });
          }
        }
      } catch (error) {
        console.error("[tutorial] Complete step error:", error);
      } finally {
        completingRef.current.delete(stepId);
      }
    },
    [completedSteps],
  );

  // Demo users: auto-complete set_alias since they already have an alias
  useEffect(() => {
    if (!isDemoUser || !loaded) return;
    if (!completedSteps.has("set_alias")) {
      completeStep("set_alias");
    }
  }, [isDemoUser, loaded, completedSteps, completeStep]);

  // Auto-complete steps on route match
  useEffect(() => {
    if (!loaded || !isActive) return;

    for (const step of steps) {
      if (completedSteps.has(step.id)) continue;
      if (!step.autoCompleteOnRoute) continue;
      if (matchRoute(step.route, pathname)) {
        completeStep(step.id);
        break; // One at a time
      }
    }
  }, [pathname, steps, completedSteps, loaded, isActive, completeStep]);

  // Listen for custom tutorial events
  useEffect(() => {
    if (!isActive) return;

    function handleTutorialEvent(e: Event) {
      const customEvent = e as CustomEvent<{ stepId: string }>;
      if (customEvent.detail?.stepId) {
        completeStep(customEvent.detail.stepId);
      }
    }

    window.addEventListener("tutorial:complete", handleTutorialEvent);
    return () => window.removeEventListener("tutorial:complete", handleTutorialEvent);
  }, [isActive, completeStep]);

  const dismissCelebration = useCallback(() => {
    setCelebratingStep(null);
    setCelebratingTier(null);
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      isActive,
      steps,
      completedSteps,
      currentStep,
      completeStep,
      totalSteps: steps.length,
      completedCount: steps.filter((s) => completedSteps.has(s.id)).length,
      allComplete: steps.length > 0 && steps.every((s) => completedSteps.has(s.id)),
      celebratingStep,
      celebratingTier,
      dismissCelebration,
    }),
    [
      isActive,
      steps,
      completedSteps,
      currentStep,
      completeStep,
      celebratingStep,
      celebratingTier,
      dismissCelebration,
    ],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

// Helper to emit tutorial completion events from form handlers
export function emitTutorialEvent(stepId: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tutorial:complete", { detail: { stepId } }));
  }
}
