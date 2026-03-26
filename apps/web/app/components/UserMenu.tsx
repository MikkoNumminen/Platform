"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
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

  return (
    <Box>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
        <Avatar
          src={user.image ?? undefined}
          alt={user.name ?? "User"}
          sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
        >
          {getInitials(user.name)}
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
          <Typography variant="subtitle2">{user.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          component="a"
          href={process.env.NEXT_PUBLIC_HRM_URL || "http://localhost:3000"}
        >
          Manage Users
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => signOut()}>Sign Out</MenuItem>
      </Menu>
    </Box>
  );
}
