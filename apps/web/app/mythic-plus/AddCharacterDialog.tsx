"use client";

import { useState, useTransition } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { addCharacter } from "@/lib/mythicplus-actions";

const REGIONS = [
  { value: "eu", label: "EU" },
  { value: "us", label: "US" },
  { value: "kr", label: "KR" },
  { value: "tw", label: "TW" },
];

interface AddCharacterDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddCharacterDialog({ open, onClose }: AddCharacterDialogProps) {
  const [name, setName] = useState("");
  const [realm, setRealm] = useState("");
  const [region, setRegion] = useState("eu");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addCharacter(name, realm, region);
      if (result?.error) {
        setError(result.error);
      } else {
        setName("");
        setRealm("");
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Add Character
        <IconButton size="small" aria-label="Close dialog" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            label="Character Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            size="small"
            autoFocus
            inputProps={{ maxLength: 30 }}
          />
          <TextField
            label="Realm"
            value={realm}
            onChange={(e) => setRealm(e.target.value)}
            required
            size="small"
            placeholder="e.g. Tarren Mill"
          />
          <TextField
            select
            label="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            size="small"
          >
            {REGIONS.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>

          {error && <Alert severity="error">{error}</Alert>}

          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Looking up..." : "Add Character"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
