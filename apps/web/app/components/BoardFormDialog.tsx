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
import { colors } from "../styles";
import { createBoard, updateBoard } from "@/lib/board-actions";

interface BoardFormDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  boardId?: string;
  initialName?: string;
  initialDescription?: string;
}

export default function BoardFormDialog({
  open,
  onClose,
  mode,
  boardId,
  initialName = "",
  initialDescription = "",
}: BoardFormDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createBoard(name, description || undefined)
          : await updateBoard(boardId!, name, description || undefined);

      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.slate700,
          border: `1px solid ${colors.slate300}`,
        },
      }}
    >
      <DialogTitle sx={{ color: colors.slate100 }}>
        {mode === "create" ? "Create Board" : "Edit Board"}
      </DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}
      >
        <TextField
          label="Board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          disabled={isPending}
          inputProps={{ maxLength: 100 }}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: colors.slate100,
              "& fieldset": { borderColor: colors.slate400 },
              "&:hover fieldset": { borderColor: colors.slate300 },
              "&.Mui-focused fieldset": { borderColor: colors.green400 },
            },
            "& .MuiInputLabel-root": { color: colors.slate400 },
            "& .MuiInputLabel-root.Mui-focused": { color: colors.green400 },
          }}
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          disabled={isPending}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: colors.slate100,
              "& fieldset": { borderColor: colors.slate400 },
              "&:hover fieldset": { borderColor: colors.slate300 },
              "&.Mui-focused fieldset": { borderColor: colors.green400 },
            },
            "& .MuiInputLabel-root": { color: colors.slate400 },
            "& .MuiInputLabel-root.Mui-focused": { color: colors.green400 },
          }}
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
          disabled={name.trim().length === 0 || isPending}
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
          {isPending ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
