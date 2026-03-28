"use client";

import { useState } from "react";
import { Select, MenuItem, Typography, type SelectChangeEvent } from "@mui/material";
import { updateUserRole } from "@/lib/user-actions";
import { ROLES } from "@/lib/permissions";
import { colors } from "../../styles";

interface UserRoleSelectProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
  actorRole: string;
}

function roleRank(role: string): number {
  const index = ROLES.indexOf(role as (typeof ROLES)[number]);
  return index === -1 ? ROLES.length : index;
}

export default function UserRoleSelect({
  userId,
  currentRole,
  isSelf,
  actorRole,
}: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  const actorRank = roleRank(actorRole);
  const targetRank = roleRank(currentRole);
  const canModify = !isSelf && targetRank > actorRank;

  // Only show roles with rank strictly lower than actor's rank
  const assignableRoles = ROLES.filter((r) => roleRank(r) > actorRank);

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

  if (!canModify) {
    return (
      <Typography variant="body2" sx={{ color: colors.slate400, minWidth: 120, py: 0.75 }}>
        {currentRole}
      </Typography>
    );
  }

  return (
    <Select
      value={role}
      onChange={handleChange}
      size="small"
      disabled={saving}
      sx={{
        minWidth: 120,
        color: colors.slate100,
        ".MuiOutlinedInput-notchedOutline": { borderColor: colors.slate300 },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.slate400 },
        ".MuiSvgIcon-root": { color: colors.slate400 },
      }}
    >
      {assignableRoles.map((r) => (
        <MenuItem key={r} value={r}>
          {r}
        </MenuItem>
      ))}
    </Select>
  );
}
