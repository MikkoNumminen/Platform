"use client";

import { Box, LinearProgress, Typography } from "@mui/material";
import { colors } from "../../styles";

interface SurveyProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function SurveyProgress({ currentStep, totalSteps }: SurveyProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Question {currentStep + 1} of {totalSteps}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        aria-label={`Survey progress: question ${currentStep + 1} of ${totalSteps}`}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.slate600,
          "& .MuiLinearProgress-bar": {
            backgroundColor: colors.green400,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  );
}
