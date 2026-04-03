jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

const mockPostDeleteMany = jest.fn();
const mockTopicDeleteMany = jest.fn();
const mockThreadDeleteMany = jest.fn();
const mockBoardDeleteMany = jest.fn();
const mockForumDeleteMany = jest.fn();
const mockUserDeleteMany = jest.fn();
const mockEventDeleteMany = jest.fn();
const mockRateLimitDeleteMany = jest.fn();
const mockAuditLogDeleteMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    post: { deleteMany: (...a: unknown[]) => mockPostDeleteMany(...a) },
    topic: { deleteMany: (...a: unknown[]) => mockTopicDeleteMany(...a) },
    thread: { deleteMany: (...a: unknown[]) => mockThreadDeleteMany(...a) },
    board: { deleteMany: (...a: unknown[]) => mockBoardDeleteMany(...a) },
    forum: { deleteMany: (...a: unknown[]) => mockForumDeleteMany(...a) },
    user: { deleteMany: (...a: unknown[]) => mockUserDeleteMany(...a) },
    calendarEvent: { deleteMany: (...a: unknown[]) => mockEventDeleteMany(...a) },
    rateLimit: { deleteMany: (...a: unknown[]) => mockRateLimitDeleteMany(...a) },
    auditLog: { deleteMany: (...a: unknown[]) => mockAuditLogDeleteMany(...a) },
  },
}));

import { GET } from "../api/cron/purge-deleted/route";

function makeRequest(secret?: string) {
  const headersMap: Record<string, string> = {};
  if (secret) {
    headersMap["authorization"] = `Bearer ${secret}`;
  }
  return {
    headers: { get: (key: string) => headersMap[key.toLowerCase()] ?? null },
  } as unknown as Request;
}

describe("purge-deleted cron", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    const result = { count: 0 };
    mockPostDeleteMany.mockResolvedValue(result);
    mockTopicDeleteMany.mockResolvedValue(result);
    mockThreadDeleteMany.mockResolvedValue(result);
    mockBoardDeleteMany.mockResolvedValue(result);
    mockForumDeleteMany.mockResolvedValue(result);
    mockUserDeleteMany.mockResolvedValue(result);
    mockEventDeleteMany.mockResolvedValue(result);
    mockRateLimitDeleteMany.mockResolvedValue(result);
    mockAuditLogDeleteMany.mockResolvedValue(result);
  });

  test("returns 401 without valid CRON_SECRET", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  test("returns 401 without authorization header", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  test("purges soft-deleted records with valid secret", async () => {
    mockPostDeleteMany.mockResolvedValue({ count: 2 });
    mockUserDeleteMany.mockResolvedValue({ count: 1 });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.deleted.posts).toBe(2);
    expect(body.deleted.users).toBe(1);
    expect(body.purgedBefore).toBeDefined();
  });

  test("calls deleteMany on all soft-deletable models", async () => {
    await GET(makeRequest("test-secret"));

    expect(mockPostDeleteMany).toHaveBeenCalledTimes(1);
    expect(mockTopicDeleteMany).toHaveBeenCalledTimes(1);
    expect(mockThreadDeleteMany).toHaveBeenCalledTimes(1);
    expect(mockBoardDeleteMany).toHaveBeenCalledTimes(1);
    expect(mockForumDeleteMany).toHaveBeenCalledTimes(1);
    expect(mockUserDeleteMany).toHaveBeenCalledTimes(1);
    expect(mockEventDeleteMany).toHaveBeenCalledTimes(1);
  });

  test("uses 30-day retention cutoff", async () => {
    await GET(makeRequest("test-secret"));

    const call = mockPostDeleteMany.mock.calls[0][0];
    const cutoff = new Date(call.where.deletedAt.lt);
    const daysAgo = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysAgo).toBeCloseTo(30, 0);
  });

  test("cleans up expired rate limit entries", async () => {
    mockRateLimitDeleteMany.mockResolvedValue({ count: 5 });
    const res = await GET(makeRequest("test-secret"));
    const body = await res.json();

    expect(mockRateLimitDeleteMany).toHaveBeenCalledTimes(1);
    expect(body.deleted.rateLimitEntries).toBe(5);

    const call = mockRateLimitDeleteMany.mock.calls[0][0];
    const cutoff = new Date(call.where.windowStart.lt);
    const hoursAgo = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60);
    expect(hoursAgo).toBeGreaterThan(22);
    expect(hoursAgo).toBeLessThan(26);
  });

  test("purges audit logs older than 1 year with no session", async () => {
    mockAuditLogDeleteMany.mockResolvedValue({ count: 3 });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.deleted.auditLogs).toBe(3);

    expect(mockAuditLogDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sessionId: null }),
      }),
    );

    const call = mockAuditLogDeleteMany.mock.calls[0][0];
    const cutoff = new Date(call.where.createdAt.lt);
    const daysAgo = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysAgo).toBeCloseTo(365, 0);
  });

  test("returns 500 on database error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockPostDeleteMany.mockRejectedValue(new Error("DB connection failed"));
    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(500);
    consoleSpy.mockRestore();
  });
});
