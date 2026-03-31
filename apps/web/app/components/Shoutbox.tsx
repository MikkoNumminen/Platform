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
import AddCommentIcon from "@mui/icons-material/AddComment";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import StarIcon from "@mui/icons-material/Star";
import { useTranslations } from "next-intl";
import { colors } from "../styles";
import { createShout } from "@/lib/shout-actions";
import { sendDirectMessage, startConversation } from "@/lib/dm-actions";
import { getConversationMessages, getDmUsers } from "@/lib/dm-queries";
import type { ShoutData } from "@/lib/shout-queries";
import type { ConversationSummary, DmMessageData } from "@/lib/dm-queries";
import { useXpToast } from "./XpToastProvider";
import { emitTutorialEvent } from "./TutorialProvider";
import { DEVELOPER_TAG_ICONS, DEVELOPER_TAG_LABELS } from "@/lib/developer-config";

function DevTagIcon({ tag }: { tag: string | null }) {
  if (!tag || !DEVELOPER_TAG_ICONS[tag]) return null;
  return (
    <Tooltip title={DEVELOPER_TAG_LABELS[tag] ?? tag} arrow>
      <Typography
        component="span"
        sx={{ fontSize: "0.75rem", cursor: "help", flexShrink: 0, lineHeight: 1 }}
      >
        {DEVELOPER_TAG_ICONS[tag]}
      </Typography>
    </Tooltip>
  );
}

// WoW channel colors
const GUILD_COLOR = colors.green400;
const WHISPER_COLOR = "#FF80FF";
const WHISPER_LABEL = "#B880CC";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const DEMO_REACTIONS: Array<{ alias: string; message: string; delayMs: number }> = [
  { alias: "Valtava", message: "Welcome to the community! 🐐", delayMs: 1500 },
  { alias: "Perserkki", message: "Hey! Nice to see a new face 👋", delayMs: 3000 },
  { alias: "Turo", message: "Check out the quests, you can earn XP!", delayMs: 5000 },
];

interface ShoutboxProps {
  initialShouts: ShoutData[];
  initialConversations: ConversationSummary[];
}

type DmUser = { id: string; alias: string; role: string };

const SYSTEM_MOTD = [{ label: "[System]", text: "Welcome. Type /help for commands." }];

const _HELP_LINES = [
  { label: "[System]", text: "Available commands:" },
  { label: "/w", text: "alias message — whisper a player" },
  { label: "/whisper", text: "alias message — same as /w" },
  { label: "/help", text: "— show this help (only you can see this)" },
  { label: "", text: "" },
  { label: "Tip:", text: "Tab key autocompletes the alias when typing /w" },
];

interface SystemLine {
  label: string;
  text: string;
}

// "guild" = shoutbox, string ID = conversation, "new:userId" = new DM
type ActiveTab = "guild" | string;

