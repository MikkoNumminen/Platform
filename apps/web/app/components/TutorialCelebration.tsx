"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorialMaybe } from "./TutorialProvider";
import { colors as themeColors } from "../styles";

export default function TutorialCelebration() {
  const ctx = useTutorialMaybe();
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fire confetti on tier completion
  useEffect(() => {
    if (!ctx?.celebratingTier) return;

    let cancelled = false;

    async function fireConfetti() {
      try {
        const confetti = (await import("canvas-confetti")).default;
        if (cancelled) return;

        // Multiple bursts for tier celebration
        const count = 3;
        for (let i = 0; i < count; i++) {
          confettiTimeoutRef.current = setTimeout(() => {
            if (cancelled) return;
            confetti({
              particleCount: 60,
              spread: 70,
              origin: { y: 0.6, x: 0.3 + Math.random() * 0.4 },
              colors: ["#4ade80", "#22d3ee", "#ffffff", "#fbbf24"],
            });
          }, i * 300);
        }
      } catch {
        // canvas-confetti not available, skip
      }
    }

    fireConfetti();

    return () => {
      cancelled = true;
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, [ctx?.celebratingTier]);

  // Auto-dismiss step celebration after 3s
  useEffect(() => {
    if (!ctx?.celebratingStep || ctx?.celebratingTier) return;

    const timer = setTimeout(() => {
      ctx?.dismissCelebration();
    }, 3000);

    return () => clearTimeout(timer);
  }, [ctx?.celebratingStep, ctx?.celebratingTier, ctx]);

  if (!ctx?.isActive) return null;

  // Step completion toast (small)
  if (ctx.celebratingStep && !ctx.celebratingTier) {
    return (
      <AnimatePresence>
        <motion.div
          key="step-celebration"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99997,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              backgroundColor: themeColors.backdrop,
              border: `1px solid ${themeColors.accentBorder}`,
              boxShadow: `0 0 24px ${themeColors.accentBorder}`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: themeColors.green400,
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              Nice work! +10 XP
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Tier completion celebration (big)
  if (ctx.celebratingTier) {
    return (
      <AnimatePresence>
        <motion.div
          key="tier-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99997,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: themeColors.backdrop,
            cursor: "pointer",
          }}
          onClick={() => ctx.dismissCelebration()}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            style={{ textAlign: "center" }}
          >
            <motion.div
              animate={{
                textShadow: [
                  `0 0 20px ${themeColors.green400}, 0 0 40px ${themeColors.green400}`,
                  `0 0 30px ${themeColors.cyan400}, 0 0 60px ${themeColors.cyan400}`,
                  `0 0 20px ${themeColors.green400}, 0 0 40px ${themeColors.green400}`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: 64, marginBottom: 8 }}
            >
              🏆
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                color: themeColors.green400,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Tier Complete!
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{
                color: themeColors.slate100,
                fontSize: 36,
                fontWeight: 700,
                margin: "8px 0 4px",
                textShadow: `0 0 20px ${themeColors.accentGlow}`,
              }}
            >
              {ctx.celebratingTier.name}
            </motion.p>
            {ctx.celebratingTier.bonus > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                style={{
                  color: themeColors.green400,
                  fontSize: 20,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                +{ctx.celebratingTier.bonus} XP Bonus!
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 2 }}
              style={{ color: themeColors.slate500, fontSize: 12, marginTop: 24 }}
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
