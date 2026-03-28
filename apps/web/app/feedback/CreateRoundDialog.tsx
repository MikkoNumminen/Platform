"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Alert,
} from "@mui/material";
import { createSurveyRound } from "@/lib/survey-round-actions";

interface CreateRoundDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateRoundDialog({ open, onClose }: CreateRoundDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasXp, setHasXp] = useState(false);
  const [xpReward, setXpReward] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createSurveyRound(
          title.trim(),
          description.trim() || undefined,
          hasXp ? xpReward : 0,
        );
        resetForm();
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create round");
      }
    });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setHasXp(false);
    setXpReward(50);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Survey Round</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            inputProps={{ maxLength: 200 }}
            placeholder="e.g. March 2026 Feedback"
          />

          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="What should members focus on?"
          />

          <Box>
            <FormControlLabel
              control={<Switch checked={hasXp} onChange={(e) => setHasXp(e.target.checked)} />}
              label="Assign as quest with XP reward"
            />
            {hasXp && (
              <Box sx={{ px: 2, mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  XP Reward: {xpReward}
                </Typography>
                <Slider
                  value={xpReward}
                  onChange={(_, val) => setXpReward(val as number)}
                  min={10}
                  max={500}
                  step={10}
                  marks={[
                    { value: 10, label: "10" },
                    { value: 250, label: "250" },
                    { value: 500, label: "500" },
                  ]}
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isPending || !title.trim()}>
          {isPending ? "Creating..." : "Create Round"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
