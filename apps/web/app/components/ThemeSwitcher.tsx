"use client";

import { IconButton, Menu, MenuItem, Typography } from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import { useState } from "react";
import { colors } from "../styles";
import { THEME_NAMES, THEME_LABELS } from "../themeConfig";
import { useTheme } from "./ThemeRegistry";

export default function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Change theme"
        sx={{ color: colors.slate100 }}
      >
        <PaletteIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: colors.slate600,
            border: `1px solid ${colors.slate300}`,
            borderRadius: "4px",
          },
        }}
      >
        {THEME_NAMES.map((name) => (
          <MenuItem
            key={name}
            selected={name === currentTheme}
            onClick={() => {
              setTheme(name);
              setAnchorEl(null);
            }}
            sx={{
              color: colors.slate100,
              "&:hover": { backgroundColor: colors.hoverOverlay },
            }}
          >
            <Typography variant="body2">{THEME_LABELS[name]}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
