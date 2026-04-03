"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Snackbar, Box, Typography } from "@mui/material";
import { colors } from "../styles";
import { getLatestXpGains } from "@/lib/gamification/xp-actions";
import { getLevelForXp } from "@/lib/gamification/xp-config";
import dynamic from "next/dynamic";
const LevelUpCelebration = dynamic(() => import("./LevelUpCelebration"), { ssr: false });

const XP_SOURCE_LABELS: Record<string, string> = {
  "shout:create": "Shout",
  "issue:create": "Bug Report",
  "survey:complete": "Survey Complete",
  "alias:set": "Alias Set",
  "daily:login": "Daily Login",
  "streak:7day": "7-Day Streak",
  "streak:30day": "30-Day Streak",
  "quest:complete": "Quest Complete",
  "achievement:unlock": "Achievement Unlocked",
};

interface XpToast {
  id: number;
  amount: number;
  label: string;
}

interface LevelUpData {
  level: number;
  title: string;
}

interface XpToastContextValue {
  onAction: () => void;
}

const XpToastContext = createContext<XpToastContextValue>({ onAction: () => {} });

export function useXpToast() {
  return useContext(XpToastContext);
}

let toastId = 0;

export default function XpToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<XpToast[]>([]);
  const [levelUp, setLevelUp] = useState<LevelUpData | null>(null);
  const lastCheckRef = useRef<Date>(new Date());
  const lastLevelRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  const onAction = useCallback(async () => {
    // Debounce — don't check if already checking
    if (pendingRef.current) return;
    pendingRef.current = true;

    const since = lastCheckRef.current;
    lastCheckRef.current = new Date();

    try {
      const result = await getLatestXpGains(since);

      if (result.gains.length > 0) {
        const newToasts = result.gains.map((g) => ({
          id: toastId++,
          amount: g.amount,
          label: XP_SOURCE_LABELS[g.source] ?? g.source,
        }));
        setToasts((prev) => [...prev, ...newToasts]);

        // Check for level up
        if (lastLevelRef.current !== null && result.level > lastLevelRef.current) {
          const levelInfo = getLevelForXp(result.totalXp);
          setLevelUp({ level: levelInfo.level, title: levelInfo.title });
        }
      }

      lastLevelRef.current = result.level;
    } catch {
      // Silently fail — XP toasts are non-critical
    } finally {
      pendingRef.current = false;
    }
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <XpToastContext.Provider value={{ onAction }}>
      {children}

      {/* XP Toasts */}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={3000}
          onClose={() => dismissToast(toast.id)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ top: `${index * 56 + 72}px !important` }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              backgroundColor: colors.backdrop,
              border: `1px solid ${colors.accentBorder}`,
              boxShadow: `0 0 16px ${colors.accentGlow}`,
            }}
          >
            <Typography sx={{ color: colors.green400, fontWeight: 700, fontSize: "0.95rem" }}>
              +{toast.amount} XP
            </Typography>
            <Typography sx={{ color: colors.slate400, fontSize: "0.8rem" }}>
              {toast.label}
            </Typography>
          </Box>
        </Snackbar>
      ))}

      {/* Level Up Celebration */}
      {levelUp && (
        <LevelUpCelebration
          level={levelUp.level}
          title={levelUp.title}
          onComplete={() => setLevelUp(null)}
        />
      )}
    </XpToastContext.Provider>
  );
}
