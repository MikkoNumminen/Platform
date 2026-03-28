"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors } from "../styles";

interface LevelUpCelebrationProps {
  level: number;
  title: string;
  onComplete?: () => void;
}

const PARTICLES = ["⭐", "✨", "🎉", "💫", "🏆", "⬆️"];

export default function LevelUpCelebration({ level, title, onComplete }: LevelUpCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="levelup-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.backdrop,
          pointerEvents: "all",
        }}
        onClick={() => {
          setVisible(false);
          onComplete?.();
        }}
      >
        {/* Particle effects */}
        {PARTICLES.map((emoji, i) => (
          <motion.div
            key={`particle-${i}`}
            style={{
              position: "absolute",
              fontSize: `${20 + Math.random() * 24}px`,
              left: `${10 + Math.random() * 80}%`,
              top: "60%",
              pointerEvents: "none",
            }}
            animate={{
              top: [`60%`, `${10 + Math.random() * 30}%`],
              left: [`${10 + Math.random() * 80}%`, `${Math.random() * 100}%`],
              opacity: [0, 1, 1, 0],
              rotate: [0, Math.random() * 360 - 180],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              ease: "easeOut",
            }}
          >
            {emoji}
          </motion.div>
        ))}

        {/* Main content */}
        <motion.div
          style={{ textAlign: "center", zIndex: 10 }}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <motion.div
            animate={{
              textShadow: [
                `0 0 20px ${colors.green400}, 0 0 40px ${colors.green400}`,
                `0 0 30px ${colors.cyan400}, 0 0 60px ${colors.cyan400}`,
                `0 0 20px ${colors.green400}, 0 0 40px ${colors.green400}`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: "72px", marginBottom: "8px" }}
          >
            ⬆️
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              color: colors.green400,
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Level Up!
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              color: colors.slate100,
              fontSize: "48px",
              fontWeight: 700,
              margin: "8px 0 4px",
              textShadow: `0 0 20px ${colors.accentGlow}`,
            }}
          >
            Level {level}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            style={{
              color: colors.slate400,
              fontSize: "20px",
              fontWeight: 300,
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            {title}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2 }}
            style={{
              color: colors.slate500,
              fontSize: "12px",
              marginTop: "24px",
            }}
          >
            Click anywhere to continue
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
