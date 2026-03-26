import { Box, Skeleton } from "@mui/material";
import { colors } from "../../styles";

export default function BoardLoading() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <Skeleton variant="rounded" height={64} sx={{ mb: 1.5, bgcolor: colors.slate600 }} />
      <Skeleton variant="text" width="60%" sx={{ mb: 2, bgcolor: colors.slate600 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={56} sx={{ bgcolor: colors.slate600 }} />
        ))}
      </Box>
    </Box>
  );
}
