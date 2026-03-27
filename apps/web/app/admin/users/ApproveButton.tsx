"use client";

import { useState } from "react";
import { Button } from "@mui/material";
import { updateUserRole } from "@/lib/user-actions";
import { colors } from "../../styles";

interface ApproveButtonProps {
  userId: string;
}

export default function ApproveButton({ userId }: ApproveButtonProps) {
  const [approved, setApproved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    setSaving(true);
    const result = await updateUserRole(userId, "user");
    if (!result?.error) {
      setApproved(true);
    }
    setSaving(false);
  };

  if (approved) {
    return (
      <Button size="small" disabled variant="outlined" sx={{ fontSize: "0.7rem" }}>
        Approved
      </Button>
    );
  }

  return (
    <Button
      size="small"
      variant="contained"
      disabled={saving}
      onClick={handleApprove}
      sx={{
        backgroundColor: colors.warning,
        color: colors.slate700,
        fontWeight: 600,
        fontSize: "0.7rem",
        "&:hover": { backgroundColor: colors.warning, opacity: 0.9 },
      }}
    >
      {saving ? "Approving…" : "Approve"}
    </Button>
  );
}
