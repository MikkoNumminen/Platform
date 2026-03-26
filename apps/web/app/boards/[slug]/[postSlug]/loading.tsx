import { Box, Skeleton } from "@mui/material";
import { colors } from "../../../styles";

export default function PostLoading() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <Skeleton
        variant="rounded"
        height={64}
        sx={{ mb: 1.5, bgcolor: colors.slate600 }}
      />
      <Skeleton
        variant="rounded"
        height={200}
        sx={{ mb: 3, bgcolor: colors.slate600 }}
      />
      <Skeleton
        variant="text"
        width={160}
        sx={{ mb: 2, bgcolor: colors.slate600 }}
      />
      <Skeleton
        variant="rounded"
        height={100}
        sx={{ mb: 2, bgcolor: colors.slate600 }}
      />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={80}
          sx={{ mb: 1, bgcolor: colors.slate600 }}
        />
      ))}
    </Box>
  );
}