export default function Shoutbox({ initialShouts, initialConversations }: ShoutboxProps) {
  const { data: session } = useSession();
  const { onAction } = useXpToast();
  const t = useTranslations("shoutbox");
  const tDm = useTranslations("dm");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Guild state
  const [shouts, setShouts] = useState(initialShouts);
  const [demoReacted, setDemoReacted] = useState(false);
  const isDemo = Boolean((session?.user as { demoSessionId?: string })?.demoSessionId);

  // DM state
  const [conversations, setConversations] = useState(initialConversations);
  const [dmMessages, setDmMessages] = useState<DmMessageData[]>([]);
  const [dmUsers, setDmUsers] = useState<DmUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  // Shared state
  const [activeTab, setActiveTab] = useState<ActiveTab>("guild");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [whisperSuggestions, setWhisperSuggestions] = useState<DmUser[]>([]);
  const [localSystemMsgs, setLocalSystemMsgs] = useState<SystemLine[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeTab);
  const isGuild = activeTab === "guild";
  const isDmTab = !isGuild && activeTab !== "picker";

  useEffect(() => {
    setShouts(initialShouts);
  }, [initialShouts]);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shouts, dmMessages, activeTab]);

  // ── DM helpers ──────────────────────────────────────────────────────────

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
    setActiveTab(conversationId);
    setShowUserPicker(false);
    setLocalSystemMsgs([]);
    const msgs = await getConversationMessages(conversationId);
    setDmMessages(msgs);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const closeConvTab = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (activeTab === conversationId) {
      setActiveTab("guild");
      setDmMessages([]);
    }
  };

  const handleNewWhisper = async () => {
    setShowUserPicker(true);
    setActiveTab("picker");
    setDmMessages([]);
    await ensureUsersLoaded();
  };

  const handleSelectUser = async (user: DmUser | null) => {
    if (!user) return;
    const existing = conversations.find((c) => c.otherUser.id === user.id);
    if (existing) {
      await openConversation(existing.id);
      return;
    }
    setShowUserPicker(false);
    setActiveTab(`new:${user.id}`);
    setDmMessages([]);
    setMessage("");
    setWhisperSuggestions([]);
  };

  // ── Input change with /w autocomplete ────────────────────────────────────

  const handleMessageChange = async (val: string) => {
    setMessage(val);
    // Detect /w <partial> pattern (no space after alias = still typing the name)
    const partialMatch = val.match(/^\/w(?:hisper)?\s+(\S*)$/i);
    if (partialMatch && partialMatch[1].length >= 1) {
      const partial = partialMatch[1].toLowerCase();
      const users = await ensureUsersLoaded();
      const matches = users.filter((u) => u.alias.toLowerCase().startsWith(partial)).slice(0, 5);
      setWhisperSuggestions(matches);
      setSuggestionIndex(0);
    } else {
      setWhisperSuggestions([]);
      setSuggestionIndex(0);
    }
  };

  const applySuggestion = (alias: string) => {
    // Replace the partial alias with the full one and add a space
    const newMsg = message.replace(/^(\/w(?:hisper)?\s+)\S*$/i, `$1${alias} `);
    setMessage(newMsg);
    setWhisperSuggestions([]);
    setSuggestionIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (whisperSuggestions.length === 0) return;

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab cycles backwards
        setSuggestionIndex((i) => (i - 1 + whisperSuggestions.length) % whisperSuggestions.length);
      } else {
        // Tab applies current suggestion or cycles forward
        applySuggestion(whisperSuggestions[suggestionIndex].alias);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestionIndex((i) => (i - 1 + whisperSuggestions.length) % whisperSuggestions.length);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestionIndex((i) => (i + 1) % whisperSuggestions.length);
    } else if (e.key === "Escape") {
      setWhisperSuggestions([]);
      setSuggestionIndex(0);
    }
  };

  // ── Submit handler ──────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending || !session?.user) return;

    const trimmed = message.trim();
    const alias = session.user.alias ?? session.user.name ?? "Unknown";
    const role = (session.user as { role?: string })?.role ?? "user";

    // /help — client-only, shows commands to the user
    if (/^\/help$/i.test(trimmed)) {
      setLocalSystemMsgs((prev) => [...prev, ...HELP_LINES]);
      setMessage("");
      setWhisperSuggestions([]);
      return;
    }

    // Parse /w command from any tab
    const whisperMatch = trimmed.match(/^\/w(?:hisper)?\s+(\S+)\s+(.+)$/i);
    if (whisperMatch) {
      const targetAlias = whisperMatch[1];
      const whisperMessage = whisperMatch[2];

      const users = await ensureUsersLoaded();
      const targetUser = users.find((u) => u.alias.toLowerCase() === targetAlias.toLowerCase());
      if (!targetUser) {
        setDmMessages((prev) => [
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
        setWhisperSuggestions([]);
        if (isGuild) setActiveTab("guild"); // stay on guild but show error won't work — switch to a temp view
        return;
      }

      const existing = conversations.find((c) => c.otherUser.id === targetUser.id);
      setSending(true);
      setMessage("");
      setWhisperSuggestions([]);

      if (existing) {
        setActiveTab(existing.id);
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
        if (activeTab !== existing.id) {
          const msgs = await getConversationMessages(existing.id);
          setDmMessages([...msgs, optimistic]);
        } else {
          setDmMessages((prev) => [...prev, optimistic]);
        }
        const result = await sendDirectMessage(existing.id, whisperMessage);
        if (result?.error) {
          setDmMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
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

    // Guild tab: send shout
    if (isGuild) {
      const optimistic: ShoutData = {
        id: `temp-${Date.now()}`,
        message: trimmed,
        alias,
        role,
        developerTag: null,
        createdAt: new Date().toISOString(),
      };
      setShouts((prev) => [...prev, optimistic]);
      setMessage("");
      setWhisperSuggestions([]);
      setSending(true);

      const result = await createShout(trimmed);
      if (result?.error) {
        setShouts((prev) => prev.filter((s) => s.id !== optimistic.id));
      } else {
        onAction();
        emitTutorialEvent("write_comment");
        if (isDemo && !demoReacted) {
          setDemoReacted(true);
          for (const reaction of DEMO_REACTIONS) {
            setTimeout(() => {
              setShouts((prev) => [
                ...prev,
                {
                  id: `demo-${Date.now()}-${reaction.alias}`,
                  message: reaction.message,
                  alias: reaction.alias,
                  role: "user",
                  developerTag: null,
                  createdAt: new Date().toISOString(),
                },
              ]);
            }, reaction.delayMs);
          }
        }
      }
      setSending(false);
      return;
    }

    // New conversation
    if (activeTab.startsWith("new:")) {
      const otherUserId = activeTab.slice(4);
      setSending(true);
      setMessage("");
      setWhisperSuggestions([]);
      const result = await startConversation(otherUserId, trimmed);
      if (result?.conversationId) {
        onAction();
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
        await openConversation(result.conversationId!);
      }
      setSending(false);
      return;
    }

    // Existing DM conversation
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
    setDmMessages((prev) => [...prev, optimistic]);
    setMessage("");
    setWhisperSuggestions([]);
    setSending(true);

    const result = await sendDirectMessage(activeTab, trimmed);
    if (result?.error) {
      setDmMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } else {
      onAction();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeTab
            ? { ...c, lastMessage: trimmed, lastMessageAt: new Date().toISOString() }
            : c,
        ),
      );
    }
    setSending(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  const otherAlias = activeConversation?.isPrivacy
    ? tDm("privacy")
    : (activeConversation?.otherUser.alias ??
      (activeTab.startsWith("new:")
        ? (dmUsers.find((u) => u.id === activeTab.slice(4))?.alias ?? "...")
        : null));

  return (
    <Box
      data-tutorial="shoutbox"
      sx={{
        backgroundColor: colors.slate700,
        border: `1px solid ${colors.slate300}`,
        borderRadius: "4px",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <Box
        sx={{
          display: "flex",
          overflowX: "auto",
          borderBottom: `1px solid ${colors.slate300}`,
          backgroundColor: colors.slate600,
          "&::-webkit-scrollbar": { height: 0 },
        }}
      >
        {/* Guild tab */}
        <Box
          onClick={() => {
            setActiveTab("guild");
            setShowUserPicker(false);
          }}
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

        {/* DM conversation tabs */}
        {conversations.map((conv) => {
          const isActive = conv.id === activeTab;
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
                  {conv.isPrivacy ? tDm("privacy") : conv.otherUser.alias}
                </Typography>
              </Badge>
              <IconButton
                size="small"
                onClick={(e) => closeConvTab(e, conv.id)}
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

        {/* New whisper button */}
        {session?.user && (
          <Tooltip title="/w alias message">
            <Box
              onClick={handleNewWhisper}
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

      {/* Content area */}
      <Box
        ref={scrollRef}
        sx={{
          height: 300,
          overflowY: "auto",
          px: 1.5,
          py: 1,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: colors.slate400, borderRadius: 3 },
        }}
      >
        {/* User picker view */}
        {showUserPicker ? (
          <Box sx={{ py: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: colors.slate400, fontFamily: "inherit", mb: 1, fontSize: "0.8rem" }}
            >
              Type <span style={{ color: WHISPER_COLOR }}>/w alias message</span> or pick a user:
            </Typography>
            <Autocomplete
              options={dmUsers}
              getOptionLabel={(o) => o.alias}
              loading={loadingUsers}
              onChange={(_, val) => handleSelectUser(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={tDm("selectUser")}
                  size="small"
                  autoFocus
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
        ) : isGuild ? (
          /* Guild (shoutbox) content */
          <>
            {SYSTEM_MOTD.map((line, i) => (
              <Box key={`motd-${i}`} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6, mb: 0.5 }}>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: colors.warning,
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  {line.label}
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: colors.slate400, fontFamily: "inherit", fontSize: "0.75rem" }}
                >
                  {line.text}
                </Typography>
              </Box>
            ))}
            {shouts.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
              >
                {t("empty")}
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
                            alignSelf: "center",
                            flexShrink: 0,
                          }}
                        />
                      </Tooltip>
                    )}
                    <DevTagIcon tag={shout.developerTag} />
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
            {/* Local system messages (e.g. /help output) — only visible to this user */}
            {localSystemMsgs.map((line, i) =>
              !line.label && !line.text ? (
                <Box key={`sys-${i}`} sx={{ height: 8 }} />
              ) : (
                <Box key={`sys-${i}`} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6 }}>
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
        ) : isDmTab ? (
          /* DM conversation content */
          <>
            {SYSTEM_MOTD.map((line, i) => (
              <Box
                key={`motd-dm-${i}`}
                sx={{ display: "flex", gap: 0.75, lineHeight: 1.6, mb: 0.5 }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: colors.warning,
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  {line.label}
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: colors.slate400, fontFamily: "inherit", fontSize: "0.75rem" }}
                >
                  {line.text}
                </Typography>
              </Box>
            ))}
            {dmMessages.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
              >
                {tDm("empty")}
              </Typography>
            ) : (
              dmMessages.map((msg) => {
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
                                alignSelf: "center",
                                flexShrink: 0,
                              }}
                            />
                          </Tooltip>
                        )}
                        <DevTagIcon tag={msg.senderDevTag} />
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
                                alignSelf: "center",
                                flexShrink: 0,
                              }}
                            />
                          </Tooltip>
                        )}
                        <DevTagIcon tag={activeConversation?.otherUser.developerTag ?? null} />
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
                                alignSelf: "center",
                                flexShrink: 0,
                              }}
                            />
                          </Tooltip>
                        )}
                        <DevTagIcon tag={msg.senderDevTag} />
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
            {/* Local system messages (e.g. /help output) */}
            {localSystemMsgs.map((line, i) =>
              !line.label && !line.text ? (
                <Box key={`sys-dm-${i}`} sx={{ height: 8 }} />
              ) : (
                <Box key={`sys-dm-${i}`} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6 }}>
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
        ) : null}
      </Box>

      {/* Whisper autocomplete suggestions */}
      {whisperSuggestions.length > 0 && (
        <Box
          sx={{
            borderTop: `1px solid ${colors.slate300}`,
            px: 1.5,
            py: 0.5,
            backgroundColor: colors.slate600,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: colors.slate400, fontSize: "0.65rem", mr: 0.5 }}
          >
            Tab ↹
          </Typography>
          {whisperSuggestions.map((u, i) => (
            <Box
              key={u.id}
              onClick={() => applySuggestion(u.alias)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.25,
                cursor: "pointer",
                borderRadius: 1,
                backgroundColor:
                  i === suggestionIndex ? "rgba(255,128,255,0.25)" : "rgba(255,128,255,0.08)",
                border: `1px solid ${i === suggestionIndex ? WHISPER_COLOR : `${WHISPER_COLOR}40`}`,
                "&:hover": { backgroundColor: "rgba(255,128,255,0.18)" },
              }}
            >
              {u.role === "superuser" && <StarIcon sx={{ fontSize: 12, color: colors.warning }} />}
              <Typography
                variant="caption"
                sx={{
                  color: WHISPER_COLOR,
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              >
                {u.alias}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Input field */}
      {session?.user && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderTop: whisperSuggestions.length > 0 ? "none" : `1px solid ${colors.slate300}`,
            px: 1.5,
            py: 1,
            backgroundColor: colors.slate700,
          }}
        >
          <Box sx={{ position: "relative" }}>
            {/* Ghost text showing autocomplete suggestion */}
            {whisperSuggestions.length > 0 &&
              (() => {
                const suggestion = whisperSuggestions[suggestionIndex];
                const partialMatch = message.match(/^(\/w(?:hisper)?\s+)(\S*)$/i);
                if (!partialMatch || !suggestion) return null;
                const prefix = partialMatch[1];
                const partial = partialMatch[2];
                const fullAlias = suggestion.alias;
                if (!fullAlias.toLowerCase().startsWith(partial.toLowerCase())) return null;
                const ghost = prefix + partial + fullAlias.slice(partial.length) + " ";
                return (
                  <Typography
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 14,
                      transform: "translateY(-50%)",
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.85rem",
                      color: `${WHISPER_COLOR}50`,
                      pointerEvents: "none",
                      zIndex: 1,
                      whiteSpace: "pre",
                    }}
                  >
                    {ghost}
                  </Typography>
                );
              })()}
            <TextField
              data-tutorial="shoutbox-input"
              inputRef={inputRef}
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isGuild ? t("placeholder") : isDmTab ? tDm("placeholder") : "/w alias message"
              }
              size="small"
              fullWidth
              autoComplete="off"
              inputProps={{ maxLength: isGuild ? 280 : 500 }}
              sx={{
                "& .MuiInputBase-root": {
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "0.85rem",
                  backgroundColor: "transparent",
                  color: colors.slate100,
                  position: "relative",
                  zIndex: 2,
                },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.slate300 },
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
