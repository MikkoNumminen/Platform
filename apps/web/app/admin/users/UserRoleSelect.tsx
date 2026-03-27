"use client";

import { useState } from "react";
import { Select, MenuItem, type SelectChangeEvent } from "@mui/material";
import { updateUserRole } from "@/lib/user-actions";
import { ROLES } from "@/lib/permissions";
import { colors } from "../../styles";

interface UserRoleSelectProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

export default function UserRoleSelect({ userId, currentRole, isSelf }: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: SelectChangeEvent) => {
    const newRole = e.target.value;
    setRole(newRole);
    setSaving(true);
    const result = await updateUserRole(userId, newRole);
    if (result?.error) {
      setRole(currentRole);
    }
    setSaving(false);
  };

  return (
    <Select
      value={role}
      onChange={handleChange}
      size="small"
      disabled={saving || isSelf}
      sx={{
        minWidth: 120,
        color: colors.slate100,
        ".MuiOutlinedInput-notchedOutline": { borderColor: colors.slate300 },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.slate400 },
        ".MuiSvgIcon-root": { color: colors.slate400 },
      }}
    >
      {ROLES.map((r) => (
        <MenuItem key={r} value={r}>
          {r}
        </MenuItem>
      ))}
    </Select>
  );
}
