"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import IconPicker from "./IconPicker";
import { colors } from "../../../styles";
import { createQuest, updateQuest, deleteQuest } from "@/lib/gamification/admin-actions";
import { CRITERIA_ACTIONS } from "@/lib/gamification/xp-config";
import { useRouter } from "next/navigation";

export interface QuestData {
  id: string;
  key: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  xpReward: number;
  criteria: Record<string, unknown> | null;
  repeatable: boolean;
  sortOrder: number;
}

const QUEST_TYPES = ["onboarding", "daily", "weekly", "special"];

const DEFAULT_FORM = {
  key: "",
  name: "",
  description: "",
  icon: "\uD83D\uDCCB",
  type: "daily",
  xpReward: 25,
  criteriaAction: "shout:create",
  criteriaCount: 1,
  repeatable: true,
  sortOrder: 0,
};

interface QuestEditorProps {
  quests: QuestData[];
  setError: (error: string | null) => void;
}

export default function QuestEditor({ quests, setError }: QuestEditorProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuestData | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
    setError(null);
  }

  function openEdit(q: QuestData) {
    setEditing(q);
    const criteria = q.criteria as { action?: string; count?: number };
    setForm({
      key: q.key ?? "",
      name: q.name,
      description: q.description ?? "",
      icon: q.icon ?? "📋",
      type: q.type,
      xpReward: q.xpReward,
      criteriaAction: criteria.action ?? "shout:create",
      criteriaCount: criteria.count ?? 1,
      repeatable: q.repeatable,
      sortOrder: q.sortOrder,
    });
    setIsDialogOpen(true);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const input = {
      key: form.key,
      name: form.name,
      description: form.description,
      icon: form.icon,
      type: form.type,
      xpReward: form.xpReward,
      criteria: { action: form.criteriaAction, count: form.criteriaCount },
      repeatable: form.repeatable,
      sortOrder: form.sortOrder,
    };

    const result = editing ? await updateQuest(editing.id, input) : await createQuest(input);

    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setIsDialogOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quest? User progress records will also be removed.")) return;
    const result = await deleteQuest(id);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openNew}
          sx={{ backgroundColor: colors.green400, "&:hover": { backgroundColor: colors.success } }}
        >
          New Quest
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {quests.map((q) => {
          const criteria = q.criteria as { action?: string; count?: number };
          return (
            <Card key={q.id}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography sx={{ fontSize: "1.5rem" }}>{q.icon}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {q.name}
                      </Typography>
                      <Chip label={q.type} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                      {q.repeatable && (
                        <Chip
                          label="repeatable"
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.65rem" }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: colors.slate400 }}>
                      {q.description}
                      {criteria?.action ? ` — ${criteria.action}:${criteria.count}` : ""}
                      {" — "}+{q.xpReward} XP
                    </Typography>
                  </Box>
                  <Chip
                    label={`key: ${q.key}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.65rem", borderColor: colors.slate600 }}
                  />
                  <Tooltip title="Edit">
                    <IconButton size="small" aria-label="Edit" onClick={() => openEdit(q)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Delete"
                      onClick={() => handleDelete(q.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          );
        })}
        {quests.length === 0 && (
          <Typography sx={{ color: colors.slate400, textAlign: "center", py: 4 }}>
            No quests defined.
          </Typography>
        )}
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Quest" : "New Quest"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Key"
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              size="small"
              helperText="Unique identifier (lowercase, underscores)"
              disabled={!!editing}
            />
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              size="small"
              multiline
              rows={2}
            />
            <IconPicker value={form.icon} onChange={(icon) => setForm((f) => ({ ...f, icon }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="XP Reward"
                type="number"
                value={form.xpReward}
                onChange={(e) =>
                  setForm((f) => ({ ...f, xpReward: parseInt(e.target.value) || 0 }))
                }
                size="small"
                sx={{ width: 120 }}
              />
              <TextField
                label="Sort Order"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                }
                size="small"
                sx={{ width: 100 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  label="Type"
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {QUEST_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.repeatable}
                    onChange={(e) => setForm((f) => ({ ...f, repeatable: e.target.checked }))}
                  />
                }
                label="Repeatable"
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Criteria Action</InputLabel>
                <Select
                  value={form.criteriaAction}
                  label="Criteria Action"
                  onChange={(e) => setForm((f) => ({ ...f, criteriaAction: e.target.value }))}
                >
                  {CRITERIA_ACTIONS.map((a) => (
                    <MenuItem key={a} value={a}>
                      {a}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Count"
                type="number"
                value={form.criteriaCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, criteriaCount: parseInt(e.target.value) || 1 }))
                }
                size="small"
                sx={{ width: 120 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              backgroundColor: colors.green400,
              "&:hover": { backgroundColor: colors.success },
            }}
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
