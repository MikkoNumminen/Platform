"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { colors } from "../styles";

interface Shortcut {
  keys: string[];
  label: string;
  action: () => void;
  global?: boolean;
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.75,
      }}
    >
      <Typography variant="body2" sx={{ color: colors.slate100 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {keys.map((key) => (
          <Box
            key={key}
            component="kbd"
            sx={{
              px: 1,
              py: 0.25,
              fontSize: "0.75rem",
              fontFamily: "monospace",
              fontWeight: 600,
              color: colors.slate100,
              backgroundColor: colors.slate600,
              border: `1px solid ${colors.slate300}`,
              borderRadius: "4px",
              minWidth: 24,
              textAlign: "center",
            }}
          >
            {key}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      keys: ["g", "h"],
      label: "Go to Home",
      action: () => router.push("/"),
    },
    {
      keys: ["g", "b"],
      label: "Go to Boards",
      action: () => router.push("/boards"),
    },
    {
      keys: ["g", "f"],
      label: "Go to Forums",
      action: () => router.push("/forums"),
    },
    {
      keys: ["g", "c"],
      label: "Go to Calendar",
      action: () => router.push("/calendar"),
    },
    {
      keys: ["?"],
      label: "Show keyboard shortcuts",
      action: () => setHelpOpen(true),
    },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      if (key === "escape") {
        setHelpOpen(false);
        return;
      }

      // "g" prefix shortcuts — listen for next key
      if (key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const handler = (e2: KeyboardEvent) => {
          const target2 = e2.target as HTMLElement;
          if (
            target2.tagName === "INPUT" ||
            target2.tagName === "TEXTAREA" ||
            target2.isContentEditable
          ) {
            return;
          }

          const nextKey = e2.key.toLowerCase();
          const shortcut = shortcuts.find(
            (s) => s.keys.length === 2 && s.keys[0] === "g" && s.keys[1] === nextKey,
          );
          if (shortcut) {
            e2.preventDefault();
            shortcut.action();
          }
          document.removeEventListener("keydown", handler);
        };

        document.addEventListener("keydown", handler, { once: true });

        // Cancel if no key pressed within 1 second
        setTimeout(() => {
          document.removeEventListener("keydown", handler);
        }, 1000);
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.slate700,
          border: `1px solid ${colors.slate300}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: colors.slate100,
        }}
      >
        Keyboard Shortcuts
        <IconButton onClick={() => setHelpOpen(false)} size="small" sx={{ color: colors.slate400 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="caption"
          sx={{ color: colors.slate400, mb: 1.5, display: "block" }}
        >
          Navigation
        </Typography>
        {shortcuts.map((s) => (
          <ShortcutRow key={s.keys.join("+")} keys={s.keys} label={s.label} />
        ))}
      </DialogContent>
    </Dialog>
  );
}
