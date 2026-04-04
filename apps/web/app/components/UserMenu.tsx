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
import Chip from "@mui/material/Chip";
import FeedbackIcon from "@mui/icons-material/Feedback";
import BugReportIcon from "@mui/icons-material/BugReport";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ScienceIcon from "@mui/icons-material/Science";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import Link from "next/link";
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
  const t = useTranslations("common");
  const tm = useTranslations("userMenu");
  const td = useTranslations("demo");

  const showDemo = process.env.NEXT_PUBLIC_DEMO_LOGIN !== "false";

  if (!session?.user) {
    return (
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {showDemo && (
          <Button
            size="small"
            onClick={() => signIn("demo", { callbackUrl: "/" })}
            sx={{
              color: colors.green400,
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "rgba(var(--platform-green400-rgb, 74, 222, 128), 0.1)",
              },
            }}
          >
            {td("tryDemo")}
            <Chip
              icon={<ScienceIcon sx={{ fontSize: 12 }} />}
              label="Beta"
              size="small"
              sx={{
                ml: 0.5,
                height: 18,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                backgroundColor: colors.surfaceOverlay,
                color: colors.warning,
                "& .MuiChip-icon": { color: colors.warning, ml: 0.5 },
              }}
            />
          </Button>
        )}
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
      </Box>
    );
  }

  const user = session.user;
  const displayName = user.alias ?? user.name;
  const permissions = (user.permissions as Record<string, boolean>) ?? {};
  const canManageUsers = Boolean(permissions["admin:users"]);
  const isVuohiOrSuperuser = user.role === "superuser" || user.role === "vuohi";
  const isApproved = user.role !== "pending";
  const isDemoUser = Boolean(user.demoSessionId);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {isDemoUser && (
        <Chip
          label={td("exitDemo")}
          size="small"
          onClick={() => {
            localStorage.removeItem(LOCALSTORAGE_KEY);
            localStorage.removeItem("tutorial-progress");
            signOut();
          }}
          sx={{
            backgroundColor: colors.error,
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.7rem",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: colors.error,
            },
          }}
        />
      )}
      <IconButton
        data-tutorial="user-menu-button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        aria-label={`User menu for ${displayName}`}
        aria-haspopup="true"
      >
        <Avatar
          src={user.image ?? undefined}
          alt={displayName ?? "User"}
          sx={{
            width: 32,
            height: 32,
            fontSize: "0.875rem",
            ...(isDemoUser && {
              backgroundColor: colors.green400,
              color: colors.slate700,
              fontWeight: 700,
            }),
          }}
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
        {isVuohiOrSuperuser && (
          <MenuItem data-tutorial="nav-dashboard" component={Link} href="/admin/dashboard">
            {tm("vuohiliittoDashboard")}
          </MenuItem>
        )}
        {user.role === "superuser" && (
          <MenuItem component={Link} href="/admin/audit-log" onClick={() => setAnchorEl(null)}>
            {tm("auditLog")}
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
        {isApproved && (
          <MenuItem component={Link} href="/mythic-plus" onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <SportsEsportsIcon fontSize="small" />
            </ListItemIcon>
            {tm("mythicPlus")}
          </MenuItem>
        )}
        <Divider />
        <MenuItem data-tutorial="nav-feedback" component={Link} href="/feedback">
          <ListItemIcon>
            <FeedbackIcon fontSize="small" />
          </ListItemIcon>
          {tm("feedback")}
        </MenuItem>
        <MenuItem data-tutorial="nav-issues" component={Link} href="/issues">
          <ListItemIcon>
            <BugReportIcon fontSize="small" />
          </ListItemIcon>
          {tm("issues")}
        </MenuItem>
        <Divider />
        {!isDemoUser && showDemo && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              signIn("demo", { callbackUrl: "/" });
            }}
          >
            {td("tryDemo")}
          </MenuItem>
        )}
        <MenuItem onClick={() => signOut()}>{t("signOut")}</MenuItem>
      </Menu>
    </Box>
  );
}
