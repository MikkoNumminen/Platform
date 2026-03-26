"use client";

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

interface SingleSelectProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function SingleSelect({
  label,
  options,
  value,
  onChange,
  error,
}: SingleSelectProps) {
  return (
    <FormControl error={!!error} component="fieldset" fullWidth>
      <FormLabel component="legend" sx={{ mb: 2, fontSize: "1.25rem" }}>
        {label}
      </FormLabel>
      <RadioGroup value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((option) => (
          <FormControlLabel
            key={option}
            value={option}
            control={<Radio />}
            label={option}
            sx={{ mb: 1 }}
          />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
