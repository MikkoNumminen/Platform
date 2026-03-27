"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from "@mui/material";
import TopBar from "../components/TopBar";
import { createIssueReport } from "@/lib/issue-actions";

export default function ReportIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await createIssueReport(title, description, url || undefined);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <>
        <TopBar title="Report Issue" backHref="/" />
        <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 1, sm: 2 }, mt: 4, textAlign: "center" }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Thanks! Your report has been submitted.
          </Alert>
          <Button variant="outlined" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <TopBar title="Report Issue" backHref="/" />
      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Found a bug or something broken? Let us know and we&apos;ll fix it.
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                label="What's wrong?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                inputProps={{ maxLength: 200 }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Describe the issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                multiline
                rows={4}
                inputProps={{ maxLength: 2000 }}
                helperText="What happened? What did you expect?"
                sx={{ mb: 2 }}
              />

              <TextField
                label="Page URL (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                fullWidth
                placeholder="e.g. /boards/general"
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting || !title.trim() || !description.trim()}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
