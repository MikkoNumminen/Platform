"use client";

import { useState } from "react";
import { Box, Chip, Select, MenuItem, Tooltip, type SelectChangeEvent } from "@mui/material";
import { setDeveloperTag } from "@/lib/user-actions";
import { colors } from "../../styles";

interface DeveloperTagSelectProps {
  userId: string;
  currentTag: string | null;
  skills: string[];
  wantsToDevelop: boolean;
}

const TAG_OPTIONS = [
  { value: "", label: "None" },
  { value: "developer", label: "Developer" },
  { value: "lead", label: "Lead" },
];

export default function DeveloperTagSelect({
  userId,
  currentTag,
  skills,
  wantsToDevelop,
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

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      {wantsToDevelop && (
        <Tooltip title={skills.length > 0 ? skills.join(", ") : "Interested but no skills listed"}>
          <Chip
            label={skills.length > 0 ? `${skills.length} skills` : "Interested"}
            size="small"
            sx={{
              backgroundColor: "rgba(74,222,128,0.15)",
              color: colors.green400,
              fontSize: "0.7rem",
              cursor: "help",
            }}
          />
        </Tooltip>
      )}
      <Select
        value={tag}
        onChange={handleChange}
        size="small"
        disabled={saving}
        displayEmpty
        sx={{
          minWidth: 90,
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
    </Box>
  );
}
