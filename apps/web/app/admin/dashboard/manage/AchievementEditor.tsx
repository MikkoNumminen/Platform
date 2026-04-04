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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import IconPicker from "./IconPicker";
import { colors, TIER_COLORS } from "../../../styles";
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "@/lib/gamification/admin-actions";
import { CRITERIA_ACTIONS } from "@/lib/gamification/xp-config";
import { useRouter } from "next/navigation";

export interface AchievementData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: string | null;
  category: string;
  xpReward: number;
  criteria: Record<string, unknown>;
  sortOrder: number;
}

const ACHIEVEMENT_CATEGORIES = ["onboarding", "content", "social", "moderation", "special"];
const ACHIEVEMENT_TIERS = [null, "bronze", "silver", "gold", "legendary"];
const DEFAULT_FORM = {
  key: "",
  name: "",
  description: "",
  icon: "\uD83C\uDFC6",
  tier: null as string | null,
  category: "content",
  xpReward: 50,
  criteriaAction: "shout:create",
  criteriaThreshold: 1,
  sortOrder: 0,
};

interface AchievementEditorProps {
  achievements: AchievementData[];
  setError: (error: string | null) => void;
}

export default function AchievementEditor({ achievements, setError }: AchievementEditorProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AchievementData | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
    setError(null);
  }

  function openEdit(a: AchievementData) {
    setEditing(a);
    const criteria = a.criteria as { action?: string; threshold?: number };
    setForm({
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
      category: a.category,
      xpReward: a.xpReward,
      criteriaAction: criteria.action ?? "shout:create",
      criteriaThreshold: criteria.threshold ?? 1,
      sortOrder: a.sortOrder,
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
      tier: form.tier,
      category: form.category,
      xpReward: form.xpReward,
      criteria: {
        type: "count",
        action: form.criteriaAction,
        threshold: form.criteriaThreshold,
      },
      sortOrder: form.sortOrder,
    };

    const result = editing
      ? await updateAchievement(editing.id, input)
      : await createAchievement(input);

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
    if (!confirm("Delete this achievement? User unlock records will also be removed.")) return;
    const result = await deleteAchievement(id);
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
          New Achievement
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {achievements.map((a) => {
          const criteria = a.criteria as { action?: string; threshold?: number };
          return (
            <Card key={a.id}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography sx={{ fontSize: "1.5rem" }}>{a.icon}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {a.name}
                      </Typography>
                      <Chip
                        label={a.category}
                        size="small"
                        sx={{ height: 18, fontSize: "0.65rem" }}
                      />
                      {a.tier && (
                        <Chip
                          label={a.tier}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.65rem",
                            textTransform: "capitalize",
                            color: TIER_COLORS[a.tier],
                            borderColor: TIER_COLORS[a.tier],
                            borderWidth: 1,
                            borderStyle: "solid",
                            backgroundColor: `${TIER_COLORS[a.tier]}22`,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: colors.slate400 }}>
                      {a.description} — {criteria.action}:{criteria.threshold} — +{a.xpReward} XP
                    </Typography>
                  </Box>
                  <Chip
                    label={`key: ${a.key}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.65rem", borderColor: colors.slate600 }}
                  />
                  <Tooltip title="Edit">
                    <IconButton size="small" aria-label="Edit" onClick={() => openEdit(a)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Delete"
                      onClick={() => handleDelete(a.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          );
        })}
        {achievements.length === 0 && (
          <Typography sx={{ color: colors.slate400, textAlign: "center", py: 4 }}>
            No achievements defined.
          </Typography>
        )}
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Achievement" : "New Achievement"}</DialogTitle>
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
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  label="Category"
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {ACHIEVEMENT_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={form.tier ?? ""}
                  label="Tier"
                  onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value || null }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {ACHIEVEMENT_TIERS.filter(Boolean).map((t) => (
                    <MenuItem key={t} value={t!}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                label="Threshold"
                type="number"
                value={form.criteriaThreshold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, criteriaThreshold: parseInt(e.target.value) || 1 }))
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
