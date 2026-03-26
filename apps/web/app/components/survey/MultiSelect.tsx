"use client";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
} from "@mui/material";

interface MultiSelectProps {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export default function MultiSelect({ label, options, value, onChange, error }: MultiSelectProps) {
  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <FormControl error={!!error} component="fieldset" fullWidth>
      <FormLabel component="legend" sx={{ mb: 2, fontSize: "1.25rem" }}>
        {label}
      </FormLabel>
      <FormGroup aria-label={label}>
        {options.map((option) => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox checked={value.includes(option)} onChange={() => handleToggle(option)} />
            }
            label={option}
            sx={{ mb: 0.5 }}
          />
        ))}
      </FormGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
