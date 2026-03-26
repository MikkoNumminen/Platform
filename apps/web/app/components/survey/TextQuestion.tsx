"use client";

import { Box, TextField, Typography } from "@mui/material";

interface TextQuestionProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength: number;
  required?: boolean;
}

export default function TextQuestion({
  label,
  placeholder,
  value,
  onChange,
  error,
  maxLength,
  required,
}: TextQuestionProps) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {label}
        {required && " *"}
      </Typography>
      <TextField
        multiline
        minRows={3}
        maxRows={6}
        fullWidth
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            onChange(e.target.value);
          }
        }}
        error={!!error}
        helperText={error || `${value.length}/${maxLength}`}
        inputProps={{
          "aria-label": label,
          maxLength,
        }}
      />
    </Box>
  );
}
