"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { PERMISSIONS, resolvePermissions, type PermissionKey } from "@/lib/permissions";
import { fetchUserPermissionOverrides, updateUserPermissions } from "@/lib/user-actions";
import { colors } from "../../styles";

interface UserPermissionEditorProps {
  userId: string;
  userRole: string;
  isSelf: boolean;
  initialHasOverrides: boolean;
}

const PERMISSION_GROUPS: Record<string, PermissionKey[]> = {
  Admin: ["admin:users", "admin:settings"],
  Boards: ["board:create", "board:edit", "board:delete"],
  Posts: ["post:create", "post:edit", "post:delete"],
  Forums: ["forum:create", "forum:edit", "forum:delete"],
  Topics: ["topic:create", "topic:edit", "topic:delete"],
  Threads: ["thread:create", "thread:edit", "thread:delete"],
  Calendar: ["event:create", "event:edit", "event:delete"],
  Survey: ["survey:results"],
};

export default function UserPermissionEditor({
  userId,
  userRole,
  isSelf,
  initialHasOverrides,
}: UserPermissionEditorProps) {
  const [open, setOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({});
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasOverrides, setHasOverrides] = useState(initialHasOverrides);

  const roleDefaults = resolvePermissions(userRole);

  useEffect(() => {
    if (open && !loaded) {
      fetchUserPermissionOverrides(userId).then((result) => {
        const map: Record<string, boolean | null> = {};
        for (const o of result) {
          map[o.key] = o.granted;
        }
        setOverrides(map);
        setLoaded(true);
      });
    }
  }, [open, loaded, userId]);

  const handleToggle = (key: PermissionKey) => {
    setOverrides((prev) => {
      const roleDefault = roleDefaults[key];
      const currentOverride = prev[key];

      if (currentOverride === null || currentOverride === undefined) {
        // No override yet — set to opposite of role default
        return { ...prev, [key]: !roleDefault };
      }
      // Has override — remove it (revert to role default)
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = () => {
    const toSave = Object.entries(overrides)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([key, granted]) => ({ key, granted: granted as boolean }));

    startTransition(async () => {
      await updateUserPermissions(userId, toSave);
      setHasOverrides(toSave.length > 0);
    });
  };

  const hasChanges = Object.keys(overrides).some(
    (key) => overrides[key] !== null && overrides[key] !== undefined,
  );

  return (
    <Box sx={{ mt: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => setOpen(!open)}
          disabled={isSelf}
          sx={{ color: colors.slate400 }}
          aria-label="Toggle permissions"
        >
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
        {hasOverrides && (
          <Chip
            label="Custom permissions"
            size="small"
            sx={{
              backgroundColor: colors.warning,
              color: colors.slate700,
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        )}
      </Box>
      <Collapse in={open}>
        <Box
          sx={{
            mt: 1,
            p: 2,
            backgroundColor: colors.slate700,
            borderRadius: "4px",
            border: `1px solid ${colors.slate300}`,
          }}
        >
          {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => (
            <Box key={group} sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.slate400,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {group}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                {keys.map((key) => {
                  const roleDefault = roleDefaults[key];
                  const override = overrides[key];
                  const isOverridden = override !== null && override !== undefined;
                  const effectiveValue = isOverridden ? override : roleDefault;

                  return (
                    <FormControlLabel
                      key={key}
                      control={
                        <Checkbox
                          checked={effectiveValue}
                          onChange={() => handleToggle(key)}
                          size="small"
                          sx={{
                            color: isOverridden ? colors.warning : colors.slate400,
                            "&.Mui-checked": {
                              color: isOverridden ? colors.warning : colors.green400,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant="caption"
                          sx={{
                            color: isOverridden ? colors.warning : colors.slate100,
                            fontWeight: isOverridden ? 600 : 400,
                          }}
                        >
                          {PERMISSIONS[key]}
                          {isOverridden && " *"}
                        </Typography>
                      }
                    />
                  );
                })}
              </Box>
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={isPending}
              sx={{
                backgroundColor: colors.green400,
                "&:hover": { backgroundColor: colors.green900 },
              }}
            >
              {isPending ? "Saving..." : "Save Permissions"}
            </Button>
            {hasChanges && (
              <Typography variant="caption" sx={{ color: colors.warning, alignSelf: "center" }}>
                * = overridden from role default
              </Typography>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
