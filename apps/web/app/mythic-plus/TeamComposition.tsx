"use client";

import { useState, useTransition } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ShieldIcon from "@mui/icons-material/Shield";
import HealingIcon from "@mui/icons-material/Healing";
import BoltIcon from "@mui/icons-material/Bolt";
import { colors } from "../styles";
import { createTeam, updateTeamSlot, deleteTeam } from "@/lib/mythicplus-actions";
import type { WowCharacterData } from "@/lib/mythicplus-queries";
import type { MythicPlusTeamData, TeamSlotData } from "@/lib/mythicplus-queries";

interface TeamCompositionProps {
  teams: MythicPlusTeamData[];
  characters: WowCharacterData[];
}

const SLOTS = [
  { key: "tankId", label: "Tank", icon: <ShieldIcon sx={{ fontSize: 16 }} />, role: "Tank" },
  { key: "healerId", label: "Healer", icon: <HealingIcon sx={{ fontSize: 16 }} />, role: "Healer" },
  { key: "dps1Id", label: "DPS", icon: <BoltIcon sx={{ fontSize: 16 }} />, role: "DPS" },
  { key: "dps2Id", label: "DPS", icon: <BoltIcon sx={{ fontSize: 16 }} />, role: "DPS" },
  { key: "dps3Id", label: "DPS", icon: <BoltIcon sx={{ fontSize: 16 }} />, role: "DPS" },
] as const;

function getRatingColor(rating: number): string {
  if (rating >= 3000) return "#ff8000";
  if (rating >= 2500) return "#a335ee";
  if (rating >= 2000) return "#0070dd";
  if (rating >= 1500) return "#1eff00";
  if (rating >= 750) return "#ffffff";
  return colors.slate400;
}

function SlotCard({
  slot,
  character,
  characters,
  teamId,
}: {
  slot: (typeof SLOTS)[number];
  character: TeamSlotData | null;
  characters: WowCharacterData[];
  teamId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (characterId: string) => {
    startTransition(async () => {
      await updateTeamSlot(teamId, slot.key, characterId || null);
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1,
        borderRadius: 1,
        backgroundColor: colors.surfaceOverlay,
        border: `1px solid ${character ? colors.decorBorder : colors.slate300}`,
        opacity: isPending ? 0.5 : 1,
        minWidth: 0,
      }}
    >
      {/* Role icon */}
      <Tooltip title={slot.label}>
        <Box sx={{ color: colors.slate400, display: "flex" }}>{slot.icon}</Box>
      </Tooltip>

      {character ? (
        <>
          <Avatar
            src={character.thumbnailUrl ?? undefined}
            sx={{
              width: 32,
              height: 32,
              border: `2px solid ${getRatingColor(character.mythicPlusRating ?? 0)}`,
            }}
          >
            {character.characterName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }} noWrap>
              {character.characterName}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.slate400, fontSize: "0.7rem" }}>
              {character.spec} {character.className}
            </Typography>
          </Box>
          <Chip
            label={`${Math.round(character.itemLevel ?? 0)}`}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              backgroundColor: colors.surfaceOverlay,
              color: colors.slate100,
              border: `1px solid ${colors.slate300}`,
            }}
          />
          <Chip
            label={`${Math.round(character.mythicPlusRating ?? 0)}`}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              backgroundColor: "transparent",
              color: getRatingColor(character.mythicPlusRating ?? 0),
              border: `1px solid ${getRatingColor(character.mythicPlusRating ?? 0)}`,
            }}
          />
          <IconButton
            size="small"
            onClick={() =>
              startTransition(async () => {
                await updateTeamSlot(teamId, slot.key, null);
              })
            }
            aria-label={`Remove ${slot.label} slot`}
            sx={{ color: colors.slate400, p: 0.25 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </>
      ) : (
        <TextField
          select
          size="small"
          value=""
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Select ${slot.label}`}
          sx={{
            flex: 1,
            "& .MuiInputBase-root": { fontSize: "0.8rem" },
            "& .MuiSelect-select": { py: 0.5 },
          }}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="" disabled>
            <em>Select {slot.label}</em>
          </MenuItem>
          {characters.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.characterName} — {c.spec} {c.className} ({c.specRole})
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
  );
}

export default function TeamComposition({ teams, characters }: TeamCompositionProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTeam(teamName);
      if (result?.error) {
        setError(result.error);
      } else {
        setTeamName("");
        setShowCreate(false);
      }
    });
  };

  const handleDelete = (teamId: string) => {
    startTransition(async () => {
      await deleteTeam(teamId);
    });
  };

  const getTeamStats = (team: MythicPlusTeamData) => {
    const slots = [team.tank, team.healer, team.dps1, team.dps2, team.dps3].filter(
      Boolean,
    ) as TeamSlotData[];
    if (slots.length === 0) return { avgIlvl: 0, avgRating: 0, filled: 0 };
    const avgIlvl = slots.reduce((sum, s) => sum + (s.itemLevel ?? 0), 0) / slots.length;
    const avgRating = slots.reduce((sum, s) => sum + (s.mythicPlusRating ?? 0), 0) / slots.length;
    return { avgIlvl: Math.round(avgIlvl), avgRating: Math.round(avgRating), filled: slots.length };
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.slate100 }}>
          Teams
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowCreate(true)}
        >
          Create Team
        </Button>
      </Box>

      {teams.length === 0 && (
        <Typography variant="body2" sx={{ color: colors.slate400, textAlign: "center", py: 4 }}>
          No teams created yet. Create a team to build your Mythic+ composition.
        </Typography>
      )}

      {teams.map((team) => {
        const stats = getTeamStats(team);
        const slotMap: Record<string, TeamSlotData | null> = {
          tankId: team.tank,
          healerId: team.healer,
          dps1Id: team.dps1,
          dps2Id: team.dps2,
          dps3Id: team.dps3,
        };

        return (
          <Paper
            key={team.id}
            sx={{
              p: 2,
              mb: 2,
              border: `1px solid ${colors.decorBorder}`,
              backgroundColor: colors.slate700,
            }}
          >
            {/* Team header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {team.name}
                </Typography>
                <Chip
                  label={`${stats.filled}/5`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    backgroundColor: colors.surfaceOverlay,
                    color: colors.slate400,
                  }}
                />
                {stats.filled > 0 && (
                  <>
                    <Chip
                      label={`Avg ${stats.avgIlvl} iLvl`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        backgroundColor: colors.surfaceOverlay,
                        color: colors.slate100,
                      }}
                    />
                    <Chip
                      label={`Avg ${stats.avgRating} M+`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        backgroundColor: "transparent",
                        color: getRatingColor(stats.avgRating),
                        border: `1px solid ${getRatingColor(stats.avgRating)}`,
                      }}
                    />
                  </>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={() => handleDelete(team.id)}
                disabled={isPending}
                aria-label="Delete team"
                sx={{ color: colors.slate400 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Slots */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {SLOTS.map((slot) => (
                <SlotCard
                  key={slot.key}
                  slot={slot}
                  character={slotMap[slot.key]}
                  characters={characters}
                  teamId={team.id}
                />
              ))}
            </Box>
          </Paper>
        );
      })}

      {/* Create Team Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Team</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleCreate}
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <TextField
              label="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              size="small"
              autoFocus
              inputProps={{ maxLength: 50 }}
              placeholder="e.g. Push Team, Weekly Keys"
            />
            {error && (
              <Typography variant="caption" sx={{ color: colors.error }}>
                {error}
              </Typography>
            )}
            <Button type="submit" variant="contained" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
