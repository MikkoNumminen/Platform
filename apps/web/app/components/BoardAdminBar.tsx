"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Box, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { colors } from "../styles";
import BoardFormDialog from "./BoardFormDialog";
import PostFormDialog from "./PostFormDialog";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { deleteBoard } from "@/lib/board-actions";

interface BoardAdminBarProps {
  boardId: string;
  boardName: string;
  boardDescription: string;
  boardSlug: string;
}

export default function BoardAdminBar({
  boardId,
  boardName,
  boardDescription,
  boardSlug,
}: BoardAdminBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);

  const permissions = session?.user?.permissions as Record<string, boolean> | undefined;
  const canEdit = permissions?.["board:edit"];
  const canDelete = permissions?.["board:delete"];
  const canCreatePost = permissions?.["post:create"];

  if (!canEdit && !canDelete && !canCreatePost) return null;

  return (
    <>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        {canCreatePost && (
          <Button
            data-tutorial="create-post-button"
            startIcon={<AddIcon />}
            onClick={() => setShowNewPost(true)}
            variant="outlined"
            size="small"
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
          >
            New Post
          </Button>
        )}
        {canEdit && (
          <Button
            startIcon={<EditIcon />}
            onClick={() => setShowEdit(true)}
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              fontSize: "0.85rem",
              color: colors.slate400,
              borderColor: colors.slate400,
              "&:hover": {
                borderColor: colors.slate100,
                color: colors.slate100,
              },
            }}
          >
            Edit Board
          </Button>
        )}
        {canDelete && (
          <Button
            startIcon={<DeleteIcon />}
            onClick={() => setShowDelete(true)}
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              fontSize: "0.85rem",
              color: colors.error,
              borderColor: colors.error,
              "&:hover": {
                backgroundColor: colors.errorBg,
                borderColor: colors.error,
              },
            }}
          >
            Delete Board
          </Button>
        )}
      </Box>

      <BoardFormDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        mode="edit"
        boardId={boardId}
        initialName={boardName}
        initialDescription={boardDescription}
      />

      <PostFormDialog
        open={showNewPost}
        onClose={() => setShowNewPost(false)}
        mode="create"
        boardId={boardId}
        boardSlug={boardSlug}
      />

      <ConfirmDeleteDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          await deleteBoard(boardId);
          router.push("/boards");
        }}
        title="Delete Board"
        message={`Are you sure you want to delete "${boardName}"? All posts in this board will also be deleted. This action cannot be undone.`}
      />
    </>
  );
}
