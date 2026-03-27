"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { setAlias } from "@/lib/alias-actions";

export default function SetupAliasPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [alias, setAliasValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session?.user?.alias) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await setAlias(alias);
      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      await update();
      router.replace("/");
    } catch {
      setError("An unexpected error occurred");
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Card sx={{ maxWidth: 440, width: "100%", mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom textAlign="center">
            Choose your alias
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Pick a public display name. This will be shown instead of your real name in all
            community areas.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Alias"
              value={alias}
              onChange={(e) => setAliasValue(e.target.value)}
              fullWidth
              required
              autoFocus
              inputProps={{ minLength: 2, maxLength: 30 }}
              helperText="2-30 characters. Letters, numbers, hyphens, and underscores only."
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting || alias.trim().length < 2}
            >
              {submitting ? "Saving..." : "Set Alias"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
