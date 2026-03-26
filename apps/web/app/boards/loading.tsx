import { Box, Skeleton } from "@mui/material";
import { colors } from "../styles";

export default function BoardsLoading() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <Skeleton variant="rounded" height={64} sx={{ mb: 1.5, bgcolor: colors.slate600 }} />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Skeleton variant="rounded" width={120} height={36} sx={{ bgcolor: colors.slate600 }} />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={140} sx={{ bgcolor: colors.slate600 }} />
        ))}
      </Box>
    </Box>
  );
}
