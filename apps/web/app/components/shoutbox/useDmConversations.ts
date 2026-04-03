"use client";

import { useState } from "react";
import { getConversationMessages, getDmUsers } from "@/lib/dm-queries";
import type { ConversationSummary, DmMessageData } from "@/lib/dm-queries";

type DmUser = {
  id: string;
  alias: string;
  role: string;
  developerTag: string | null;
};

interface UseDmConversationsReturn {
  conversations: ConversationSummary[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationSummary[]>>;
  dmMessages: DmMessageData[];
  setDmMessages: React.Dispatch<React.SetStateAction<DmMessageData[]>>;
  dmUsers: DmUser[];
  setDmUsers: React.Dispatch<React.SetStateAction<DmUser[]>>;
  loadingUsers: boolean;
  showUserPicker: boolean;
  setShowUserPicker: React.Dispatch<React.SetStateAction<boolean>>;
  ensureUsersLoaded: () => Promise<DmUser[]>;
  openConversation: (conversationId: string, setActiveTab: (tab: string) => void) => Promise<void>;
}

export function useDmConversations(
  initialConversations: ConversationSummary[],
): UseDmConversationsReturn {
  const [conversations, setConversations] = useState(initialConversations);
  const [dmMessages, setDmMessages] = useState<DmMessageData[]>([]);
  const [dmUsers, setDmUsers] = useState<DmUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const ensureUsersLoaded = async (): Promise<DmUser[]> => {
    if (dmUsers.length === 0) {
      setLoadingUsers(true);
      const users = await getDmUsers();
      setDmUsers(users);
      setLoadingUsers(false);
      return users;
    }
    return dmUsers;
  };

  const openConversation = async (
    conversationId: string,
    setActiveTab: (tab: string) => void,
  ): Promise<void> => {
    setActiveTab(conversationId);
    setShowUserPicker(false);
    const msgs = await getConversationMessages(conversationId);
    setDmMessages(msgs);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  };

  return {
    conversations,
    setConversations,
    dmMessages,
    setDmMessages,
    dmUsers,
    setDmUsers,
    loadingUsers,
    showUserPicker,
    setShowUserPicker,
    ensureUsersLoaded,
    openConversation,
  };
}
