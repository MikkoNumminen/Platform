import { Box, Typography, Button } from "@mui/material";
import { colors } from "../styles";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 3,
        textAlign: "center",
      }}
    >
      {icon && <Box sx={{ color: colors.slate400, mb: 2, fontSize: 48 }}>{icon}</Box>}
      <Typography variant="h6" sx={{ color: colors.slate100, fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: colors.slate400, maxWidth: 400, mb: actionLabel ? 2 : 0 }}
        >
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outlined"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: colors.green400,
            borderColor: colors.green400,
            "&:hover": {
              backgroundColor: colors.green900,
              borderColor: colors.green400,
            },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
