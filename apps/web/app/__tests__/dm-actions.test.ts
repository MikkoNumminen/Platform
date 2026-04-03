const mockConversationFindFirst = jest.fn();
const mockConversationCreate = jest.fn();
const mockConversationUpdate = jest.fn();
const mockDirectMessageCreate = jest.fn();
const mockUserFindFirst = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    conversation: {
      findFirst: (...a: any[]) => mockConversationFindFirst(...a),
      create: (...a: any[]) => mockConversationCreate(...a),
      update: (...a: any[]) => mockConversationUpdate(...a),
    },
    directMessage: {
      create: (...a: any[]) => mockDirectMessageCreate(...a),
    },
    user: {
      findFirst: (...a: any[]) => mockUserFindFirst(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/rateLimit", () => ({ rateLimit: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/lib/demo-session", () => ({ getDemoSessionId: jest.fn().mockResolvedValue(null) }));
jest.mock("@/lib/gamification/trigger", () => ({
  triggerGamification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/campaign-completion", () => ({
  autoCompleteCampaignQuest: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { auth } from "@/auth";
import { sendDirectMessage, startConversation } from "@/lib/dm-actions";
import { rateLimit } from "@/lib/rateLimit";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => jest.clearAllMocks());

describe("sendDirectMessage", () => {
  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await sendDirectMessage("conv-1", "hello");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error when dm:send permission is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    const result = await sendDirectMessage("conv-1", "hello");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error for empty message", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    const result = await sendDirectMessage("conv-1", "   ");
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });

  test("returns error for message exceeding 500 chars", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    const result = await sendDirectMessage("conv-1", "a".repeat(501));
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });

  test("returns error when user is not a participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    mockConversationFindFirst.mockResolvedValue(null);
    const result = await sendDirectMessage("conv-1", "hello");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("sends message to existing conversation", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    mockConversationFindFirst.mockResolvedValue({
      id: "conv-1",
      participantA: "u1",
      participantB: "u2",
    });
    mockDirectMessageCreate.mockResolvedValue({});
    mockConversationUpdate.mockResolvedValue({});

    const result = await sendDirectMessage("conv-1", "hello");
    expect(result).toBeUndefined();
    expect(mockDirectMessageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ conversationId: "conv-1", senderId: "u1", message: "hello" }),
    });
    expect(mockConversationUpdate).toHaveBeenCalled();
  });

  test("enforces rate limiting", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    await sendDirectMessage("conv-1", "hello");
    expect(rateLimit).toHaveBeenCalledWith("dm:send");
  });
});

const VALID_OTHER_USER_ID = "00000000-0000-0000-0000-000000000002";

describe("startConversation", () => {
  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await startConversation("u2", "hello");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error when dm:send permission is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    const result = await startConversation("u2", "hello");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error for invalid user ID format", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    const result = await startConversation("u2", "hello");
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });

  test("returns error for empty message", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    const result = await startConversation(VALID_OTHER_USER_ID, "");
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });

  test("returns error when other user not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    mockUserFindFirst.mockResolvedValue(null);
    const result = await startConversation(VALID_OTHER_USER_ID, "hello");
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });

  test("creates new conversation and sends message", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    mockUserFindFirst.mockResolvedValue({ id: VALID_OTHER_USER_ID });
    mockConversationFindFirst.mockResolvedValue(null);
    mockConversationCreate.mockResolvedValue({ id: "new-conv" });
    mockDirectMessageCreate.mockResolvedValue({});

    const result = await startConversation(VALID_OTHER_USER_ID, "hello");
    expect(result).toEqual(expect.objectContaining({ conversationId: "new-conv" }));
    expect(mockConversationCreate).toHaveBeenCalled();
    expect(mockDirectMessageCreate).toHaveBeenCalled();
  });

  test("reuses existing conversation", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    mockUserFindFirst.mockResolvedValue({ id: VALID_OTHER_USER_ID });
    mockConversationFindFirst.mockResolvedValue({ id: "existing-conv" });
    mockConversationUpdate.mockResolvedValue({});
    mockDirectMessageCreate.mockResolvedValue({});

    const result = await startConversation(VALID_OTHER_USER_ID, "hello");
    expect(result).toEqual(expect.objectContaining({ conversationId: "existing-conv" }));
    expect(mockConversationCreate).not.toHaveBeenCalled();
    expect(mockConversationUpdate).toHaveBeenCalled();
  });

  test("handles rate limit error", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "dm:send": true } } } as any);
    (rateLimit as jest.Mock).mockRejectedValueOnce(new Error("rate limited"));
    const result = await startConversation(VALID_OTHER_USER_ID, "hello");
    expect(result).toEqual(expect.objectContaining({ code: "rateLimited" }));
  });
});
