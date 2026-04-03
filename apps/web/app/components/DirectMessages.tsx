"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Badge, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import AddCommentIcon from "@mui/icons-material/AddComment";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import { useTranslations } from "next-intl";
import { colors } from "../styles";
import { sendDirectMessage, startConversation } from "@/lib/dm-actions";
import { getConversationMessages, getDmUsers } from "@/lib/dm-queries";
import { useXpToast } from "./XpToastProvider";
import type { ConversationSummary, DmMessageData } from "@/lib/dm-queries";
import WhisperMessages from "./shoutbox/WhisperMessages";
import UserPicker from "./shoutbox/UserPicker";
import SystemMessages from "./shoutbox/SystemMessages";
import type { SystemLine } from "./shoutbox/SystemMessages";

interface DirectMessagesProps {
  initialConversations: ConversationSummary[];
}

type DmUser = {
  id: string;
  alias: string;
  role: string;
  developerTag: string | null;
};

const CHAT_HEIGHT = 300;

const WELCOME_LINES: SystemLine[] = [
  { label: "[System]", text: "Welcome to private messages." },
  { label: "", text: "" },
  { label: "Commands:", text: "" },
  { label: "/w", text: "alias message — whisper a player" },
  { label: "/whisper", text: "alias message — same as /w" },
  { label: "", text: "" },
];

