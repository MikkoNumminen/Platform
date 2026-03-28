"use client";

import { useState } from "react";
import { Box, Chip, Select, MenuItem, Tooltip, type SelectChangeEvent } from "@mui/material";
import { setDeveloperTag } from "@/lib/user-actions";
import { DEVELOPER_TAG_LABELS } from "@/lib/developer-config";
import { colors } from "../../styles";

interface DeveloperTagSelectProps {
  userId: string;
  currentTag: string | null;
  skills: string[];
  wantsToDevelop: boolean;
  isSuperuser: boolean;
  targetRole: string;
}

const TAG_OPTIONS = [
  { value: "", label: "—" },
  ...Object.entries(DEVELOPER_TAG_LABELS)
    .filter(([value]) => value !== "master")
    .map(([value, label]) => ({ value, label })),
];

export default function DeveloperTagSelect({
  userId,
  currentTag,
  skills,
  wantsToDevelop,
  isSuperuser,
  targetRole,
}: DeveloperTagSelectProps) {
  const [tag, setTag] = useState(currentTag ?? "");
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: SelectChangeEvent) => {
    const newTag = e.target.value || null;
    setTag(e.target.value);
    setSaving(true);
    await setDeveloperTag(userId, newTag);
    setSaving(false);
  };

  const tagLabel = currentTag ? (DEVELOPER_TAG_LABELS[currentTag] ?? currentTag) : null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      {wantsToDevelop && (
        <Tooltip title={skills.length > 0 ? skills.join(", ") : "Interested but no skills listed"}>
          <Chip
            label={skills.length > 0 ? `${skills.length} skills` : "Interested"}
            size="small"
            sx={{
              backgroundColor: colors.accentBgSubtle,
              color: colors.green400,
              fontSize: "0.7rem",
              cursor: "help",
            }}
          />
        </Tooltip>
      )}
      {targetRole === "superuser" ? (
        <Chip
          label="Master"
          size="small"
          sx={{
            backgroundColor: colors.accentBgSubtle,
            color: colors.green400,
            fontWeight: 600,
            fontSize: "0.7rem",
          }}
        />
      ) : isSuperuser ? (
        <Select
          value={tag}
          onChange={handleChange}
          size="small"
          disabled={saving}
          displayEmpty
          sx={{
            minWidth: 100,
            fontSize: "0.75rem",
            height: 28,
            "& .MuiSelect-select": { py: 0.25 },
          }}
        >
          {TAG_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.8rem" }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      ) : (
        tagLabel && (
          <Chip
            label={tagLabel}
            size="small"
            sx={{
              backgroundColor: colors.accentBgSubtle,
              color: colors.green400,
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        )
      )}
    </Box>
  );
}
