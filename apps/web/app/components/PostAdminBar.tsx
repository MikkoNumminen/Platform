"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Box, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PushPinIcon from "@mui/icons-material/PushPin";
import { colors } from "../styles";
import PostFormDialog from "./PostFormDialog";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { deletePost, togglePostPin } from "@/lib/post-actions";

interface PostAdminBarProps {
  postId: string;
  postTitle: string;
  postBody: string;
  pinned: boolean;
  boardId: string;
  boardSlug: string;
}

export default function PostAdminBar({
  postId,
  postTitle,
  postBody,
  pinned,
  boardId,
  boardSlug,
}: PostAdminBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const permissions = session?.user?.permissions as Record<string, boolean> | undefined;
  const canEdit = permissions?.["post:edit"];
  const canDelete = permissions?.["post:delete"];

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        {canEdit && (
          <Button
            startIcon={<PushPinIcon />}
            onClick={async () => {
              await togglePostPin(postId);
            }}
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
            {pinned ? "Unpin" : "Pin"}
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
            Edit
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
            Delete
          </Button>
        )}
      </Box>

      <PostFormDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        mode="edit"
        boardId={boardId}
        boardSlug={boardSlug}
        postId={postId}
        initialTitle={postTitle}
        initialBody={postBody}
      />

      <ConfirmDeleteDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          await deletePost(postId);
          router.push(`/boards/${boardSlug}`);
        }}
        title="Delete Post"
        message={`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`}
      />
    </>
  );
}
