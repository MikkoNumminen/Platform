"use client";

import { useState } from "react";
import {
  Alert,
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
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import TopBar from "../../../components/TopBar";
import { colors, TIER_COLORS } from "../../../styles";
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
  createQuest,
  updateQuest,
  deleteQuest,
} from "@/lib/gamification/admin-actions";
import { useRouter } from "next/navigation";

const ICON_OPTIONS = [
  // Goats
  "🐐",
  "🐑",
  "🐏",
  // Animals
  "🦁",
  "🐺",
  "🦊",
  "🐻",
  "🐸",
  "🐔",
  "🐧",
  "🦅",
  "🐉",
  "🦄",
  // Combat / RPG
  "⚔️",
  "🛡️",
  "🏹",
  "🗡️",
  "🔮",
  "💎",
  "👑",
  "🏆",
  "🎯",
  "🔥",
  // Fun / Stupid
  "💩",
  "🤡",
  "👻",
  "💀",
  "🧠",
  "👁️",
  "🫡",
  "🤌",
  "🫠",
  "🤯",
  // Achievement vibes
  "⭐",
  "🌟",
  "✨",
  "🎉",
  "🎊",
  "🏅",
  "🥇",
  "🥈",
  "🥉",
  "💫",
  // Nature / misc
  "🌿",
  "🍀",
  "🌙",
  "☀️",
  "🌊",
  "🗻",
  "🧭",
  "📜",
  "📋",
  "🎪",
];

interface AchievementData {
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

interface QuestData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  xpReward: number;
  criteria: Record<string, unknown>;
  repeatable: boolean;
  sortOrder: number;
}

const ACHIEVEMENT_CATEGORIES = ["onboarding", "content", "social", "moderation", "special"];
const ACHIEVEMENT_TIERS = [null, "bronze", "silver", "gold", "legendary"];
const QUEST_TYPES = ["onboarding", "daily", "weekly", "special"];
const CRITERIA_ACTIONS = [
  "alias:set",
  "survey:complete",
  "shout:create",
  "issue:create",
  "feedback:submit",
  "daily:login",
  "login:streak",
  "tour:complete",
];

