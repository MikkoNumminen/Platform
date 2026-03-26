import { Box, Chip, Typography } from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import Link from "next/link";
import { colors } from "../styles";

interface PostListItemProps {
  title: string;
  slug: string;
  authorName: string;
  date: string;
  pinned: boolean;
  href: string;
}

export default function PostListItem({
  title,
  authorName,
  date,
  pinned,
  href,
}: PostListItemProps) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 2,
        py: 1.5,
        borderRadius: "4px",
        border: `1px solid ${colors.slate300}`,
        backgroundColor: colors.slate600,
        textDecoration: "none",
        transition: "background-color 0.15s ease",
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
              color: colors.slate100,
              fontWeight: pinned ? 600 : 400,
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
                backgroundColor: colors.green900,
                color: colors.green400,
                "& .MuiChip-icon": {
                  color: colors.green400,
                },
              }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: colors.slate400 }}>
          {authorName} &middot; {date}
        </Typography>
      </Box>
    </Box>
  );
}
