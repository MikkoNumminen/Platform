// Transaction mocks — must be declared inside jest.mock factory to avoid hoisting issues
const mocks = {
  auth: jest.fn(),
  rateLimit: jest.fn(),
  // Transaction mocks (deleteMyAccount)
  tx: {
    userUpdate: jest.fn(),
    userFindFirst: jest.fn(),
    permissionDeleteMany: jest.fn(),
    surveyUpdateMany: jest.fn(),
    calendarUpdateMany: jest.fn(),
    postUpdateMany: jest.fn(),
    topicUpdateMany: jest.fn(),
    threadUpdateMany: jest.fn(),
    shoutDeleteMany: jest.fn(),
    issueDeleteMany: jest.fn(),
    rateLimitDeleteMany: jest.fn(),
  },
  // Direct prisma mocks (exportMyData)
  userFindFirst: jest.fn(),
  postFindMany: jest.fn(),
  topicFindMany: jest.fn(),
  threadFindMany: jest.fn(),
  calendarFindMany: jest.fn(),
  shoutFindMany: jest.fn(),
  issueFindMany: jest.fn(),
  surveyFindMany: jest.fn(),
  permissionFindMany: jest.fn(),
};

jest.mock("@/auth", () => ({
  auth: () => mocks.auth(),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mocks.rateLimit(...args),
}));

jest.mock("@/lib/db", () => {
  const txObj = {
    user: {
      update: (...a: unknown[]) => mocks.tx.userUpdate(...a),
      findFirst: (...a: unknown[]) => mocks.tx.userFindFirst(...a),
    },
    userPermission: { deleteMany: (...a: unknown[]) => mocks.tx.permissionDeleteMany(...a) },
    surveyResponse: { updateMany: (...a: unknown[]) => mocks.tx.surveyUpdateMany(...a) },
    calendarEvent: { updateMany: (...a: unknown[]) => mocks.tx.calendarUpdateMany(...a) },
    post: { updateMany: (...a: unknown[]) => mocks.tx.postUpdateMany(...a) },
    topic: { updateMany: (...a: unknown[]) => mocks.tx.topicUpdateMany(...a) },
    thread: { updateMany: (...a: unknown[]) => mocks.tx.threadUpdateMany(...a) },
    shout: { deleteMany: (...a: unknown[]) => mocks.tx.shoutDeleteMany(...a) },
    issueReport: { deleteMany: (...a: unknown[]) => mocks.tx.issueDeleteMany(...a) },
    rateLimit: { deleteMany: (...a: unknown[]) => mocks.tx.rateLimitDeleteMany(...a) },
  };
  return {
    prisma: {
      user: { findFirst: (...a: unknown[]) => mocks.userFindFirst(...a) },
      post: { findMany: (...a: unknown[]) => mocks.postFindMany(...a) },
      topic: { findMany: (...a: unknown[]) => mocks.topicFindMany(...a) },
      thread: { findMany: (...a: unknown[]) => mocks.threadFindMany(...a) },
      calendarEvent: { findMany: (...a: unknown[]) => mocks.calendarFindMany(...a) },
      shout: { findMany: (...a: unknown[]) => mocks.shoutFindMany(...a) },
      issueReport: { findMany: (...a: unknown[]) => mocks.issueFindMany(...a) },
      surveyResponse: { findMany: (...a: unknown[]) => mocks.surveyFindMany(...a) },
      userPermission: { findMany: (...a: unknown[]) => mocks.permissionFindMany(...a) },
      $transaction: async (fn: (tx: typeof txObj) => Promise<void>) => {
        mocks.tx.userFindFirst.mockResolvedValue({ id: "user-1", email: "test@example.com" });
        await fn(txObj);
      },
    },
  };
});

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({ get: () => null }),
}));

import { deleteMyAccount, exportMyData } from "@/lib/gdpr-actions";

function authedSession() {
  return { user: { id: "user-1", email: "test@example.com" } };
}

