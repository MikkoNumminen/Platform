"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { colors } from "../styles";
import BoardFormDialog from "./BoardFormDialog";

export default function BoardActions() {
  const { data: session } = useSession();
  const [showCreate, setShowCreate] = useState(false);

  const permissions = session?.user?.permissions as Record<string, boolean> | undefined;
  if (!permissions?.["board:create"]) return null;

  return (
    <>
      <Button
        data-tutorial="create-board-button"
        startIcon={<AddIcon />}
        onClick={() => setShowCreate(true)}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.85rem",
          color: colors.green400,
          borderColor: colors.green400,
          "&:hover": {
            backgroundColor: colors.green900,
            borderColor: colors.green400,
          },
        }}
        variant="outlined"
        size="small"
      >
        New Board
      </Button>
      <BoardFormDialog open={showCreate} onClose={() => setShowCreate(false)} mode="create" />
    </>
  );
}
