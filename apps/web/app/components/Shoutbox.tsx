"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Box, TextField, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useTranslations } from "next-intl";
import { colors } from "../styles";
import { DEVELOPER_TAG_LABELS, DEVELOPER_TAG_ICONS } from "@/lib/developer-config";
import { createShout } from "@/lib/shout-actions";
import { setMotd as setMotdAction } from "@/lib/setting-actions";
import { sendDirectMessage, startConversation } from "@/lib/dm-actions";
import { getConversationMessages, getDmUsers, getDmUserDetails } from "@/lib/dm-queries";
import type { ShoutData } from "@/lib/shout-queries";
import type { ConversationSummary, DmMessageData } from "@/lib/dm-queries";
import { useXpToast } from "./XpToastProvider";
import { emitTutorialEvent } from "./TutorialProvider";
import { completeWhisperQuest } from "@/lib/campaign-completion";
import ShoutboxTabBar from "./shoutbox/ShoutboxTabBar";
import GuildMessages from "./shoutbox/GuildMessages";
import WhisperMessages from "./shoutbox/WhisperMessages";
import UserPicker from "./shoutbox/UserPicker";
import type { SystemLine } from "./shoutbox/SystemMessages";

const CHAT_HEIGHT = 300;
const MAX_SHOUT_LENGTH = 280;
const MAX_DM_LENGTH = 500;

const DEMO_REACTIONS: Array<{ alias: string; message: string; delayMs: number }> = [
  { alias: "Valtava", message: "Welcome to the community! \uD83D\uDC10", delayMs: 1500 },
  { alias: "Perserkki", message: "Hey! Nice to see a new face \uD83D\uDC4B", delayMs: 3000 },
  { alias: "Turo", message: "Check out the quests, you can earn XP!", delayMs: 5000 },
];

interface ShoutboxProps {
  initialShouts: ShoutData[];
  initialConversations: ConversationSummary[];
  motd: string;
}

type DmUser = {
  id: string;
  alias: string;
  role: string;
  developerTag: string | null;
};
type ActiveTab = "guild" | string;

const HELP_LINES_BASE: SystemLine[] = [
  { label: "[System]", text: "Available commands:" },
  { label: "/w", text: "alias message — whisper a player" },
  { label: "/whisper", text: "alias message — same as /w" },
  { label: "/who", text: "alias — show info about a player" },
  { label: "/help", text: "— show this help (only you can see this)" },
  { label: "", text: "" },
  { label: "Tip:", text: "Tab key autocompletes the alias when typing /w" },
];

const HELP_LINE_MOTD: SystemLine = {
  label: "/motd",
  text: "message — change the welcome message (superuser/architect)",
};

