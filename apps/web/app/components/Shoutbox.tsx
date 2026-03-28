"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Box, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { colors } from "../styles";
import { createShout } from "@/lib/shout-actions";
import type { ShoutData } from "@/lib/shout-queries";
import { useXpToast } from "./XpToastProvider";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface ShoutboxProps {
  initialShouts: ShoutData[];
}

export default function Shoutbox({ initialShouts }: ShoutboxProps) {
  const { data: session } = useSession();
  const { onAction } = useXpToast();
  const t = useTranslations("shoutbox");
  const [shouts, setShouts] = useState(initialShouts);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShouts(initialShouts);
  }, [initialShouts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shouts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const alias = session?.user?.alias ?? session?.user?.name ?? "Unknown";
    const optimistic: ShoutData = {
      id: `temp-${Date.now()}`,
      message: message.trim(),
      alias,
      createdAt: new Date().toISOString(),
    };

    setShouts((prev) => [...prev, optimistic]);
    setMessage("");
    setSending(true);

    const result = await createShout(message);
    if (result?.error) {
      setShouts((prev) => prev.filter((s) => s.id !== optimistic.id));
    } else {
      onAction();
    }
    setSending(false);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#000",
        border: `1px solid ${colors.slate300}`,
        borderRadius: "4px",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${colors.slate300}`,
          backgroundColor: colors.slate600,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: colors.slate400, fontFamily: "inherit", fontWeight: 600 }}
        >
          {t("title")}
        </Typography>
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          height: 300,
          overflowY: "auto",
          px: 1.5,
          py: 1,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: colors.slate400,
            borderRadius: 3,
          },
        }}
      >
        {shouts.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
          >
            {t("empty")}
          </Typography>
        ) : (
          shouts.map((shout) => (
            <Box key={shout.id} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6 }}>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: colors.slate400,
                  fontFamily: "inherit",
                  flexShrink: 0,
                  fontSize: "0.8rem",
                }}
              >
                {formatTime(shout.createdAt)}
              </Typography>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: colors.green400,
                  fontFamily: "inherit",
                  fontWeight: 700,
                  flexShrink: 0,
                  fontSize: "0.8rem",
                }}
              >
                &lt;{shout.alias}&gt;
              </Typography>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: colors.slate100,
                  fontFamily: "inherit",
                  wordBreak: "break-word",
                  fontSize: "0.8rem",
                }}
              >
                {shout.message}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      {session?.user && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderTop: `1px solid ${colors.slate300}`,
            px: 1.5,
            py: 1,
            backgroundColor: colors.slate700,
          }}
        >
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("placeholder")}
            size="small"
            fullWidth
            autoComplete="off"
            inputProps={{ maxLength: 280 }}
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.85rem",
                backgroundColor: "#000",
                color: colors.slate100,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.slate300,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
