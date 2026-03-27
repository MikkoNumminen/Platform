"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from "@mui/material";
import { colors } from "../styles";
import {
  ThemeName,
  THEME_NAMES,
  THEME_PALETTES,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
} from "../themeConfig";

interface ThemeContextValue {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: DEFAULT_THEME,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function loadTheme(): ThemeName {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (THEME_NAMES as readonly string[]).includes(stored)) {
      return stored as ThemeName;
    }
  } catch {
    /* empty */
  }
  return DEFAULT_THEME;
}

function getPaletteMode(theme: ThemeName): "dark" | "light" {
  return theme === "light" ? "light" : "dark";
}

function buildCssVariables(theme: ThemeName): Record<string, string> {
  const palette = THEME_PALETTES[theme];
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette)) {
    vars[`--platform-${key}`] = value;
  }
  return vars;
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    setCurrentTheme(loadTheme());
  }, []);

  const setTheme = useCallback((theme: ThemeName) => {
    setCurrentTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* empty */
    }
  }, []);

  const muiTheme = useMemo(() => {
    const p = THEME_PALETTES[currentTheme];
    return createTheme({
      palette: {
        mode: getPaletteMode(currentTheme),
        background: {
          default: p.slate700,
          paper: p.slate600,
        },
        text: {
          primary: p.slate100,
          secondary: p.slate300,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: colors.slate700,
              color: colors.slate100,
            },
          },
        },
      },
    });
  }, [currentTheme]);

  const isWarcraft = currentTheme === "epic";

  const globalStyles = useMemo(
    () => ({
      ":root": buildCssVariables(currentTheme),
      ...(isWarcraft
        ? {
            body: {
              backgroundImage:
                "radial-gradient(ellipse at 50% 0%, rgba(42,31,10,0.6) 0%, transparent 70%), " +
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,168,67,0.015) 2px, rgba(212,168,67,0.015) 4px)",
            },
            "h1, h2, h3, h4, h5, h6, .MuiTypography-h4, .MuiTypography-h5, .MuiTypography-h6": {
              fontFamily: "var(--font-cinzel), serif !important",
              textShadow: "0 1px 2px rgba(0,0,0,0.8), 0 0 8px rgba(212,168,67,0.3)",
            },
            ".MuiAppBar-root": {
              backgroundImage: "linear-gradient(180deg, #1A1410 0%, #0C0A08 100%) !important",
              borderBottom: "2px solid #8B7355 !important",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(212,168,67,0.15) !important",
            },
            ".MuiCard-root": {
              backgroundImage:
                "linear-gradient(180deg, rgba(30,22,14,0.95) 0%, rgba(12,10,8,0.98) 100%) !important",
              border: "1px solid #6B5B45 !important",
              boxShadow:
                "0 0 0 1px rgba(212,168,67,0.1), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,168,67,0.08) !important",
            },
            ".MuiButton-contained": {
              backgroundImage:
                "linear-gradient(180deg, #8B2020 0%, #5C1414 50%, #7A1C1C 100%) !important",
              border: "1px solid #D4A843 !important",
              fontFamily: "var(--font-cinzel), serif !important",
              fontWeight: "600 !important",
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              boxShadow:
                "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1) !important",
              "&:hover": {
                backgroundImage:
                  "linear-gradient(180deg, #A02828 0%, #6B1818 50%, #8B2020 100%) !important",
                boxShadow:
                  "0 2px 8px rgba(212,168,67,0.3), inset 0 1px 0 rgba(255,255,255,0.15) !important",
              },
            },
            ".MuiButton-outlined": {
              border: "1px solid #8B7355 !important",
              fontFamily: "var(--font-cinzel), serif !important",
              fontWeight: "600 !important",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              "&:hover": {
                border: "1px solid #D4A843 !important",
                boxShadow: "0 0 8px rgba(212,168,67,0.2) !important",
              },
            },
            ".MuiTableHead-root .MuiTableCell-root": {
              fontFamily: "var(--font-cinzel), serif !important",
              textTransform: "uppercase",
              fontSize: "0.75rem !important",
              letterSpacing: "0.05em",
            },
            ".MuiChip-root": {
              fontFamily: "var(--font-cinzel), serif !important",
            },
            ".MuiDivider-root": {
              borderImage: "linear-gradient(90deg, transparent, #8B7355, transparent) 1 !important",
            },
          }
        : {}),
    }),
    [currentTheme, isWarcraft],
  );

  const contextValue = useMemo(() => ({ currentTheme, setTheme }), [currentTheme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