export default function Shoutbox({ initialShouts, initialConversations, motd }: ShoutboxProps) {
  const { data: session } = useSession();
  const { onAction } = useXpToast();
  const t = useTranslations("shoutbox");
  const tDm = useTranslations("dm");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Guild state
  const [shouts, setShouts] = useState(initialShouts);
  const [hasDemoReacted, setHasDemoReacted] = useState(false);
  const isDemo = Boolean(session?.user?.demoSessionId);

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

  const userRole = session?.user?.role;
  const userDevTag = session?.user?.developerTag;
  const canChangeMotd = userRole === "superuser" || userDevTag === "architect";

  const [currentMotd, setCurrentMotd] = useState(motd);

  const helpLines: SystemLine[] = [...HELP_LINES_BASE, ...(canChangeMotd ? [HELP_LINE_MOTD] : [])];

  useEffect(() => {
    setShouts(initialShouts);
  }, [initialShouts]);
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [shouts, dmMessages, activeTab, localSystemMsgs]);
  useEffect(() => {
    setLocalSystemMsgs([]);
  }, [activeTab]);

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
    const msgs = await getConversationMessages(conversationId);
    setDmMessages(msgs);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const handleCloseConversationTab = (e: React.MouseEvent, conversationId: string) => {
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
    const partialMatch = val.match(/^\/(?:w(?:hisper)?|who)\s+(\S*)$/i);
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
    const newMsg = message.replace(/^(\/(?:w(?:hisper)?|who)\s+)\S*$/i, `$1${alias} `);
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
        setSuggestionIndex((i) => (i - 1 + whisperSuggestions.length) % whisperSuggestions.length);
      } else {
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
    const role = session.user?.role ?? "user";

    if (/^\/help$/i.test(trimmed)) {
      setLocalSystemMsgs((prev) => [...prev, ...helpLines]);
      setMessage("");
      setWhisperSuggestions([]);
      return;
    }

    const whoMatch = trimmed.match(/^\/who\s+(\S+)$/i);
    if (whoMatch) {
      const targetAlias = whoMatch[1];
      setMessage("");
      setWhisperSuggestions([]);
      const users = await ensureUsersLoaded();
      const target = users.find((u) => u.alias.toLowerCase() === targetAlias.toLowerCase());
      if (!target) {
        setLocalSystemMsgs((prev) => [
          ...prev,
          { label: "[System]", text: `No player named "${targetAlias}" found.` },
        ]);
      } else {
        const tagIcon = target.developerTag ? DEVELOPER_TAG_ICONS[target.developerTag] : null;
        const tagLabel = target.developerTag ? DEVELOPER_TAG_LABELS[target.developerTag] : null;
        const roleLabel = target.role === "superuser" ? "⭐ Superuser" : target.role;
        const infoParts = [roleLabel];
        if (tagLabel) infoParts.push(tagLabel);
        if (userRole === "superuser") {
          const details = await getDmUserDetails(target.id);
          if (details?.name) infoParts.push(`Name: ${details.name}`);
          if (details?.email) infoParts.push(details.email);
        }
        const lines: SystemLine[] = [
          {
            label: "[Who]",
            text: `${target.alias}${tagIcon ? ` ${tagIcon}` : ""} — ${infoParts.join(" · ")}`,
          },
        ];
        setLocalSystemMsgs((prev) => [...prev, ...lines]);
      }
      return;
    }

    const motdMatch = trimmed.match(/^\/motd\s+(.+)$/i);
    if (motdMatch) {
      const newMotd = motdMatch[1];
      setMessage("");
      setWhisperSuggestions([]);
      const result = await setMotdAction(newMotd);
      if (result?.error) {
        setLocalSystemMsgs((prev) => [...prev, { label: "[System]", text: result.error }]);
      } else {
        setCurrentMotd(newMotd);
        setLocalSystemMsgs((prev) => [
          ...prev,
          { label: "[System]", text: `MOTD updated: ${newMotd}` },
        ]);
      }
      return;
    }

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
          completeWhisperQuest();
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
          completeWhisperQuest();
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
        if (isDemo && !hasDemoReacted) {
          setHasDemoReacted(true);
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

  const inputPlaceholder = isGuild
    ? t("placeholder")
    : isDmTab
      ? tDm("placeholder")
      : "/w alias message";

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
      <ShoutboxTabBar
        activeTab={activeTab}
        conversations={conversations}
        showNewWhisper={!!session?.user}
        privacyLabel={tDm("privacy")}
        onSelectGuild={() => {
          setActiveTab("guild");
          setShowUserPicker(false);
        }}
        onSelectConversation={openConversation}
        onCloseConversation={handleCloseConversationTab}
        onNewWhisper={handleNewWhisper}
      />

      {/* Pinned MOTD */}
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderBottom: `1px solid ${colors.slate300}`,
          backgroundColor: colors.slate700,
          display: "flex",
          gap: 0.75,
        }}
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
          [MOTD]
        </Typography>
        <Typography
          component="span"
          variant="body2"
          sx={{ color: colors.slate400, fontFamily: "inherit", fontSize: "0.75rem" }}
        >
          {currentMotd}
        </Typography>
      </Box>

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
        {showUserPicker ? (
          <UserPicker
            users={dmUsers}
            loading={loadingUsers}
            placeholder={tDm("selectUser")}
            onSelect={handleSelectUser}
          />
        ) : isGuild ? (
          <GuildMessages shouts={shouts} systemMessages={localSystemMsgs} emptyText={t("empty")} />
        ) : isDmTab ? (
          <WhisperMessages
            messages={dmMessages}
            systemMessages={localSystemMsgs}
            activeConversation={activeConversation}
            otherAlias={otherAlias}
            emptyText={tDm("empty")}
          />
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
                border: `1px solid ${i === suggestionIndex ? colors.whisper : `${colors.whisper}40`}`,
                "&:hover": { backgroundColor: "rgba(255,128,255,0.18)" },
              }}
            >
              {u.role === "superuser" && <StarIcon sx={{ fontSize: 12, color: colors.warning }} />}
              <Typography
                variant="caption"
                sx={{
                  color: colors.whisper,
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
                      color: `${colors.whisper}50`,
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
              placeholder={inputPlaceholder}
              size="small"
              fullWidth
              autoComplete="off"
              inputProps={{ maxLength: isGuild ? MAX_SHOUT_LENGTH : MAX_DM_LENGTH }}
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
