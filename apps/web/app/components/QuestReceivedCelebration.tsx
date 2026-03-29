"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Chip, Typography } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { colors } from "../styles";

const LOCALSTORAGE_KEY = "platform_seen_quests";

interface QuestInfo {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  priority: string;
  creator: string;
}

interface QuestReceivedCelebrationProps {
  quests: QuestInfo[];
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: colors.slate400,
  normal: colors.info,
  high: colors.warning,
  urgent: colors.error,
};

const PARTICLES = ["📜", "⚔️", "🛡️", "🏹", "🗡️", "📋"];

function getSeenQuestIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function markQuestsSeen(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const current = getSeenQuestIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify([...current]));
  } catch {
    /* empty */
  }
}

export default function QuestReceivedCelebration({ quests }: QuestReceivedCelebrationProps) {
  const [newQuest, setNewQuest] = useState<QuestInfo | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (quests.length === 0) return;

    const seen = getSeenQuestIds();
    const unseen = quests.filter((q) => !seen.has(q.id));

    if (unseen.length > 0) {
      setNewQuest(unseen[0]);
      setVisible(true);
      markQuestsSeen(unseen.map((q) => q.id));
    }
  }, [quests]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || !newQuest) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="quest-received-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.backdrop,
          pointerEvents: "all",
          cursor: "pointer",
        }}
        onClick={() => setVisible(false)}
      >
        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              x: (Math.random() - 0.5) * 300,
              y: 100,
              scale: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [100, -50, -120, -200],
              scale: [0, 1.2, 1, 0.5],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 3,
              delay: 0.3 + i * 0.15,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              fontSize: "2rem",
              pointerEvents: "none",
            }}
          >
            {p}
          </motion.div>
        ))}

        {/* Main card */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
          style={{ pointerEvents: "none" }}
        >
          <Box
            sx={{
              textAlign: "center",
              maxWidth: 400,
              p: 4,
              borderRadius: 3,
              border: `2px solid ${colors.accentBorder}`,
              backgroundColor: colors.slate600,
              boxShadow: `0 0 40px ${colors.accentGlow}, 0 0 80px ${colors.accentGlow}`,
            }}
          >
            {/* Icon */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <AssignmentIcon sx={{ fontSize: 56, color: colors.green400, mb: 1 }} />
            </motion.div>

            {/* Title */}
            <Typography
              variant="overline"
              sx={{
                color: colors.green400,
                fontWeight: 700,
                letterSpacing: "0.15em",
                fontSize: "0.75rem",
                display: "block",
                mb: 0.5,
              }}
            >
              New Quest Received
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: colors.slate100,
                fontWeight: 700,
                mb: 1,
              }}
            >
              {newQuest.title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: colors.slate400,
                mb: 2,
                maxHeight: 60,
                overflow: "hidden",
              }}
            >
              {newQuest.description}
            </Typography>

            {/* Chips */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={PRIORITY_LABELS[newQuest.priority] ?? newQuest.priority}
                size="small"
                sx={{
                  backgroundColor: "transparent",
                  color: PRIORITY_COLORS[newQuest.priority] ?? colors.slate400,
                  border: `1px solid ${PRIORITY_COLORS[newQuest.priority] ?? colors.slate400}`,
                  fontWeight: 600,
                }}
              />
              {newQuest.xpReward > 0 && (
                <Chip
                  label={`+${newQuest.xpReward} XP`}
                  size="small"
                  sx={{
                    backgroundColor: colors.accentBgSubtle,
                    color: colors.green400,
                    fontWeight: 700,
                  }}
                />
              )}
            </Box>

            {/* From */}
            <Typography variant="caption" sx={{ color: colors.slate400, display: "block", mt: 2 }}>
              Assigned by {newQuest.creator}
            </Typography>

            <Typography
              variant="caption"
              sx={{ color: colors.slate500, display: "block", mt: 1, fontStyle: "italic" }}
            >
              Click anywhere to dismiss
            </Typography>
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
