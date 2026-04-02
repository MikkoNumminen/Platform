import { Box, Typography } from "@mui/material";
import { colors } from "../../styles";

const WHISPER_COLOR = "#FF80FF";

export interface SystemLine {
  label: string;
  text: string;
}

interface SystemMessagesProps {
  lines: SystemLine[];
  keyPrefix?: string;
}

export default function SystemMessages({ lines, keyPrefix = "sys" }: SystemMessagesProps) {
  return (
    <>
      {lines.map((line, i) =>
        !line.label && !line.text ? (
          <Box key={`${keyPrefix}-${i}`} sx={{ height: 8 }} />
        ) : (
          <Box key={`${keyPrefix}-${i}`} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6 }}>
            <Typography
              component="span"
              variant="body2"
              sx={{
                color:
                  line.label === "[System]" || line.label === "Tip:"
                    ? colors.warning
                    : WHISPER_COLOR,
                fontFamily: "inherit",
                fontWeight: 700,
                flexShrink: 0,
                fontSize: "0.75rem",
              }}
            >
              {line.label}
            </Typography>
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: line.label === "Tip:" ? colors.slate400 : colors.slate100,
                fontFamily: "inherit",
                fontSize: "0.75rem",
              }}
            >
              {line.text}
            </Typography>
          </Box>
        ),
      )}
    </>
  );
}
