"use client";

import { useState, useTransition } from "react";
import { IconButton, Menu, MenuItem, Typography } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useLocale } from "next-intl";
import { locales, localeNames, Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { colors } from "../styles";

export default function LanguageSwitcher() {
  const currentLocale = useLocale();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (locale: Locale) => {
    setAnchorEl(null);
    startTransition(async () => {
      await setLocale(locale);
      window.location.reload();
    });
  };

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Change language"
        disabled={isPending}
        sx={{ color: colors.slate100 }}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {locales.map((locale) => (
          <MenuItem
            key={locale}
            onClick={() => handleSelect(locale)}
            selected={locale === currentLocale}
            sx={{
              color: colors.slate100,
              "&:hover": { backgroundColor: colors.hoverOverlay },
              ...(locale === currentLocale && {
                backgroundColor: colors.hoverOverlay,
              }),
            }}
          >
            <Typography variant="body2">{localeNames[locale]}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
