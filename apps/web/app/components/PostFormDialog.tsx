"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { colors } from "../styles";
import { createPost, updatePost } from "@/lib/post-actions";

interface PostFormDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  boardId: string;
  boardSlug: string;
  postId?: string;
  initialTitle?: string;
  initialBody?: string;
}

export default function PostFormDialog({
  open,
  onClose,
  mode,
  boardId,
  boardSlug: _boardSlug,
  postId,
  initialTitle = "",
  initialBody = "",
}: PostFormDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPost(boardId, title, body)
          : await updatePost(postId!, title, body);

      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
        if (mode === "create") {
          router.refresh();
        }
      }
    });
  }

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: colors.slate100,
      "& fieldset": { borderColor: colors.slate400 },
      "&:hover fieldset": { borderColor: colors.slate300 },
      "&.Mui-focused fieldset": { borderColor: colors.green400 },
    },
    "& .MuiInputLabel-root": { color: colors.slate400 },
    "& .MuiInputLabel-root.Mui-focused": { color: colors.green400 },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.slate700,
          border: `1px solid ${colors.slate300}`,
        },
      }}
    >
      <DialogTitle sx={{ color: colors.slate100 }}>
        {mode === "create" ? "Create Post" : "Edit Post"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          disabled={isPending}
          inputProps={{ maxLength: 200 }}
          sx={inputSx}
        />
        <TextField
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          fullWidth
          multiline
          minRows={6}
          maxRows={16}
          disabled={isPending}
          sx={inputSx}
        />
        {error && (
          <Typography variant="caption" sx={{ color: colors.error }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending} sx={{ color: colors.slate400 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={title.trim().length === 0 || body.trim().length === 0 || isPending}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: colors.green900,
            color: colors.green400,
            border: `1px solid ${colors.green400}`,
            "&:hover": {
              backgroundColor: colors.green400,
              color: colors.green900,
            },
            "&.Mui-disabled": {
              backgroundColor: colors.slate600,
              color: colors.slate400,
              borderColor: colors.slate400,
            },
          }}
        >
          {isPending ? "Saving..." : mode === "create" ? "Publish" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
