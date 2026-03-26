"use client";

import { Box, Button, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { colors } from "../../styles";

export default function SurveyThankYou() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: 6,
      }}
    >
      <CheckCircleOutlineIcon
        sx={{
          fontSize: 80,
          color: colors.green400,
          mb: 2,
          animation: "fadeInScale 0.5s ease-out",
          "@keyframes fadeInScale": {
            "0%": { opacity: 0, transform: "scale(0.5)" },
            "100%": { opacity: 1, transform: "scale(1)" },
          },
        }}
      />
      <Typography variant="h4" gutterBottom>
        Thank you!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your feedback will help us build something great.
      </Typography>
      <Button variant="outlined" href="/">
        Back to home
      </Button>
    </Box>
  );
}
