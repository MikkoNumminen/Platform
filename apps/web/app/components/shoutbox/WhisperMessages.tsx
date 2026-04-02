import { Box, Tooltip, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { colors } from "../../styles";
import { DevTagIcon } from "./DevTagIcon";
import SystemMessages from "./SystemMessages";
import type { SystemLine } from "./SystemMessages";
import type { DmMessageData, ConversationSummary } from "@/lib/dm-queries";

const WHISPER_COLOR = "#FF80FF";
const WHISPER_LABEL = "#B880CC";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface WhisperMessagesProps {
  messages: DmMessageData[];
  systemMessages: SystemLine[];
  activeConversation: ConversationSummary | undefined;
  otherAlias: string | null;
  emptyText: string;
}

export default function WhisperMessages({
  messages,
  systemMessages,
  activeConversation,
  otherAlias,
  emptyText,
}: WhisperMessagesProps) {
  return (
    <>
      {messages.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
        >
          {emptyText}
        </Typography>
      ) : (
        messages.map((msg) => {
          if (msg.senderRole === "system") {
            return (
              <Box key={msg.id} sx={{ lineHeight: 1.6 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.error, fontFamily: "inherit", fontSize: "0.8rem" }}
                >
                  {msg.message}
                </Typography>
              </Box>
            );
          }
          return (
            <Box key={msg.id} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6 }}>
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
                {formatTime(msg.createdAt)}
              </Typography>
              {msg.isMe ? (
                <>
                  {msg.senderRole === "superuser" && (
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
                  <DevTagIcon tag={msg.senderDevTag} role={msg.senderRole} />
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: WHISPER_LABEL,
                      fontFamily: "inherit",
                      flexShrink: 0,
                      fontSize: "0.8rem",
                    }}
                  >
                    To
                  </Typography>
                  {activeConversation?.otherUser.role === "superuser" && (
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
                  <DevTagIcon
                    tag={activeConversation?.otherUser.developerTag ?? null}
                    role={activeConversation?.otherUser.role}
                  />
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: WHISPER_COLOR,
                      fontFamily: "inherit",
                      fontWeight: 700,
                      flexShrink: 0,
                      fontSize: "0.8rem",
                    }}
                  >
                    [{otherAlias}]:
                  </Typography>
                </>
              ) : (
                <>
                  {msg.senderRole === "superuser" && (
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
                  <DevTagIcon tag={msg.senderDevTag} role={msg.senderRole} />
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: WHISPER_COLOR,
                      fontFamily: "inherit",
                      fontWeight: 700,
                      flexShrink: 0,
                      fontSize: "0.8rem",
                    }}
                  >
                    [{msg.senderAlias}]
                  </Typography>
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: WHISPER_LABEL,
                      fontFamily: "inherit",
                      flexShrink: 0,
                      fontSize: "0.8rem",
                    }}
                  >
                    whispers:
                  </Typography>
                </>
              )}
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: WHISPER_COLOR,
                  fontFamily: "inherit",
                  wordBreak: "break-word",
                  fontSize: "0.8rem",
                }}
              >
                {msg.message}
              </Typography>
            </Box>
          );
        })
      )}
      <SystemMessages lines={systemMessages} keyPrefix="sys-dm" />
    </>
  );
}
