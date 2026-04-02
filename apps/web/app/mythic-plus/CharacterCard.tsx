"use client";

import { useState, useTransition } from "react";
import { Avatar, Box, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { colors } from "../styles";
import { refreshCharacter, removeCharacter } from "@/lib/mythicplus-actions";
import type { WowCharacterData } from "@/lib/mythicplus-queries";

function getRatingColor(rating: number): string {
  if (rating >= 3000) return "#ff8000"; // legendary orange
  if (rating >= 2500) return "#a335ee"; // epic purple
  if (rating >= 2000) return "#0070dd"; // rare blue
  if (rating >= 1500) return "#1eff00"; // uncommon green
  if (rating >= 750) return "#ffffff"; // common white
  return colors.slate400; // poor gray
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CharacterCardProps {
  character: WowCharacterData;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setError(null);
    startTransition(async () => {
      const result = await refreshCharacter(character.id);
      if (result?.error) setError(result.error);
    });
  };

  const handleRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeCharacter(character.id);
      if (result?.error) setError(result.error);
    });
  };

  const ratingColor = getRatingColor(character.mythicPlusRating ?? 0);

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        border: `1px solid ${colors.decorBorder}`,
        backgroundColor: colors.slate700,
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Thumbnail */}
      <Avatar
        src={character.thumbnailUrl ?? undefined}
        alt={character.characterName}
        sx={{ width: 48, height: 48, border: `2px solid ${ratingColor}` }}
      >
        {character.characterName[0]?.toUpperCase()}
      </Avatar>

      {/* Name + Class/Spec */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: colors.slate100 }}>
            {character.characterName}
          </Typography>
          <Typography variant="caption" sx={{ color: colors.slate400 }}>
            {character.realm}-{character.region.toUpperCase()}
          </Typography>
          {character.profileUrl && (
            <Tooltip title="Open on Raider.IO">
              <IconButton
                size="small"
                component="a"
                href={character.profileUrl}
                target="_blank"
                rel="noopener"
                sx={{ color: colors.slate400, p: 0.25 }}
              >
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: colors.slate400 }}>
          {character.race} {character.className} — {character.spec} ({character.specRole})
        </Typography>
        {error && (
          <Typography variant="caption" sx={{ color: colors.error, display: "block" }}>
            {error}
          </Typography>
        )}
      </Box>

      {/* Item Level */}
      <Tooltip title="Item Level">
        <Chip
          label={`${Math.round(character.itemLevel ?? 0)} iLvl`}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: "0.75rem",
            backgroundColor: colors.surfaceOverlay,
            color: colors.slate100,
            border: `1px solid ${colors.slate300}`,
          }}
        />
      </Tooltip>

      {/* M+ Rating */}
      <Tooltip title="Mythic+ Rating">
        <Chip
          label={`${Math.round(character.mythicPlusRating ?? 0)} M+`}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: "0.75rem",
            backgroundColor: "transparent",
            color: ratingColor,
            border: `1px solid ${ratingColor}`,
          }}
        />
      </Tooltip>

      {/* Last Updated */}
      <Typography variant="caption" sx={{ color: colors.slate400, whiteSpace: "nowrap" }}>
        {character.lastFetchedAt ? formatTimeAgo(character.lastFetchedAt) : "—"}
      </Typography>

      {/* Actions */}
      <Tooltip title="Refresh stats">
        <IconButton
          size="small"
          onClick={handleRefresh}
          disabled={isPending}
          sx={{ color: colors.slate400 }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove character">
        <IconButton
          size="small"
          onClick={handleRemove}
          disabled={isPending}
          sx={{ color: colors.slate400 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}
