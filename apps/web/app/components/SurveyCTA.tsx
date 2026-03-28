"use client";

import { Button, Card, CardContent, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { colors } from "../styles";

export default function SurveyCTA() {
  const t = useTranslations("survey.cta");
  return (
    <Card
      data-tutorial="survey-cta"
      sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 4,
        border: `1px solid ${colors.green400}`,
      }}
    >
      <CardContent sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          {t("heading")}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t("description")}
        </Typography>
        <Button
          variant="contained"
          size="large"
          href="/survey"
          sx={{
            backgroundColor: colors.green400,
            "&:hover": { backgroundColor: colors.green900 },
          }}
        >
          {t("button")}
        </Button>
      </CardContent>
    </Card>
  );
}
