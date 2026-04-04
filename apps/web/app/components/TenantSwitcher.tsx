"use client";

import { useState, useTransition } from "react";
import { Button, CircularProgress } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { switchTenant } from "@/lib/tenant-actions";
import type { Tenant } from "@/lib/tenant";
import { colors } from "../styles";

interface TenantSwitcherProps {
  currentTenant: Tenant;
}

export default function TenantSwitcher({ currentTenant }: TenantSwitcherProps) {
  const [tenant, setTenant] = useState(currentTenant);
  const [isPending, startTransition] = useTransition();

  const handleSwitch = () => {
    const next: Tenant = tenant === "vuohiliitto" ? "platform" : "vuohiliitto";
    startTransition(async () => {
      const result = await switchTenant(next);
      if (!result.error) {
        setTenant(next);
        window.location.reload();
      }
    });
  };

  const label = tenant === "vuohiliitto" ? "Vuohiliitto" : "Platform";

  return (
    <Button
      size="small"
      onClick={handleSwitch}
      disabled={isPending}
      startIcon={
        isPending ? <CircularProgress size={14} /> : <SwapHorizIcon sx={{ fontSize: 16 }} />
      }
      sx={{
        color: tenant === "vuohiliitto" ? colors.warning : colors.cyan400,
        fontWeight: 700,
        fontSize: "0.7rem",
        textTransform: "none",
        border: `1px solid ${tenant === "vuohiliitto" ? colors.warning : colors.cyan400}`,
        borderRadius: "12px",
        px: 1.5,
        py: 0.25,
        minHeight: 28,
        "&:hover": {
          backgroundColor: "rgba(255,255,255,0.05)",
        },
      }}
    >
      {label}
    </Button>
  );
}