export default function DirectMessages({ initialConversations }: DirectMessagesProps) {
  const { data: session } = useSession();
  const { onAction } = useXpToast();
  const t = useTranslations("dm");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessageData[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [dmUsers, setDmUsers] = useState<DmUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const ensureUsersLoaded = async () => {
    if (dmUsers.length === 0) {
      setLoadingUsers(true);
      const users = await getDmUsers();
      setDmUsers(users);
      setLoadingUsers(false);
      return users;
    }
    return dmUsers;
  };

  const openConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowNewMessage(false);
    const msgs = await getConversationMessages(conversationId);
    setMessages(msgs);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv && !conv.isPrivacy) setMessage("");
  };

  const closeTab = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleNewMessage = async () => {
    setShowNewMessage(true);
    setActiveConversationId(null);
    setMessages([]);
    await ensureUsersLoaded();
  };

  const handleSelectUser = async (user: DmUser | null) => {
    if (!user) return;
    const existing = conversations.find((c) => c.otherUser.id === user.id);
    if (existing) {
      await openConversation(existing.id);
      return;
    }
    setShowNewMessage(false);
    setActiveConversationId(`new:${user.id}`);
    setMessages([]);
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending || !session?.user) return;

    const trimmed = message.trim();
    const alias = session.user.alias ?? session.user.name ?? "Unknown";
    const role = session.user?.role ?? "user";

    const whisperMatch = trimmed.match(/^\/w(?:hisper)?\s+(\S+)\s+(.+)$/i);
    if (whisperMatch) {
      const targetAlias = whisperMatch[1];
      const whisperMessage = whisperMatch[2];
      const users = await ensureUsersLoaded();
      const targetUser = users.find((u) => u.alias.toLowerCase() === targetAlias.toLowerCase());
      if (!targetUser) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            message: `No player named "${targetAlias}" found.`,
            senderId: "system",
            senderAlias: "System",
            senderRole: "system",
            senderDevTag: null,
            isMe: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setMessage("");
        return;
      }

      const existing = conversations.find((c) => c.otherUser.id === targetUser.id);
      setSending(true);
      setMessage("");

      if (existing) {
        setActiveConversationId(existing.id);
        const optimistic: DmMessageData = {
          id: `temp-${Date.now()}`,
          message: whisperMessage,
          senderId: session.user.id,
          senderAlias: alias,
          senderRole: role,
          senderDevTag: null,
          isMe: true,
          createdAt: new Date().toISOString(),
        };
        if (activeConversationId !== existing.id) {
          const msgs = await getConversationMessages(existing.id);
          setMessages([...msgs, optimistic]);
        } else {
          setMessages((prev) => [...prev, optimistic]);
        }
        const result = await sendDirectMessage(existing.id, whisperMessage);
        if (result?.error) {
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        } else {
          onAction();
          setConversations((prev) =>
            prev.map((c) =>
              c.id === existing.id
                ? { ...c, lastMessage: whisperMessage, lastMessageAt: new Date().toISOString() }
                : c,
            ),
          );
        }
      } else {
        const result = await startConversation(targetUser.id, whisperMessage);
        if (result?.conversationId) {
          onAction();
          setConversations((prev) => [
            {
              id: result.conversationId!,
              otherUser: { ...targetUser, developerTag: null },
              lastMessage: whisperMessage,
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
              isPrivacy: false,
            },
            ...prev,
          ]);
          await openConversation(result.conversationId!);
        }
      }
      setSending(false);
      return;
    }

    if (activeConversationId?.startsWith("new:")) {
      const otherUserId = activeConversationId.slice(4);
      setSending(true);
      setMessage("");
      const result = await startConversation(otherUserId, trimmed);
      if (result?.conversationId) {
        onAction();
        await openConversation(result.conversationId);
        const otherUser = dmUsers.find((u) => u.id === otherUserId);
        setConversations((prev) => [
          {
            id: result.conversationId!,
            otherUser: otherUser
              ? { ...otherUser, developerTag: null }
              : { id: otherUserId, alias: "Unknown", role: "user", developerTag: null },
            lastMessage: trimmed,
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            isPrivacy: false,
          },
          ...prev,
        ]);
      }
      setSending(false);
      return;
    }

    if (!activeConversationId) return;

    const optimistic: DmMessageData = {
      id: `temp-${Date.now()}`,
      message: trimmed,
      senderId: session.user.id,
      senderAlias: alias,
      senderRole: role,
      senderDevTag: null,
      isMe: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessage("");
    setSending(true);
    const result = await sendDirectMessage(activeConversationId, trimmed);
    if (result?.error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } else {
      onAction();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: trimmed, lastMessageAt: new Date().toISOString() }
            : c,
        ),
      );
    }
    setSending(false);
  };

  const otherAlias = activeConversation?.isPrivacy
    ? t("privacy")
    : (activeConversation?.otherUser.alias ??
      (activeConversationId?.startsWith("new:")
        ? (dmUsers.find((u) => u.id === activeConversationId?.slice(4))?.alias ?? "...")
        : null));

  const welcomeLines: SystemLine[] = [
    ...WELCOME_LINES,
    conversations.length > 0
      ? { label: "Tip:", text: "Click a tab above to open a conversation." }
      : { label: "Tip:", text: "Click + to start a new conversation." },
  ];

  return (
    <Box
      sx={{
        backgroundColor: colors.slate700,
        border: `1px solid ${colors.slate300}`,
        borderRadius: "4px",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${colors.slate300}`,
          backgroundColor: colors.slate600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: colors.slate400, fontFamily: "inherit", fontWeight: 600 }}
        >
          {t("title")}
        </Typography>
        {session?.user && (
          <Tooltip title="/w alias message">
            <IconButton
              size="small"
              onClick={handleNewMessage}
              aria-label="New message"
              sx={{ color: colors.slate400, p: 0.25 }}
            >
              <AddCommentIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Conversation tabs */}
      {conversations.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            borderBottom: `1px solid ${colors.slate300}`,
            "&::-webkit-scrollbar": { height: 0 },
          }}
        >
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <Box
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  cursor: "pointer",
                  borderRight: `1px solid ${colors.slate300}`,
                  backgroundColor: isActive ? colors.slate700 : colors.slate600,
                  "&:hover": {
                    backgroundColor: isActive ? colors.slate700 : "rgba(255,255,255,0.04)",
                  },
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
                        ? colors.whisper
                        : conv.unreadCount > 0
                          ? colors.slate100
                          : colors.slate400,
                      fontFamily: "inherit",
                      fontWeight: isActive || conv.unreadCount > 0 ? 700 : 400,
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conv.isPrivacy ? t("privacy") : conv.otherUser.alias}
                  </Typography>
                </Badge>
                <IconButton
                  size="small"
                  onClick={(e) => closeTab(e, conv.id)}
                  aria-label={`Close ${conv.isPrivacy ? t("privacy") : conv.otherUser.alias} tab`}
                  sx={{
                    color: colors.slate400,
                    p: 0,
                    ml: 0.25,
                    "&:hover": { color: colors.slate100 },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Content area */}
      <Box
        ref={scrollRef}
        sx={{
          height: CHAT_HEIGHT,
          overflowY: "auto",
          px: 1.5,
          py: 1,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: colors.slate400, borderRadius: 3 },
        }}
      >
        {showNewMessage ? (
          <UserPicker
            users={dmUsers}
            loading={loadingUsers}
            placeholder={t("selectUser")}
            onSelect={handleSelectUser}
          />
        ) : activeConversationId ? (
          <WhisperMessages
            messages={messages}
            systemMessages={[]}
            activeConversation={activeConversation}
            otherAlias={otherAlias}
            emptyText={t("empty")}
          />
        ) : (
          <SystemMessages lines={welcomeLines} keyPrefix="welcome" />
        )}
      </Box>

      {/* Input */}
      {session?.user && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderTop: `1px solid ${colors.slate300}`,
            px: 1.5,
            py: 1,
            backgroundColor: colors.slate700,
          }}
        >
          <TextField
            inputRef={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={activeConversationId ? t("placeholder") : "/w alias message"}
            size="small"
            fullWidth
            autoComplete="off"
            inputProps={{ maxLength: 500 }}
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.85rem",
                backgroundColor: colors.slate700,
                color: colors.slate100,
              },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.slate300 },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
