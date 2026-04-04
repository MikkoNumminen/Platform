import { Box, Typography } from "@mui/material";
import { colors } from "../../../styles";

const ICON_OPTIONS = [
  // Goats
  "\uD83D\uDC10",
  "\uD83D\uDC11",
  "\uD83D\uDC0F",
  // Animals
  "\uD83E\uDD81",
  "\uD83D\uDC3A",
  "\uD83E\uDD8A",
  "\uD83D\uDC3B",
  "\uD83D\uDC38",
  "\uD83D\uDC14",
  "\uD83D\uDC27",
  "\uD83E\uDD85",
  "\uD83D\uDC09",
  "\uD83E\uDD84",
  // Combat / RPG
  "\u2694\uFE0F",
  "\uD83D\uDEE1\uFE0F",
  "\uD83C\uDFF9",
  "\uD83D\uDDE1\uFE0F",
  "\uD83D\uDD2E",
  "\uD83D\uDC8E",
  "\uD83D\uDC51",
  "\uD83C\uDFC6",
  "\uD83C\uDFAF",
  "\uD83D\uDD25",
  // Fun / Stupid
  "\uD83D\uDCA9",
  "\uD83E\uDD21",
  "\uD83D\uDC7B",
  "\uD83D\uDC80",
  "\uD83E\uDDE0",
  "\uD83D\uDC41\uFE0F",
  "\uD83E\uDEE1",
  "\uD83E\uDD0C",
  "\uD83E\uDEE0",
  "\uD83E\uDD2F",
  // Achievement vibes
  "\u2B50",
  "\uD83C\uDF1F",
  "\u2728",
  "\uD83C\uDF89",
  "\uD83C\uDF8A",
  "\uD83C\uDFC5",
  "\uD83E\uDD47",
  "\uD83E\uDD48",
  "\uD83E\uDD49",
  "\uD83D\uDCAB",
  // Nature / misc
  "\uD83C\uDF3F",
  "\uD83C\uDF40",
  "\uD83C\uDF19",
  "\u2600\uFE0F",
  "\uD83C\uDF0A",
  "\uD83D\uDDFB",
  "\uD83E\uDDED",
  "\uD83D\uDCDC",
  "\uD83D\uDCCB",
  "\uD83C\uDFAA",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: colors.slate400, mb: 0.5, display: "block" }}>
        Icon
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
        {ICON_OPTIONS.map((emoji) => (
          <Box
            key={emoji}
            onClick={() => onChange(emoji)}
            sx={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              borderRadius: 1,
              cursor: "pointer",
              border:
                value === emoji ? `2px solid ${colors.green400}` : `1px solid ${colors.slate400}`,
              backgroundColor: value === emoji ? colors.accentBgSubtle : "transparent",
              "&:hover": { backgroundColor: colors.hoverOverlay },
            }}
          >
            {emoji}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
