import { Badge, Box, IconButton, Tooltip, Typography } from "@mui/material";
import AddCommentIcon from "@mui/icons-material/AddComment";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import { colors } from "../../styles";
import type { ConversationSummary } from "@/lib/dm-queries";

const GUILD_COLOR = colors.green400;
const WHISPER_COLOR = "#FF80FF";

interface ShoutboxTabBarProps {
  activeTab: string;
  conversations: ConversationSummary[];
  showNewWhisper: boolean;
  privacyLabel: string;
  onSelectGuild: () => void;
  onSelectConversation: (id: string) => void;
  onCloseConversation: (e: React.MouseEvent, id: string) => void;
  onNewWhisper: () => void;
}

export default function ShoutboxTabBar({
  activeTab,
  conversations,
  showNewWhisper,
  privacyLabel,
  onSelectGuild,
  onSelectConversation,
  onCloseConversation,
  onNewWhisper,
}: ShoutboxTabBarProps) {
  const isGuild = activeTab === "guild";

  return (
    <Box
      sx={{
        display: "flex",
        overflowX: "auto",
        borderBottom: `1px solid ${colors.slate300}`,
        backgroundColor: colors.slate600,
        "&::-webkit-scrollbar": { height: 0 },
      }}
    >
      <Box
        onClick={onSelectGuild}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          cursor: "pointer",
          borderRight: `1px solid ${colors.slate300}`,
          backgroundColor: isGuild ? colors.slate700 : colors.slate600,
          "&:hover": { backgroundColor: isGuild ? colors.slate700 : "rgba(255,255,255,0.04)" },
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: isGuild ? GUILD_COLOR : colors.slate400,
            fontFamily: "inherit",
            fontWeight: isGuild ? 700 : 600,
            fontSize: "0.75rem",
          }}
        >
          Guild
        </Typography>
      </Box>

      {conversations.map((conv) => {
        const isActive = conv.id === activeTab;
        return (
          <Box
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              cursor: "pointer",
              borderRight: `1px solid ${colors.slate300}`,
              backgroundColor: isActive ? colors.slate700 : colors.slate600,
              "&:hover": { backgroundColor: isActive ? colors.slate700 : "rgba(255,255,255,0.04)" },
              flexShrink: 0,
            }}
          >
            {conv.isPrivacy && <LockIcon sx={{ fontSize: 12, color: colors.warning }} />}
            <Badge
              color="error"
              variant="dot"
              invisible={conv.unreadCount === 0}
              sx={{ "& .MuiBadge-dot": { width: 6, height: 6 } }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: isActive
                    ? WHISPER_COLOR
                    : conv.unreadCount > 0
                      ? colors.slate100
                      : colors.slate400,
                  fontFamily: "inherit",
                  fontWeight: isActive || conv.unreadCount > 0 ? 700 : 400,
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                {conv.isPrivacy ? privacyLabel : conv.otherUser.alias}
              </Typography>
            </Badge>
            <IconButton
              size="small"
              onClick={(e) => onCloseConversation(e, conv.id)}
              sx={{ color: colors.slate400, p: 0, ml: 0.25, "&:hover": { color: colors.slate100 } }}
            >
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        );
      })}

      {showNewWhisper && (
        <Tooltip title="/w alias message">
          <Box
            onClick={onNewWhisper}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              cursor: "pointer",
              flexShrink: 0,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
            }}
          >
            <AddCommentIcon sx={{ fontSize: 14, color: WHISPER_COLOR }} />
            <Typography
              variant="caption"
              sx={{
                color: WHISPER_COLOR,
                fontFamily: "inherit",
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              /w
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
