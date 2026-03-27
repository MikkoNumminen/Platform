"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { colors } from "../styles";

export default function WelcomeHero() {
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
        {/* Arrow pointing up-right toward Sign In button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          style={{
            position: "absolute",
            top: -80,
            right: -200,
          }}
        >
          <motion.svg
            width="250"
            height="120"
            viewBox="0 0 250 120"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <motion.path
              d="M 10 115 Q 60 100 120 70 Q 180 40 230 15"
              stroke="var(--platform-green400)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 1.2, ease: "easeInOut" }}
            />
            <motion.path
              d="M 222 8 L 232 14 L 224 22"
              stroke="var(--platform-green400)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 2.2 }}
            />
          </motion.svg>
        </motion.div>

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
                Welcome
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
                This is a private community platform.
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.slate400, textAlign: "center", lineHeight: 1.7 }}
              >
                Sign in to get started. After signing in, you&apos;ll be asked to complete a quick
                survey. An admin will then review and approve your account.
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
                    <strong>1.</strong> Sign in with Google or GitHub
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.slate100 }}>
                    <strong>2.</strong> Choose your alias
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.slate100 }}>
                    <strong>3.</strong> Take the community survey
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.slate100 }}>
                    <strong>4.</strong> Wait for admin approval
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
