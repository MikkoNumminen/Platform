"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { markPromotionSeen } from "@/lib/promotion-actions";

const CHAOS_TEXTS = [
  "TERVETULOA",
  "WOW",
  "VUOHI",
  "AMAZING",
  "PÄÄSY MYÖNNETTY",
  "MLG PRO",
  "360 NO SCOPE",
  "LEGENDARY",
];
const EMOJI_PARTICLES = ["🐐", "⭐", "✨", "💫", "🎉", "🔥", "🐐", "⭐", "✨", "💫", "🎉", "🔥"];
const FLASH_COLORS = ["#ff0000", "#ffd700", "#00ff00", "#ff00ff", "#00ffff", "#ff6600", "#ffff00"];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function ChaosText({ text, index }: { text: string; index: number }) {
  const style: React.CSSProperties = {
    position: "absolute",
    top: `${randomBetween(5, 85)}%`,
    left: `${randomBetween(5, 85)}%`,
    transform: `rotate(${randomBetween(-45, 45)}deg)`,
    fontSize: `${randomBetween(24, 72)}px`,
    fontFamily: index % 3 === 0 ? "'Comic Sans MS', cursive" : "Impact, sans-serif",
    color: FLASH_COLORS[index % FLASH_COLORS.length],
    textShadow: "0 0 20px currentColor, 0 0 40px currentColor",
    zIndex: 20,
    pointerEvents: "none",
    WebkitTextStroke: "2px black",
  };

  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1.2, 0],
        rotate: [0, randomBetween(-20, 20), randomBetween(-10, 10), 0],
      }}
      transition={{
        duration: 1.5,
        delay: randomBetween(0, 2.5),
        repeat: 1,
      }}
    >
      {text}
    </motion.div>
  );
}

function EmojiParticle({ emoji }: { emoji: string }) {
  const startX = randomBetween(0, 100);

  return (
    <motion.div
      style={{
        position: "absolute",
        fontSize: `${randomBetween(20, 48)}px`,
        left: `${startX}%`,
        top: "110%",
        zIndex: 15,
        pointerEvents: "none",
      }}
      animate={{
        top: ["110%", `${randomBetween(-20, 30)}%`],
        left: [`${startX}%`, `${startX + randomBetween(-30, 30)}%`],
        rotate: [0, randomBetween(-360, 360)],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: randomBetween(1.5, 3),
        delay: randomBetween(0, 3),
        ease: "easeOut",
      }}
    >
      {emoji}
    </motion.div>
  );
}

function MarqueeText() {
  return (
    <motion.div
      style={{
        position: "absolute",
        bottom: "8%",
        whiteSpace: "nowrap",
        fontSize: "18px",
        fontFamily: "'Comic Sans MS', cursive",
        color: "#ffff00",
        zIndex: 25,
        textShadow: "2px 2px 0 #000",
        pointerEvents: "none",
      }}
      animate={{ x: ["100vw", "-200vw"] }}
      transition={{ duration: 6, ease: "linear" }}
    >
      ★★★ WELCOME TO THE VUOHI ELITE ★★★ TERVETULOA VUOHILIITTOON ★★★ YOU HAVE BEEN CHOSEN ★★★
      🐐🐐🐐 ★★★
    </motion.div>
  );
}

export default function PromotionCelebration({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<"chaos" | "black" | "calm" | "done">("chaos");

  const finish = useCallback(async () => {
    setPhase("done");
    await markPromotionSeen();
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("black"), 4000),
      setTimeout(() => setPhase("calm"), 4500),
      setTimeout(() => finish(), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  if (phase === "done") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="celebration-root"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          overflow: "hidden",
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* PHASE: CHAOS */}
        {phase === "chaos" && (
          <motion.div
            style={{ position: "absolute", inset: 0 }}
            animate={{
              x: [0, -5, 5, -3, 3, 0, -5, 5, 0],
              y: [0, 3, -3, 5, -5, 0, 3, -3, 0],
            }}
            transition={{ duration: 0.15, repeat: Infinity }}
          >
            {/* Flashing background */}
            <motion.div
              style={{ position: "absolute", inset: 0, zIndex: 1 }}
              animate={{
                backgroundColor: FLASH_COLORS,
              }}
              transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
            />

            {/* Spinning goat */}
            <motion.div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                zIndex: 30,
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.img
                src="/animations/goat.gif"
                alt="GOAT"
                style={{
                  width: "280px",
                  height: "280px",
                  objectFit: "contain",
                }}
                animate={{
                  rotate: [0, 360, 720, 1080],
                  scale: [0.5, 1.5, 0.8, 1.3, 1.0, 0.5, 1.5, 0.8, 1.3, 1.0],
                  x: [0, -10, 10, -8, 8, -5, 5, 0],
                  y: [0, 8, -8, 5, -5, 8, -8, 0],
                  filter: [
                    "hue-rotate(0deg) drop-shadow(0 0 30px #ff0000)",
                    "hue-rotate(60deg) drop-shadow(0 0 40px #ffff00)",
                    "hue-rotate(120deg) drop-shadow(0 0 50px #00ff00)",
                    "hue-rotate(180deg) drop-shadow(0 0 40px #00ffff)",
                    "hue-rotate(240deg) drop-shadow(0 0 50px #ff00ff)",
                    "hue-rotate(300deg) drop-shadow(0 0 30px #ff6600)",
                    "hue-rotate(360deg) drop-shadow(0 0 40px #ff0000)",
                  ],
                }}
                transition={{
                  rotate: { duration: 4, ease: "linear" },
                  scale: { duration: 0.8, repeat: Infinity },
                  x: { duration: 0.1, repeat: Infinity },
                  y: { duration: 0.12, repeat: Infinity },
                  filter: { duration: 0.5, repeat: Infinity },
                }}
              />
            </motion.div>

            {/* Counter-spinning element */}
            <motion.div
              style={{
                position: "absolute",
                top: "15%",
                right: "15%",
                fontSize: "120px",
                zIndex: 25,
                pointerEvents: "none",
              }}
              animate={{ rotate: [0, -360, -720, -1080] }}
              transition={{ duration: 3, ease: "linear" }}
            >
              🐐
            </motion.div>

            {/* Chaos texts */}
            {CHAOS_TEXTS.map((text, i) => (
              <ChaosText key={`text-${i}`} text={text} index={i} />
            ))}

            {/* Emoji particles */}
            {EMOJI_PARTICLES.map((emoji, i) => (
              <EmojiParticle key={`emoji-${i}`} emoji={emoji} />
            ))}

            {/* Marquee */}
            <MarqueeText />
          </motion.div>
        )}

        {/* PHASE: BLACK */}
        {phase === "black" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#000",
              zIndex: 1,
            }}
          />
        )}

        {/* PHASE: CALM */}
        {phase === "calm" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              style={{
                color: "#ffffff",
                fontSize: "28px",
                fontWeight: 300,
                letterSpacing: "0.05em",
              }}
            >
              Tervetuloa Vuohiliittoon.
            </motion.p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
