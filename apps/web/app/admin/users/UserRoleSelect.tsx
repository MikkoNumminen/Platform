"use client";

import { useState } from "react";
import { Select, MenuItem, Typography, type SelectChangeEvent } from "@mui/material";
import { updateUserRole } from "@/lib/user-actions";
import { ROLES } from "@/lib/permissions";
import { emitTutorialEvent } from "@/app/components/TutorialProvider";
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
  const isPending = currentRole === "pending";

  // Only show roles with rank strictly lower than actor's rank, exclude "pending"
  const assignableRoles = ROLES.filter((r) => r !== "pending" && roleRank(r) > actorRank);

  const handleChange = async (e: SelectChangeEvent) => {
    const newRole = e.target.value;
    setRole(newRole);
    setSaving(true);
    const result = await updateUserRole(userId, newRole);
    if (result?.error) {
      setRole(currentRole);
    } else if (isPending) {
      emitTutorialEvent("approve_user");
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
      data-tutorial={isPending ? "approve-button" : undefined}
      value={isPending ? "" : role}
      onChange={handleChange}
      size="small"
      disabled={saving}
      displayEmpty
      sx={{
        minWidth: 120,
        color: isPending ? colors.warning : colors.slate100,
        fontWeight: isPending ? 700 : 400,
        ".MuiOutlinedInput-notchedOutline": {
          borderColor: isPending ? colors.warning : colors.slate300,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: isPending ? colors.warning : colors.slate400,
        },
        ".MuiSvgIcon-root": { color: isPending ? colors.warning : colors.slate400 },
      }}
    >
      {isPending && (
        <MenuItem value="" disabled>
          Approve →
        </MenuItem>
      )}
      {assignableRoles.map((r) => (
        <MenuItem key={r} value={r}>
          {r}
        </MenuItem>
      ))}
    </Select>
  );
}
