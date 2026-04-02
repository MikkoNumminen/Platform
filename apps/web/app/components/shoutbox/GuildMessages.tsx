import { Box, Tooltip, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { colors } from "../../styles";
import { DevTagIcon } from "./DevTagIcon";
import SystemMessages from "./SystemMessages";
import type { SystemLine } from "./SystemMessages";
import type { ShoutData } from "@/lib/shout-queries";

const GUILD_COLOR = colors.green400;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface GuildMessagesProps {
  shouts: ShoutData[];
  systemMessages: SystemLine[];
  emptyText: string;
}

export default function GuildMessages({ shouts, systemMessages, emptyText }: GuildMessagesProps) {
  return (
    <>
      {shouts.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
        >
          {emptyText}
        </Typography>
      ) : (
        shouts.map((shout) => {
          const isSuperuser = shout.role === "superuser";
          return (
            <Box key={shout.id} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6 }}>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: colors.slate400,
                  fontFamily: "inherit",
                  flexShrink: 0,
                  fontSize: "0.8rem",
                }}
              >
                {formatTime(shout.createdAt)}
              </Typography>
              {isSuperuser && (
                <Tooltip title="Superuser" arrow>
                  <StarIcon
                    sx={{
                      fontSize: 14,
                      color: colors.warning,
                      alignSelf: "flex-start",
                      mt: "3px",
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              )}
              <DevTagIcon tag={shout.developerTag} role={shout.role} />
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: isSuperuser ? colors.warning : GUILD_COLOR,
                  fontFamily: "inherit",
                  fontWeight: 700,
                  flexShrink: 0,
                  fontSize: "0.8rem",
                }}
              >
                &lt;{shout.alias}&gt;
              </Typography>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: colors.slate100,
                  fontFamily: "inherit",
                  wordBreak: "break-word",
                  fontSize: "0.8rem",
                  fontWeight: isSuperuser ? 500 : 400,
                }}
              >
                {shout.message}
              </Typography>
            </Box>
          );
        })
      )}
      <SystemMessages lines={systemMessages} />
    </>
  );
}
