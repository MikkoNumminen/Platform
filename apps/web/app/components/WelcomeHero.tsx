"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { colors } from "../styles";

export default function WelcomeHero() {
  const t = useTranslations("welcome");
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "65vh",
        px: 2,
        position: "relative",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: "relative", maxWidth: 520, width: "100%" }}
      >
        <Card
          sx={{
            border: `1px solid ${colors.green400}`,
            backgroundColor: colors.slate600,
          }}
          elevation={0}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: colors.green400,
                  fontWeight: 700,
                  mb: 2,
                  textAlign: "center",
                }}
              >
                {t("title")}
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Typography
                variant="body1"
                sx={{ color: colors.slate100, mb: 1, textAlign: "center", lineHeight: 1.7 }}
              >
                {t("subtitle")}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.slate400, textAlign: "center", lineHeight: 1.7 }}
              >
                {t("description")}
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    pl: 2,
                    borderLeft: `2px solid ${colors.green400}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: colors.slate100 }}>
                    <strong>1.</strong> {t("step1")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.slate100 }}>
                    <strong>2.</strong> {t("step2")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.slate100 }}>
                    <strong>3.</strong> {t("step3")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.slate100 }}>
                    <strong>4.</strong> {t("step4")}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
