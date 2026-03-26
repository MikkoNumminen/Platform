"use client";

import { Box, Button, TextField } from "@mui/material";
import { useState } from "react";
import { colors } from "../styles";

export default function ThreadComposer() {
  const [body, setBody] = useState("");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 2,
        borderRadius: "4px",
        border: `1px solid ${colors.slate600}`,
        backgroundColor: colors.slate700,
      }}
    >
      <TextField
        multiline
        minRows={3}
        maxRows={8}
        placeholder="Write a comment..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        variant="outlined"
        fullWidth
        sx={{
          "& .MuiOutlinedInput-root": {
            color: colors.slate100,
            fontSize: "0.9rem",
            "& fieldset": {
              borderColor: colors.slate400,
            },
            "&:hover fieldset": {
              borderColor: colors.slate300,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.green400,
            },
          },
          "& .MuiInputBase-input::placeholder": {
            color: colors.slate400,
            opacity: 1,
          },
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          disabled={body.trim().length === 0}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            backgroundColor: colors.green900,
            color: colors.green400,
            border: `1px solid ${colors.green400}`,
            "&:hover": {
              backgroundColor: colors.green400,
              color: colors.green900,
            },
            "&.Mui-disabled": {
              backgroundColor: colors.slate600,
              color: colors.slate400,
              borderColor: colors.slate400,
            },
          }}
        >
          Post comment
        </Button>
      </Box>
    </Box>
  );
}
