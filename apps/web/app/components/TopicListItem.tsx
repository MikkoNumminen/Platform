import { Box, Chip, Typography } from "@mui/material";
import Link from "next/link";
import PushPinIcon from "@mui/icons-material/PushPin";
import LockIcon from "@mui/icons-material/Lock";
import { colors } from "../styles";

interface TopicListItemProps {
  title: string;
  slug: string;
  forumSlug: string;
  authorName: string;
  createdAt: string;
  pinned: boolean;
  locked: boolean;
}

export default function TopicListItem({
  title,
  slug,
  forumSlug,
  authorName,
  createdAt,
  pinned,
  locked,
}: TopicListItemProps) {
  return (
    <Box
      component={Link}
      href={`/forums/${forumSlug}/${slug}`}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${colors.slate300}`,
        textDecoration: "none",
        "&:hover": {
          backgroundColor: colors.rowHover,
        },
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
          <Typography
            variant="body1"
            sx={{
              color: colors.green400,
              fontWeight: pinned ? 700 : 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
          {pinned && (
            <Chip
              icon={<PushPinIcon sx={{ fontSize: 14 }} />}
              label="Pinned"
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                backgroundColor: colors.info,
                color: colors.slate100,
                "& .MuiChip-icon": { color: colors.slate100 },
              }}
            />
          )}
          {locked && (
            <Chip
              icon={<LockIcon sx={{ fontSize: 14 }} />}
              label="Locked"
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                backgroundColor: colors.warning,
                color: colors.slate700,
                "& .MuiChip-icon": { color: colors.slate700 },
              }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: colors.slate400 }}>
          {authorName} &middot; {createdAt}
        </Typography>
      </Box>
    </Box>
  );
}
