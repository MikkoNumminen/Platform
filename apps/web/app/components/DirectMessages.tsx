"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Autocomplete,
  Badge,
  Box,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCommentIcon from "@mui/icons-material/AddComment";
import LockIcon from "@mui/icons-material/Lock";
import StarIcon from "@mui/icons-material/Star";
import { useTranslations } from "next-intl";
import { colors } from "../styles";
import { sendDirectMessage, startConversation } from "@/lib/dm-actions";
import { getConversationMessages, getDmUsers } from "@/lib/dm-queries";
import { useXpToast } from "./XpToastProvider";
import type { ConversationSummary, DmMessageData } from "@/lib/dm-queries";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface DirectMessagesProps {
  initialConversations: ConversationSummary[];
}

type DmUser = { id: string; alias: string; role: string };

export default function DirectMessages({ initialConversations }: DirectMessagesProps) {
  const { data: session } = useSession();
  const { onAction } = useXpToast();
  const t = useTranslations("dm");
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const openConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowNewMessage(false);
    const msgs = await getConversationMessages(conversationId);
    setMessages(msgs);
    // Clear unread count locally
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const handleBack = () => {
    setActiveConversationId(null);
    setMessages([]);
    setShowNewMessage(false);
  };

  const handleNewMessage = async () => {
    setShowNewMessage(true);
    setActiveConversationId(null);
    setMessages([]);
    if (dmUsers.length === 0) {
      setLoadingUsers(true);
      const users = await getDmUsers();
      setDmUsers(users);
      setLoadingUsers(false);
    }
  };

  const handleSelectUser = async (user: DmUser | null) => {
    if (!user) return;
    // Check if conversation already exists
    const existing = conversations.find((c) => c.otherUser.id === user.id);
    if (existing) {
      await openConversation(existing.id);
      return;
    }
    // Show empty chat — first message will create the conversation
    setShowNewMessage(false);
    setActiveConversationId(`new:${user.id}`);
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending || !session?.user) return;

    const trimmed = message.trim();
    const alias = session.user.alias ?? session.user.name ?? "Unknown";
    const role = (session.user as { role?: string })?.role ?? "user";

    if (activeConversationId?.startsWith("new:")) {
      // Starting a new conversation
      const otherUserId = activeConversationId.slice(4);
      setSending(true);
      setMessage("");
      const result = await startConversation(otherUserId, trimmed);
      if (result?.conversationId) {
        onAction();
        await openConversation(result.conversationId);
        // Refresh conversations list
        setConversations((prev) => {
          const otherUser = dmUsers.find((u) => u.id === otherUserId);
          return [
            {
              id: result.conversationId!,
              otherUser: otherUser ?? { id: otherUserId, alias: "Unknown", role: "user" },
              lastMessage: trimmed,
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
              isPrivacy: false,
            },
            ...prev,
          ];
        });
      }
      setSending(false);
      return;
    }

    if (!activeConversationId) return;

    // Optimistic update
    const optimistic: DmMessageData = {
      id: `temp-${Date.now()}`,
      message: trimmed,
      senderId: session.user.id,
      senderAlias: alias,
      senderRole: role,
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
      // Update conversation list
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

  // ── Render ──────────────────────────────────────────────────────────────

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {(activeConversationId || showNewMessage) && (
            <IconButton size="small" onClick={handleBack} sx={{ color: colors.slate400, p: 0.25 }}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <Typography
            variant="caption"
            sx={{ color: colors.slate400, fontFamily: "inherit", fontWeight: 600 }}
          >
            {activeConversation?.isPrivacy
              ? t("privacy")
              : activeConversation
                ? activeConversation.otherUser.alias
                : showNewMessage
                  ? t("newMessage")
                  : t("title")}
          </Typography>
          {activeConversation?.isPrivacy && (
            <LockIcon sx={{ fontSize: 14, color: colors.warning, ml: 0.5 }} />
          )}
        </Box>
        {!activeConversationId && !showNewMessage && session?.user && (
          <Tooltip title={t("newMessage")}>
            <IconButton
              size="small"
              onClick={handleNewMessage}
              sx={{ color: colors.slate400, p: 0.25 }}
            >
              <AddCommentIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Content area */}
      <Box
        ref={scrollRef}
        sx={{
          height: 300,
          overflowY: "auto",
          px: 1.5,
          py: 1,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: colors.slate400,
            borderRadius: 3,
          },
        }}
      >
        {showNewMessage ? (
          // User picker
          <Box sx={{ py: 1 }}>
            <Autocomplete
              options={dmUsers}
              getOptionLabel={(o) => o.alias}
              loading={loadingUsers}
              onChange={(_, val) => handleSelectUser(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t("selectUser")}
                  size="small"
                  autoFocus
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.85rem",
                      backgroundColor: colors.slate700,
                      color: colors.slate100,
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.slate300,
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {option.role === "superuser" && (
                      <StarIcon sx={{ fontSize: 14, color: colors.warning }} />
                    )}
                    <Typography variant="body2">{option.alias}</Typography>
                    <Typography variant="caption" sx={{ color: colors.slate400 }}>
                      {option.role}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Box>
        ) : activeConversationId ? (
          // Chat view
          messages.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
            >
              {t("empty")}
            </Typography>
          ) : (
            messages.map((msg) => (
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
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: msg.isMe
                      ? colors.cyan400
                      : msg.senderRole === "superuser"
                        ? colors.warning
                        : colors.green400,
                    fontFamily: "inherit",
                    fontWeight: 700,
                    flexShrink: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  &lt;{msg.senderAlias}&gt;
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: colors.slate100,
                    fontFamily: "inherit",
                    wordBreak: "break-word",
                    fontSize: "0.8rem",
                  }}
                >
                  {msg.message}
                </Typography>
              </Box>
            ))
          )
        ) : // Inbox view
        conversations.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
          >
            {t("empty")}
          </Typography>
        ) : (
          conversations.map((conv) => (
            <Box
              key={conv.id}
              onClick={() => openConversation(conv.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 0.75,
                px: 0.5,
                cursor: "pointer",
                borderRadius: 1,
                "&:hover": { backgroundColor: colors.slate600 },
              }}
            >
              {conv.isPrivacy && (
                <LockIcon sx={{ fontSize: 14, color: colors.warning, flexShrink: 0 }} />
              )}
              <Badge
                color="error"
                variant="dot"
                invisible={conv.unreadCount === 0}
                sx={{ "& .MuiBadge-dot": { width: 8, height: 8 } }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: conv.unreadCount > 0 ? colors.slate100 : colors.green400,
                    fontFamily: "inherit",
                    fontWeight: conv.unreadCount > 0 ? 700 : 600,
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {conv.isPrivacy ? t("privacy") : conv.otherUser.alias}
                </Typography>
              </Badge>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  color: colors.slate400,
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {conv.lastMessage ?? "..."}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.slate400,
                  fontFamily: "inherit",
                  fontSize: "0.7rem",
                  flexShrink: 0,
                }}
              >
                {formatRelative(conv.lastMessageAt)}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      {/* Input field */}
      {session?.user && activeConversationId && (
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("placeholder")}
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
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.slate300,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
