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
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { colors } from "../../styles";
import {
  createCustomQuest,
  updateCustomQuest,
  completeCustomQuest,
  deleteCustomQuest,
} from "@/lib/custom-quest-actions";

interface QuestUser {
  id: string;
  alias: string | null;
  name: string | null;
}

interface SerializedQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: string;
  priority: string;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  assignee: { id: string; alias: string | null; name: string | null; image: string | null };
  creator: { id: string; alias: string | null; name: string | null };
}

interface QuestListClientProps {
  initialQuests: SerializedQuest[];
  users: QuestUser[];
  canManage: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: colors.warning,
  in_progress: colors.info,
  completed: colors.success,
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: colors.slate400,
  normal: colors.info,
  high: colors.warning,
  urgent: colors.error,
};

export default function QuestListClient({ initialQuests, users, canManage }: QuestListClientProps) {
  const [filter, setFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editQuest, setEditQuest] = useState<SerializedQuest | null>(null);

  const filtered =
    filter === "all" ? initialQuests : initialQuests.filter((q) => q.status === filter);

  return (
    <Box>
      {/* Filter + Create button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {["all", "open", "in_progress", "completed"].map((s) => (
            <Chip
              key={s}
              label={s === "all" ? "All" : (STATUS_LABELS[s] ?? s)}
              onClick={() => setFilter(s)}
              sx={{
                backgroundColor: filter === s ? colors.accentBgSubtle : "transparent",
                color: filter === s ? colors.green400 : colors.slate400,
                border: `1px solid ${filter === s ? colors.green400 : colors.slate400}`,
                fontWeight: filter === s ? 600 : 400,
                cursor: "pointer",
              }}
            />
          ))}
        </Box>
        {canManage && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ color: colors.green400, borderColor: colors.green400 }}
          >
            New Quest
          </Button>
        )}
      </Box>

      {/* Quest list */}
      {filtered.length === 0 ? (
        <Typography sx={{ color: colors.slate400, textAlign: "center", py: 4 }}>
          No quests found.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filtered.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              canManage={canManage}
              onEdit={() => setEditQuest(quest)}
            />
          ))}
        </Box>
      )}

      {/* Create dialog */}
      {createOpen && (
        <QuestFormDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          users={users}
          mode="create"
        />
      )}

      {/* Edit dialog */}
      {editQuest && (
        <QuestFormDialog
          open={Boolean(editQuest)}
          onClose={() => setEditQuest(null)}
          users={users}
          mode="edit"
          quest={editQuest}
        />
      )}
    </Box>
  );
}

function QuestCard({
  quest,
  canManage,
  onEdit,
}: {
  quest: SerializedQuest;
  canManage: boolean;
  onEdit: () => void;
}) {
  const [acting, setActing] = useState(false);
  const assigneeName = quest.assignee.alias ?? quest.assignee.name ?? "Unknown";
  const creatorName = quest.creator.alias ?? quest.creator.name ?? "Unknown";
  const isCompleted = quest.status === "completed";
  const isOverdue = quest.deadline && !isCompleted && new Date(quest.deadline) < new Date();

  const handleComplete = async () => {
    setActing(true);
    await completeCustomQuest(quest.id);
    setActing(false);
  };

  const handleDelete = async () => {
    setActing(true);
    await deleteCustomQuest(quest.id);
    setActing(false);
  };

  return (
    <Card
      sx={{
        opacity: isCompleted ? 0.6 : 1,
        borderLeft: `3px solid ${STATUS_COLORS[quest.status] ?? colors.slate400}`,
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  textDecoration: isCompleted ? "line-through" : "none",
                  color: colors.slate100,
                }}
              >
                {quest.title}
              </Typography>
              <Chip
                label={STATUS_LABELS[quest.status] ?? quest.status}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  color: STATUS_COLORS[quest.status] ?? colors.slate400,
                  border: `1px solid ${STATUS_COLORS[quest.status] ?? colors.slate400}`,
                }}
              />
              <Chip
                label={PRIORITY_LABELS[quest.priority] ?? quest.priority}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  backgroundColor: "transparent",
                  color: PRIORITY_COLORS[quest.priority] ?? colors.slate400,
                  border: `1px solid ${PRIORITY_COLORS[quest.priority] ?? colors.slate400}`,
                }}
              />
              {quest.xpReward > 0 && (
                <Chip
                  label={`+${quest.xpReward} XP`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    backgroundColor: colors.accentBgSubtle,
                    color: colors.green400,
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: colors.slate400, mb: 0.5 }}>
              {quest.description}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Typography variant="caption" sx={{ color: colors.slate400 }}>
                Assigned to <strong>{assigneeName}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: colors.slate400 }}>
                by {creatorName}
              </Typography>
              {quest.deadline && (
                <Typography
                  variant="caption"
                  sx={{ color: isOverdue ? colors.error : colors.slate400 }}
                >
                  {isOverdue ? "Overdue: " : "Due: "}
                  {new Date(quest.deadline).toLocaleDateString()}
                </Typography>
              )}
              {quest.completedAt && (
                <Typography variant="caption" sx={{ color: colors.success }}>
                  Completed {new Date(quest.completedAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action buttons */}
          {canManage && !isCompleted && (
            <Box sx={{ display: "flex", gap: 0.5, ml: 1, flexShrink: 0 }}>
              <Tooltip title="Mark complete">
                <IconButton
                  size="small"
                  onClick={handleComplete}
                  disabled={acting}
                  sx={{ color: colors.success }}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={onEdit}
                  disabled={acting}
                  sx={{ color: colors.info }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  disabled={acting}
                  sx={{ color: colors.error }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function QuestFormDialog({
  open,
  onClose,
  users,
  mode,
  quest,
}: {
  open: boolean;
  onClose: () => void;
  users: QuestUser[];
  mode: "create" | "edit";
  quest?: SerializedQuest;
}) {
  const [title, setTitle] = useState(quest?.title ?? "");
  const [description, setDescription] = useState(quest?.description ?? "");
  const [xpReward, setXpReward] = useState(quest?.xpReward ?? 50);
  const [assigneeId, setAssigneeId] = useState(quest?.assignee.id ?? "");
  const [priority, setPriority] = useState(quest?.priority ?? "normal");
  const [status, setStatus] = useState(quest?.status ?? "open");
  const [deadline, setDeadline] = useState(quest?.deadline ? quest.deadline.split("T")[0] : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    let result;
    if (mode === "create") {
      result = await createCustomQuest(
        title,
        description,
        assigneeId,
        xpReward,
        priority,
        deadline || null,
      );
    } else if (quest) {
      result = await updateCustomQuest(quest.id, {
        title,
        description,
        xpReward,
        assigneeId,
        priority,
        status,
        deadline: deadline || null,
      });
    }

    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === "create" ? "Create Quest" : "Edit Quest"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 200 }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            inputProps={{ maxLength: 2000 }}
          />
          <FormControl fullWidth required>
            <InputLabel>Assignee</InputLabel>
            <Select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              label="Assignee"
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.alias ?? u.name ?? u.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="XP Reward"
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(Number(e.target.value))}
              sx={{ flex: 1 }}
              inputProps={{ min: 0, max: 10000 }}
            />
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {mode === "edit" && (
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
              </Select>
            </FormControl>
          )}
          <TextField
            label="Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {error && (
            <Typography variant="body2" sx={{ color: colors.error }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || !title.trim() || !description.trim() || !assigneeId}
        >
          {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
