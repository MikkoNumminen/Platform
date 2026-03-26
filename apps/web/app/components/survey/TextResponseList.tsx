import { Box, Paper, Typography } from "@mui/material";

interface TextResponseListProps {
  title: string;
  responses: Array<{ text: string; submittedAt: Date }>;
}

export default function TextResponseList({ title, responses }: TextResponseListProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title} ({responses.length})
      </Typography>
      {responses.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No responses yet
        </Typography>
      ) : (
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {responses.map((response, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Typography variant="body2">{response.text}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {new Date(response.submittedAt).toLocaleDateString()}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
