import { renderHook, act } from "@testing-library/react";

const mockGetConversationMessages = jest.fn();
const mockGetDmUsers = jest.fn();

jest.mock("@/lib/dm-queries", () => ({
  getConversationMessages: (...args: unknown[]) => mockGetConversationMessages(...args),
  getDmUsers: (...args: unknown[]) => mockGetDmUsers(...args),
}));

import { useDmConversations } from "@/app/components/shoutbox/useDmConversations";
import type { ConversationSummary } from "@/lib/dm-queries";

const mockConversations: ConversationSummary[] = [
  {
    id: "conv1",
    otherUser: { id: "u2", alias: "Bob", role: "user", developerTag: null },
    lastMessage: "Hey",
    lastMessageAt: "2026-01-01T00:00:00Z",
    unreadCount: 2,
    isPrivacy: false,
  },
];

describe("useDmConversations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDmUsers.mockResolvedValue([]);
    mockGetConversationMessages.mockResolvedValue([]);
  });

  test("initializes with provided conversations", () => {
    const { result } = renderHook(() => useDmConversations(mockConversations));
    expect(result.current.conversations).toEqual(mockConversations);
  });

  test("initializes dmMessages as empty array", () => {
    const { result } = renderHook(() => useDmConversations([]));
    expect(result.current.dmMessages).toEqual([]);
  });

  test("initializes dmUsers as empty array", () => {
    const { result } = renderHook(() => useDmConversations([]));
    expect(result.current.dmUsers).toEqual([]);
  });

  test("initializes loadingUsers as false", () => {
    const { result } = renderHook(() => useDmConversations([]));
    expect(result.current.loadingUsers).toBe(false);
  });

  test("initializes showUserPicker as false", () => {
    const { result } = renderHook(() => useDmConversations([]));
    expect(result.current.showUserPicker).toBe(false);
  });

  test("setShowUserPicker updates state", () => {
    const { result } = renderHook(() => useDmConversations([]));
    act(() => {
      result.current.setShowUserPicker(true);
    });
    expect(result.current.showUserPicker).toBe(true);
  });

  test("ensureUsersLoaded fetches users when dmUsers is empty", async () => {
    const mockUsers = [{ id: "u1", alias: "Alice", role: "user", developerTag: null }];
    mockGetDmUsers.mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useDmConversations([]));

    let users: unknown;
    await act(async () => {
      users = await result.current.ensureUsersLoaded();
    });

    expect(mockGetDmUsers).toHaveBeenCalledTimes(1);
    expect(users).toEqual(mockUsers);
    expect(result.current.dmUsers).toEqual(mockUsers);
  });

  test("ensureUsersLoaded returns cached users when already loaded", async () => {
    const mockUsers = [{ id: "u1", alias: "Alice", role: "user", developerTag: null }];
    mockGetDmUsers.mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useDmConversations([]));

    await act(async () => {
      await result.current.ensureUsersLoaded();
    });
    await act(async () => {
      await result.current.ensureUsersLoaded();
    });

    expect(mockGetDmUsers).toHaveBeenCalledTimes(1);
  });

  test("openConversation fetches messages and resets unread count", async () => {
    const mockMessages = [
      {
        id: "m1",
        message: "Hi",
        senderId: "u2",
        senderAlias: "Bob",
        senderRole: "user",
        senderDevTag: null,
        isMe: false,
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];
    mockGetConversationMessages.mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useDmConversations(mockConversations));
    const setActiveTab = jest.fn();

    await act(async () => {
      await result.current.openConversation("conv1", setActiveTab);
    });

    expect(setActiveTab).toHaveBeenCalledWith("conv1");
    expect(result.current.showUserPicker).toBe(false);
    expect(result.current.dmMessages).toEqual(mockMessages);
    expect(result.current.conversations[0].unreadCount).toBe(0);
  });

  test("ensureUsersLoaded sets loadingUsers during fetch", async () => {
    let resolveFn: (value: unknown) => void;
    const loadingPromise = new Promise((resolve) => {
      resolveFn = resolve;
    });
    mockGetDmUsers.mockReturnValue(loadingPromise);

    const { result } = renderHook(() => useDmConversations([]));

    act(() => {
      result.current.ensureUsersLoaded();
    });

    expect(result.current.loadingUsers).toBe(true);

    await act(async () => {
      resolveFn!([]);
      await loadingPromise;
    });

    expect(result.current.loadingUsers).toBe(false);
  });
});
