import { Box, Typography } from "@mui/material";
import { colors } from "../../styles";

interface ResultsBarChartProps {
  title: string;
  items: Array<{ label: string; count: number }>;
}

export default function ResultsBarChart({ title, items }: ResultsBarChartProps) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No responses yet
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {items.map((item) => (
            <Box key={item.label}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {item.label}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    height: 24,
                    width: `${(item.count / maxCount) * 100}%`,
                    minWidth: 4,
                    backgroundColor: colors.green400,
                    borderRadius: 1,
                    transition: "width 0.3s ease",
                  }}
                  role="meter"
                  aria-label={`${item.label}: ${item.count}`}
                  aria-valuenow={item.count}
                  aria-valuemin={0}
                  aria-valuemax={maxCount}
                />
                <Typography variant="body2" fontWeight="bold">
                  {item.count}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
