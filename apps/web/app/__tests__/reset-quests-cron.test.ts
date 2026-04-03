jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

const mockResetDailyQuests = jest.fn();
const mockResetWeeklyQuests = jest.fn();

jest.mock("@/lib/gamification", () => ({
  resetDailyQuests: (...args: unknown[]) => mockResetDailyQuests(...args),
  resetWeeklyQuests: (...args: unknown[]) => mockResetWeeklyQuests(...args),
}));

import { GET } from "../api/cron/reset-quests/route";

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv, CRON_SECRET: "test-secret" };
});

afterAll(() => {
  process.env = originalEnv;
});

function makeRequest(authHeader?: string) {
  const headers: Record<string, string> = {};
  if (authHeader) headers["authorization"] = authHeader;
  return {
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  } as unknown as Request;
}

describe("GET /api/cron/reset-quests", () => {
  test("returns 401 without authorization header", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("returns 401 with wrong secret", async () => {
    const res = await GET(makeRequest("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  test("resets daily quests with correct secret", async () => {
    mockResetDailyQuests.mockResolvedValue(3);

    // Use a non-Monday date: Tuesday March 31, 2026
    const realDate = Date;
    const mockDate = new realDate("2026-03-31T12:00:00Z");
    jest.spyOn(globalThis, "Date").mockImplementation((() => mockDate) as any);

    const res = await GET(makeRequest("Bearer test-secret"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dailyReset).toBe(3);
    expect(mockResetDailyQuests).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  test("resets weekly quests on Monday", async () => {
    mockResetDailyQuests.mockResolvedValue(2);
    mockResetWeeklyQuests.mockResolvedValue(5);

    const realDate = Date;
    const monday = new realDate("2026-03-30T12:00:00Z"); // Monday
    jest.spyOn(globalThis, "Date").mockImplementation((() => monday) as any);

    const res = await GET(makeRequest("Bearer test-secret"));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.isMonday).toBe(true);
    expect(body.weeklyReset).toBe(5);
    expect(mockResetWeeklyQuests).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  test("does not reset weekly quests on non-Monday", async () => {
    mockResetDailyQuests.mockResolvedValue(1);

    const realDate = Date;
    const wednesday = new realDate("2026-04-01T12:00:00Z"); // Wednesday
    jest.spyOn(globalThis, "Date").mockImplementation((() => wednesday) as any);

    const res = await GET(makeRequest("Bearer test-secret"));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.isMonday).toBe(false);
    expect(body.weeklyReset).toBe(0);
    expect(mockResetWeeklyQuests).not.toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
