"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import TopBar from "../components/TopBar";
import { deleteMyAccount, exportMyData } from "@/lib/gdpr-actions";
import { setAlias, toggleWantsToDevelop, getMyDeveloperInfo } from "@/lib/alias-actions";
import { colors } from "../styles";
import { getMyGamificationProfile } from "@/lib/gamification/xp-actions";

export default function AccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasValue, setAliasValue] = useState("");
  const [aliasSaving, setAliasSaving] = useState(false);
  const [wantsToDevelop, setWantsToDevelop] = useState(false);
  const [developerTag, setDeveloperTag] = useState<string | null>(null);
  const [gamProfile, setGamProfile] = useState<{
    totalXp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
  } | null>(null);

  useEffect(() => {
    getMyGamificationProfile().then((p) => {
      if (p) setGamProfile(p);
    });
    getMyDeveloperInfo().then((info) => {
      if (info) {
        setWantsToDevelop(info.wantsToDevelop);
        setDeveloperTag(info.developerTag);
      }
    });
  }, []);

  if (!session?.user) {
    router.replace("/auth/signin");
    return null;
  }

  const user = session.user;
  const currentAlias = user.alias ?? "";

  const handleAliasEdit = () => {
    setAliasValue(currentAlias);
    setEditingAlias(true);
    setError(null);
  };

  const handleAliasSave = async () => {
    setAliasSaving(true);
    setError(null);
    const result = await setAlias(aliasValue);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Alias updated successfully.");
      setEditingAlias(false);
    }
    setAliasSaving(false);
  };

  const handleDevToggle = async (checked: boolean) => {
    setWantsToDevelop(checked);
    const result = await toggleWantsToDevelop(checked);
    if (result?.error) {
      setWantsToDevelop(!checked);
      setError(result.error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const result = await exportMyData();
      if ("error" in result) {
        setError(result.error);
      } else {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `my-data-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess("Data exported successfully.");
      }
    } catch {
      setError("An unexpected error occurred.");
    }
    setExporting(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteMyAccount(confirmText);
      if (result?.error) {
        setError(result.error);
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("An unexpected error occurred.");
      setDeleting(false);
    }
  };

  return (
    <>
      <TopBar title="Account Settings" backHref="/" />
      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <ProfileField label="Email" value={user.email ?? "—"} />
              <ProfileField label="Name" value={user.name ?? "—"} />
              {editingAlias ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.slate400, minWidth: 60 }}>
                    Alias
                  </Typography>
                  <TextField
                    size="small"
                    value={aliasValue}
                    onChange={(e) => setAliasValue(e.target.value)}
                    inputProps={{ maxLength: 30, minLength: 2 }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleAliasSave}
                    disabled={aliasSaving || aliasValue.trim().length < 2}
                    sx={{ minWidth: "auto" }}
                  >
                    {aliasSaving ? "..." : "Save"}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setEditingAlias(false)}
                    disabled={aliasSaving}
                    sx={{ minWidth: "auto" }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ProfileField label="Alias" value={currentAlias || "—"} />
                  <Button
                    size="small"
                    onClick={handleAliasEdit}
                    sx={{ color: colors.green400, minWidth: "auto", textTransform: "none" }}
                  >
                    Change
                  </Button>
                </Box>
              )}
              <ProfileField label="Role" value={user.role ?? "—"} />
              {developerTag && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: colors.slate400, minWidth: 60 }}>
                    Tag
                  </Typography>
                  <Chip
                    label={developerTag.charAt(0).toUpperCase() + developerTag.slice(1)}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(74,222,128,0.15)",
                      color: colors.green400,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Development
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Interested in helping build this platform? Toggle this to let us know you want to
              contribute — coding, design, testing, or ideas.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={wantsToDevelop}
                  onChange={(e) => handleDevToggle(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: colors.green400 },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: colors.green400,
                    },
                  }}
                />
              }
              label="I want to help develop this site"
            />
          </CardContent>
        </Card>

        {gamProfile && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gamification
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <ProfileField label="Level" value={String(gamProfile.level)} />
                <ProfileField label="XP" value={String(gamProfile.totalXp)} />
                <ProfileField label="Streak" value={`${gamProfile.currentStreak} days`} />
                <ProfileField label="Best" value={`${gamProfile.longestStreak} days`} />
              </Box>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Download a copy of all your data including your profile, posts, comments, events, and
              survey responses.
            </Typography>
            <Button variant="outlined" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Download My Data"}
            </Button>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        <Card sx={{ border: `1px solid ${colors.error}` }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              Delete Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete your account and all associated personal data. Your authored
              content will be anonymized. This action cannot be undone.
            </Typography>
            <Button variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
              Delete My Account
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Read our{" "}
            <Typography
              component="a"
              href="/privacy"
              variant="body2"
              sx={{ color: colors.green400 }}
            >
              Privacy Policy
            </Typography>
          </Typography>
        </Box>
      </Box>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will permanently delete your personal data and anonymize all your content. You will
            be signed out immediately. This cannot be undone.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            Type <strong>DELETE</strong> to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || deleting}
          >
            {deleting ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Typography variant="body2" sx={{ color: colors.slate400, minWidth: 60 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.slate100 }}>
        {value}
      </Typography>
    </Box>
  );
}
