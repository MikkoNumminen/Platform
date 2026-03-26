import { Box, Skeleton } from "@mui/material";
import { colors } from "../styles";

export default function CalendarLoading() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <Skeleton variant="rounded" height={64} sx={{ mb: 1.5, bgcolor: colors.slate600 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Skeleton variant="rounded" width={100} height={36} sx={{ bgcolor: colors.slate600 }} />
        <Skeleton variant="text" width={200} sx={{ bgcolor: colors.slate600 }} />
        <Skeleton variant="rounded" width={100} height={36} sx={{ bgcolor: colors.slate600 }} />
      </Box>
      <Skeleton variant="rounded" height={500} sx={{ bgcolor: colors.slate600 }} />
    </Box>
  );
}
