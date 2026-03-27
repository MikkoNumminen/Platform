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
import BugReportIcon from "@mui/icons-material/BugReport";
import ListAltIcon from "@mui/icons-material/ListAlt";
import Link from "next/link";
import { colors } from "../styles";

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

  if (!session?.user) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={() => signIn()}
        sx={{
          color: colors.slate100,
          borderColor: colors.slate300,
          "&:hover": { borderColor: colors.slate100 },
        }}
      >
        Sign In
      </Button>
    );
  }

  const user = session.user;
  const displayName = user.alias ?? user.name;
  const permissions = (user.permissions as Record<string, boolean>) ?? {};
  const canManageUsers = Boolean(permissions["admin:users"]);
  const canViewSurveyResults = Boolean(permissions["survey:results"]);
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
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{displayName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        {canManageUsers && (
          <MenuItem component={Link} href="/admin/users">
            Manage Users
          </MenuItem>
        )}
        {canViewSurveyResults && (
          <MenuItem component={Link} href="/admin/survey-results">
            Survey Results
          </MenuItem>
        )}
        <Divider />
        <MenuItem component={Link} href="/survey">
          <ListItemIcon>
            <FeedbackIcon fontSize="small" />
          </ListItemIcon>
          Feedback & Survey
        </MenuItem>
        {isApproved && (
          <MenuItem component={Link} href="/issues">
            <ListItemIcon>
              <ListAltIcon fontSize="small" />
            </ListItemIcon>
            Issue Tracker
          </MenuItem>
        )}
        <MenuItem component={Link} href="/report-issue">
          <ListItemIcon>
            <BugReportIcon fontSize="small" />
          </ListItemIcon>
          Report Issue
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => signOut()}>Sign Out</MenuItem>
      </Menu>
    </Box>
  );
}