export default function ManageGamification({
  achievements,
  quests,
}: {
  achievements: AchievementData[];
  quests: QuestData[];
}) {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Achievement form state
  const [achievementDialog, setAchievementDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementData | null>(null);
  const [achievementForm, setAchievementForm] = useState({
    key: "",
    name: "",
    description: "",
    icon: "\u{1F3C6}",
    tier: null as string | null,
    category: "content",
    xpReward: 50,
    criteriaAction: "shout:create",
    criteriaThreshold: 1,
    sortOrder: 0,
  });

  // Quest form state
  const [questDialog, setQuestDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestData | null>(null);
  const [questForm, setQuestForm] = useState({
    key: "",
    name: "",
    description: "",
    icon: "\u{1F4CB}",
    type: "daily",
    xpReward: 25,
    criteriaAction: "shout:create",
    criteriaCount: 1,
    repeatable: true,
    sortOrder: 0,
  });

  const [saving, setSaving] = useState(false);

  // ── Achievement handlers ─────────────────────────────────────────

  function openNewAchievement() {
    setEditingAchievement(null);
    setAchievementForm({
      key: "",
      name: "",
      description: "",
      icon: "\u{1F3C6}",
      tier: null,
      category: "content",
      xpReward: 50,
      criteriaAction: "shout:create",
      criteriaThreshold: 1,
      sortOrder: 0,
    });
    setAchievementDialog(true);
    setError(null);
  }

  function openEditAchievement(a: AchievementData) {
    setEditingAchievement(a);
    const criteria = a.criteria as { action?: string; threshold?: number };
    setAchievementForm({
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
      category: a.category,
      xpReward: a.xpReward,
      criteriaAction: criteria.action ?? "post:create",
      criteriaThreshold: criteria.threshold ?? 1,
      sortOrder: a.sortOrder,
    });
    setAchievementDialog(true);
    setError(null);
  }

  async function handleSaveAchievement() {
    setSaving(true);
    setError(null);
    const input = {
      key: achievementForm.key,
      name: achievementForm.name,
      description: achievementForm.description,
      icon: achievementForm.icon,
      tier: achievementForm.tier,
      category: achievementForm.category,
      xpReward: achievementForm.xpReward,
      criteria: {
        type: "count",
        action: achievementForm.criteriaAction,
        threshold: achievementForm.criteriaThreshold,
      },
      sortOrder: achievementForm.sortOrder,
    };

    const result = editingAchievement
      ? await updateAchievement(editingAchievement.id, input)
      : await createAchievement(input);

    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setAchievementDialog(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDeleteAchievement(id: string) {
    if (!confirm("Delete this achievement? User unlock records will also be removed.")) return;
    const result = await deleteAchievement(id);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  // ── Quest handlers ───────────────────────────────────────────────

  function openNewQuest() {
    setEditingQuest(null);
    setQuestForm({
      key: "",
      name: "",
      description: "",
      icon: "\u{1F4CB}",
      type: "daily",
      xpReward: 25,
      criteriaAction: "shout:create",
      criteriaCount: 1,
      repeatable: true,
      sortOrder: 0,
    });
    setQuestDialog(true);
    setError(null);
  }

  function openEditQuest(q: QuestData) {
    setEditingQuest(q);
    const criteria = q.criteria as { action?: string; count?: number };
    setQuestForm({
      key: q.key,
      name: q.name,
      description: q.description,
      icon: q.icon,
      type: q.type,
      xpReward: q.xpReward,
      criteriaAction: criteria.action ?? "post:create",
      criteriaCount: criteria.count ?? 1,
      repeatable: q.repeatable,
      sortOrder: q.sortOrder,
    });
    setQuestDialog(true);
    setError(null);
  }

  async function handleSaveQuest() {
    setSaving(true);
    setError(null);
    const input = {
      key: questForm.key,
      name: questForm.name,
      description: questForm.description,
      icon: questForm.icon,
      type: questForm.type,
      xpReward: questForm.xpReward,
      criteria: { action: questForm.criteriaAction, count: questForm.criteriaCount },
      repeatable: questForm.repeatable,
      sortOrder: questForm.sortOrder,
    };

    const result = editingQuest
      ? await updateQuest(editingQuest.id, input)
      : await createQuest(input);

    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setQuestDialog(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDeleteQuest(id: string) {
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
      <TopBar title="Manage Achievements & Quests" backHref="/admin/gamification" />
      <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Achievements (${achievements.length})`} />
          <Tab label={`Quests (${quests.length})`} />
        </Tabs>

        {/* ── Achievements Tab ── */}
        {tab === 0 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openNewAchievement}
                sx={{
                  backgroundColor: colors.green400,
                  "&:hover": { backgroundColor: colors.success },
                }}
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
                            {a.description} — {criteria.action}:{criteria.threshold} — +{a.xpReward}{" "}
                            XP
                          </Typography>
                        </Box>
                        <Chip
                          label={`key: ${a.key}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.65rem", borderColor: colors.slate600 }}
                        />
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditAchievement(a)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAchievement(a.id)}
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
          </>
        )}

        {/* ── Quests Tab ── */}
        {tab === 1 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openNewQuest}
                sx={{
                  backgroundColor: colors.green400,
                  "&:hover": { backgroundColor: colors.success },
                }}
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
                            <Chip
                              label={q.type}
                              size="small"
                              sx={{ height: 18, fontSize: "0.65rem" }}
                            />
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
                            {q.description} — {criteria.action}:{criteria.count} — +{q.xpReward} XP
                          </Typography>
                        </Box>
                        <Chip
                          label={`key: ${q.key}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.65rem", borderColor: colors.slate600 }}
                        />
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditQuest(q)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteQuest(q.id)}
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
          </>
        )}
      </Box>

      {/* ── Achievement Dialog ── */}
      <Dialog
        open={achievementDialog}
        onClose={() => setAchievementDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingAchievement ? "Edit Achievement" : "New Achievement"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Key"
              value={achievementForm.key}
              onChange={(e) => setAchievementForm((f) => ({ ...f, key: e.target.value }))}
              size="small"
              helperText="Unique identifier (lowercase, underscores)"
              disabled={!!editingAchievement}
            />
            <TextField
              label="Name"
              value={achievementForm.name}
              onChange={(e) => setAchievementForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
            />
            <TextField
              label="Description"
              value={achievementForm.description}
              onChange={(e) => setAchievementForm((f) => ({ ...f, description: e.target.value }))}
              size="small"
              multiline
              rows={2}
            />
            <Box>
              <Typography
                variant="caption"
                sx={{ color: colors.slate400, mb: 0.5, display: "block" }}
              >
                Icon
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                {ICON_OPTIONS.map((emoji) => (
                  <Box
                    key={emoji}
                    onClick={() => setAchievementForm((f) => ({ ...f, icon: emoji }))}
                    sx={{
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      borderRadius: 1,
                      cursor: "pointer",
                      border:
                        achievementForm.icon === emoji
                          ? `2px solid ${colors.green400}`
                          : `1px solid ${colors.slate400}`,
                      backgroundColor:
                        achievementForm.icon === emoji ? colors.accentBgSubtle : "transparent",
                      "&:hover": { backgroundColor: colors.hoverOverlay },
                    }}
                  >
                    {emoji}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="XP Reward"
                type="number"
                value={achievementForm.xpReward}
                onChange={(e) =>
                  setAchievementForm((f) => ({ ...f, xpReward: parseInt(e.target.value) || 0 }))
                }
                size="small"
                sx={{ width: 120 }}
              />
              <TextField
                label="Sort Order"
                type="number"
                value={achievementForm.sortOrder}
                onChange={(e) =>
                  setAchievementForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                }
                size="small"
                sx={{ width: 100 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={achievementForm.category}
                  label="Category"
                  onChange={(e) => setAchievementForm((f) => ({ ...f, category: e.target.value }))}
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
                  value={achievementForm.tier ?? ""}
                  label="Tier"
                  onChange={(e) =>
                    setAchievementForm((f) => ({ ...f, tier: e.target.value || null }))
                  }
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
                  value={achievementForm.criteriaAction}
                  label="Criteria Action"
                  onChange={(e) =>
                    setAchievementForm((f) => ({ ...f, criteriaAction: e.target.value }))
                  }
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
                value={achievementForm.criteriaThreshold}
                onChange={(e) =>
                  setAchievementForm((f) => ({
                    ...f,
                    criteriaThreshold: parseInt(e.target.value) || 1,
                  }))
                }
                size="small"
                sx={{ width: 120 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAchievementDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAchievement}
            disabled={saving}
            sx={{
              backgroundColor: colors.green400,
              "&:hover": { backgroundColor: colors.success },
            }}
          >
            {saving ? "Saving..." : editingAchievement ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Quest Dialog ── */}
      <Dialog open={questDialog} onClose={() => setQuestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingQuest ? "Edit Quest" : "New Quest"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Key"
              value={questForm.key}
              onChange={(e) => setQuestForm((f) => ({ ...f, key: e.target.value }))}
              size="small"
              helperText="Unique identifier (lowercase, underscores)"
              disabled={!!editingQuest}
            />
            <TextField
              label="Name"
              value={questForm.name}
              onChange={(e) => setQuestForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
            />
            <TextField
              label="Description"
              value={questForm.description}
              onChange={(e) => setQuestForm((f) => ({ ...f, description: e.target.value }))}
              size="small"
              multiline
              rows={2}
            />
            <Box>
              <Typography
                variant="caption"
                sx={{ color: colors.slate400, mb: 0.5, display: "block" }}
              >
                Icon
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                {ICON_OPTIONS.map((emoji) => (
                  <Box
                    key={emoji}
                    onClick={() => setQuestForm((f) => ({ ...f, icon: emoji }))}
                    sx={{
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      borderRadius: 1,
                      cursor: "pointer",
                      border:
                        questForm.icon === emoji
                          ? `2px solid ${colors.green400}`
                          : `1px solid ${colors.slate400}`,
                      backgroundColor:
                        questForm.icon === emoji ? colors.accentBgSubtle : "transparent",
                      "&:hover": { backgroundColor: colors.hoverOverlay },
                    }}
                  >
                    {emoji}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="XP Reward"
                type="number"
                value={questForm.xpReward}
                onChange={(e) =>
                  setQuestForm((f) => ({ ...f, xpReward: parseInt(e.target.value) || 0 }))
                }
                size="small"
                sx={{ width: 120 }}
              />
              <TextField
                label="Sort Order"
                type="number"
                value={questForm.sortOrder}
                onChange={(e) =>
                  setQuestForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                }
                size="small"
                sx={{ width: 100 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={questForm.type}
                  label="Type"
                  onChange={(e) => setQuestForm((f) => ({ ...f, type: e.target.value }))}
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
                    checked={questForm.repeatable}
                    onChange={(e) => setQuestForm((f) => ({ ...f, repeatable: e.target.checked }))}
                  />
                }
                label="Repeatable"
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Criteria Action</InputLabel>
                <Select
                  value={questForm.criteriaAction}
                  label="Criteria Action"
                  onChange={(e) => setQuestForm((f) => ({ ...f, criteriaAction: e.target.value }))}
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
                value={questForm.criteriaCount}
                onChange={(e) =>
                  setQuestForm((f) => ({ ...f, criteriaCount: parseInt(e.target.value) || 1 }))
                }
                size="small"
                sx={{ width: 120 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuest}
            disabled={saving}
            sx={{
              backgroundColor: colors.green400,
              "&:hover": { backgroundColor: colors.success },
            }}
          >
            {saving ? "Saving..." : editingQuest ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
