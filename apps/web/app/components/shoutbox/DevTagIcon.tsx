import { Tooltip, Typography } from "@mui/material";
import { DEVELOPER_TAG_ICONS, DEVELOPER_TAG_LABELS } from "@/lib/developer-config";

export function DevTagIcon({ tag, role }: { tag: string | null; role?: string }) {
  if (!tag || !DEVELOPER_TAG_ICONS[tag]) return null;
  if (role === "superuser") return null;
  return (
    <Tooltip title={DEVELOPER_TAG_LABELS[tag] ?? tag} arrow>
      <Typography
        component="span"
        sx={{ fontSize: "0.75rem", cursor: "help", flexShrink: 0, lineHeight: 1 }}
      >
        {DEVELOPER_TAG_ICONS[tag]}
      </Typography>
    </Tooltip>
  );
}
