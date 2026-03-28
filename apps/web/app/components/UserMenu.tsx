"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";
import ReplayIcon from "@mui/icons-material/Replay";
import BugReportIcon from "@mui/icons-material/BugReport";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { colors } from "../styles";
import { LOCALSTORAGE_KEY } from "@/lib/survey-config";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserMenu() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const t = useTranslations("common");
  const tm = useTranslations("userMenu");

  if (!session?.user) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={() => signIn()}
        sx={{
          color: colors.green400,
          borderColor: colors.green400,
          fontWeight: 600,
          animation: "signInPulse 2s ease-in-out infinite",
          "@keyframes signInPulse": {
            "0%, 100%": {
              boxShadow: `0 0 4px var(--platform-green400)`,
            },
            "50%": {
              boxShadow: `0 0 16px var(--platform-green400), 0 0 32px var(--platform-green400)`,
            },
          },
          "&:hover": {
            borderColor: colors.green400,
            backgroundColor: "rgba(var(--platform-green400-rgb, 74, 222, 128), 0.1)",
          },
        }}
      >
        {t("signIn")}
      </Button>
    );
  }

  const user = session.user;
  const displayName = user.alias ?? user.name;
  const permissions = (user.permissions as Record<string, boolean>) ?? {};
  const canManageUsers = Boolean(permissions["admin:users"]);
  const canViewSurveyResults = Boolean(permissions["survey:results"]);
  const isVuohiOrSuperuser = user.role === "superuser" || user.role === "vuohi";
  const isApproved = user.role !== "pending";

  return (
    <Box>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
        <Avatar
          src={user.image ?? undefined}
          alt={displayName ?? "User"}
          sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
        >
          {getInitials(displayName)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem component={Link} href="/account" onClick={() => setAnchorEl(null)}>
          <Box sx={{ py: 0.25 }}>
            <Typography variant="subtitle2">{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        {canManageUsers && (
          <MenuItem data-tutorial="nav-manage-users" component={Link} href="/admin/users">
            {tm("manageUsers")}
          </MenuItem>
        )}
        {canViewSurveyResults && (
          <MenuItem
            data-tutorial="nav-survey-results"
            component={Link}
            href="/admin/survey-results"
          >
            {tm("surveyResults")}
          </MenuItem>
        )}
        {isVuohiOrSuperuser && (
          <MenuItem data-tutorial="nav-gamification" component={Link} href="/admin/gamification">
            {tm("vuohiliittoDashboard")}
          </MenuItem>
        )}
        {isApproved && <Divider />}
        {isApproved && (
          <MenuItem data-tutorial="nav-quests" component={Link} href="/quests">
            <ListItemIcon>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            {tm("quests")}
          </MenuItem>
        )}
        {isApproved && (
          <MenuItem data-tutorial="nav-achievements" component={Link} href="/achievements">
            <ListItemIcon>
              <EmojiEventsIcon fontSize="small" />
            </ListItemIcon>
            {tm("achievements")}
          </MenuItem>
        )}
        {isApproved && (
          <MenuItem data-tutorial="nav-leaderboard" component={Link} href="/leaderboard">
            <ListItemIcon>
              <LeaderboardIcon fontSize="small" />
            </ListItemIcon>
            {tm("leaderboard")}
          </MenuItem>
        )}
        <Divider />
        <MenuItem component={Link} href="/survey">
          <ListItemIcon>
            <FeedbackIcon fontSize="small" />
          </ListItemIcon>
          {tm("feedbackSurvey")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            localStorage.removeItem(LOCALSTORAGE_KEY);
            setAnchorEl(null);
            router.push("/survey");
          }}
        >
          <ListItemIcon>
            <ReplayIcon fontSize="small" />
          </ListItemIcon>
          {tm("redoSurvey")}
        </MenuItem>
        {isApproved && (
          <MenuItem data-tutorial="nav-issues" component={Link} href="/issues">
            <ListItemIcon>
              <ListAltIcon fontSize="small" />
            </ListItemIcon>
            {tm("issueTracker")}
          </MenuItem>
        )}
        <MenuItem data-tutorial="nav-report-issue" component={Link} href="/report-issue">
          <ListItemIcon>
            <BugReportIcon fontSize="small" />
          </ListItemIcon>
          {tm("reportIssue")}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => signOut()}>{t("signOut")}</MenuItem>
      </Menu>
    </Box>
  );
}