describe("deleteMyAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.rateLimit.mockResolvedValue(undefined);
    mocks.userFindFirst.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    mocks.tx.userUpdate.mockResolvedValue({});
    mocks.tx.permissionDeleteMany.mockResolvedValue({ count: 0 });
    mocks.tx.surveyUpdateMany.mockResolvedValue({ count: 0 });
    mocks.tx.calendarUpdateMany.mockResolvedValue({ count: 0 });
    mocks.tx.postUpdateMany.mockResolvedValue({ count: 0 });
    mocks.tx.topicUpdateMany.mockResolvedValue({ count: 0 });
    mocks.tx.threadUpdateMany.mockResolvedValue({ count: 0 });
    mocks.tx.shoutDeleteMany.mockResolvedValue({ count: 0 });
    mocks.tx.issueDeleteMany.mockResolvedValue({ count: 0 });
    mocks.tx.rateLimitDeleteMany.mockResolvedValue({ count: 0 });
  });

  test("scrubs user PII and marks as deleted", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    const result = await deleteMyAccount();
    expect(result).toBeUndefined();
    expect(mocks.tx.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          email: "deleted-user-1@deleted.invalid",
          name: null,
          alias: null,
          image: null,
          avatarUrl: null,
          bio: null,
          deletedAt: expect.any(Date),
        }),
      }),
    );
  });

  test("deletes permission overrides", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    await deleteMyAccount();
    expect(mocks.tx.permissionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  test("nulls out survey response user links", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    await deleteMyAccount();
    expect(mocks.tx.surveyUpdateMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { userId: null },
    });
  });

  test("nulls out calendar event author links", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    await deleteMyAccount();
    expect(mocks.tx.calendarUpdateMany).toHaveBeenCalledWith({
      where: { authorId: "user-1" },
      data: { authorId: null },
    });
  });

  test("soft-deletes posts, topics, and threads", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    await deleteMyAccount();
    expect(mocks.tx.postUpdateMany).toHaveBeenCalled();
    expect(mocks.tx.topicUpdateMany).toHaveBeenCalled();
    expect(mocks.tx.threadUpdateMany).toHaveBeenCalled();
  });

  test("hard-deletes shouts and issue reports", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    await deleteMyAccount();
    expect(mocks.tx.shoutDeleteMany).toHaveBeenCalledWith({
      where: { authorId: "user-1" },
    });
    expect(mocks.tx.issueDeleteMany).toHaveBeenCalledWith({
      where: { authorId: "user-1" },
    });
  });

  test("returns error when not authenticated", async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await deleteMyAccount();
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("calls rate limit", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    await deleteMyAccount();
    expect(mocks.rateLimit).toHaveBeenCalledWith("gdpr:deleteAccount");
  });
});

describe("exportMyData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.rateLimit.mockResolvedValue(undefined);
    mocks.userFindFirst.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      alias: "tester",
      image: null,
      avatarUrl: null,
      bio: null,
      role: "user",
      createdAt: new Date("2026-01-01"),
    });
    mocks.postFindMany.mockResolvedValue([]);
    mocks.topicFindMany.mockResolvedValue([]);
    mocks.threadFindMany.mockResolvedValue([]);
    mocks.calendarFindMany.mockResolvedValue([]);
    mocks.shoutFindMany.mockResolvedValue([]);
    mocks.issueFindMany.mockResolvedValue([]);
    mocks.surveyFindMany.mockResolvedValue([]);
    mocks.permissionFindMany.mockResolvedValue([]);
  });

  test("returns JSON export of all user data", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    const result = await exportMyData();
    expect("data" in result).toBe(true);
    if ("data" in result) {
      const parsed = JSON.parse(result.data);
      expect(parsed.profile.email).toBe("test@example.com");
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.posts).toEqual([]);
      expect(parsed.calendarEvents).toEqual([]);
    }
  });

  test("returns error when not authenticated", async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await exportMyData();
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("calls rate limit", async () => {
    mocks.auth.mockResolvedValue(authedSession());
    await exportMyData();
    expect(mocks.rateLimit).toHaveBeenCalledWith("gdpr:exportData");
  });
});
