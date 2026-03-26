"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTransition } from "react";
import { colors } from "../styles";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.slate700,
          border: `1px solid ${colors.slate300}`,
        },
      }}
    >
      <DialogTitle sx={{ color: colors.slate100 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: colors.slate400 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending} sx={{ color: colors.slate400 }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isPending}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: colors.errorBg,
            color: colors.error,
            border: `1px solid ${colors.error}`,
            "&:hover": {
              backgroundColor: colors.error,
              color: colors.slate100,
            },
            "&.Mui-disabled": {
              backgroundColor: colors.slate600,
              color: colors.slate400,
              borderColor: colors.slate400,
            },
          }}
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
