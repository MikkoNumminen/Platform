const mockConversationFindMany = jest.fn();
const mockConversationFindFirst = jest.fn();
const mockDirectMessageGroupBy = jest.fn();
const mockDirectMessageUpdateMany = jest.fn();
const mockDirectMessageFindMany = jest.fn();
const mockUserFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    conversation: {
      findMany: (...a: any[]) => mockConversationFindMany(...a),
      findFirst: (...a: any[]) => mockConversationFindFirst(...a),
    },
    directMessage: {
      groupBy: (...a: any[]) => mockDirectMessageGroupBy(...a),
      updateMany: (...a: any[]) => mockDirectMessageUpdateMany(...a),
      findMany: (...a: any[]) => mockDirectMessageFindMany(...a),
    },
    user: {
      findMany: (...a: any[]) => mockUserFindMany(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "platform", sessionId: null }),
}));
jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/demo-constants", () => ({ DEMO_EMAIL: "demo@platform.app" }));

import { auth } from "@/auth";
import { getMyConversations, getConversationMessages, getDmUsers } from "@/lib/dm-queries";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => jest.clearAllMocks());

describe("getMyConversations", () => {
  test("returns empty when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    expect(await getMyConversations()).toEqual([]);
  });

  test("returns conversations with other user info", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockConversationFindMany.mockResolvedValue([
      {
        id: "conv-1",
        participantA: "u1",
        participantB: "u2",
        lastMessageAt: new Date("2026-04-01"),
        isPrivacy: false,
        userA: { id: "u1", alias: "Me", name: "Me", role: "user", developerTag: null },
        userB: { id: "u2", alias: "Other", name: "Other", role: "user", developerTag: null },
        messages: [{ message: "hello" }],
      },
    ]);
    mockDirectMessageGroupBy.mockResolvedValue([{ conversationId: "conv-1", _count: { _all: 2 } }]);

    const result = await getMyConversations();
    expect(result).toHaveLength(1);
    expect(result[0].otherUser.alias).toBe("Other");
    expect(result[0].lastMessage).toBe("hello");
    expect(result[0].unreadCount).toBe(2);
  });
});

describe("getConversationMessages", () => {
  test("returns empty when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    expect(await getConversationMessages("conv-1")).toEqual([]);
  });

  test("returns empty when not a participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockConversationFindFirst.mockResolvedValue(null);
    expect(await getConversationMessages("conv-1")).toEqual([]);
  });

  test("returns messages and marks as read", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockConversationFindFirst.mockResolvedValue({ id: "conv-1" });
    mockDirectMessageUpdateMany.mockResolvedValue({ count: 1 });
    mockDirectMessageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        message: "hello",
        createdAt: new Date("2026-04-01"),
        sender: { id: "u2", alias: "Bob", name: "Bob", role: "user", developerTag: null },
      },
    ]);

    const result = await getConversationMessages("conv-1");
    expect(result).toHaveLength(1);
    expect(result[0].senderAlias).toBe("Bob");
    expect(result[0].isMe).toBe(false);
    expect(mockDirectMessageUpdateMany).toHaveBeenCalled();
  });
});

describe("getDmUsers", () => {
  test("returns empty when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    expect(await getDmUsers()).toEqual([]);
  });

  test("returns formatted user list", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockUserFindMany.mockResolvedValue([
      {
        id: "u2",
        alias: "Alice",
        name: "Alice A",
        role: "user",
        developerTag: null,
      },
    ]);

    const result = await getDmUsers();
    expect(result).toEqual([
      {
        id: "u2",
        alias: "Alice",
        role: "user",
        developerTag: null,
      },
    ]);
  });
});
