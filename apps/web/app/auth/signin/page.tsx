"use client";

import { signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const t = useTranslations("auth");
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom textAlign="center">
            {t("signInTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            {t("signInTitle")}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              {t("signInGoogle")}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => signIn("github", { callbackUrl: "/" })}
            >
              {t("signInGithub")}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
