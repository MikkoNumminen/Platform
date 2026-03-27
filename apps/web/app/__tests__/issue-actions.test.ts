const mockAuth = jest.fn();
const mockCreate = jest.fn();
const mockRateLimit = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    issueReport: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

import { createIssueReport } from "@/lib/issue-actions";

function authenticatedSession(id = "user-1") {
  return { user: { id } };
}

describe("createIssueReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({ id: "issue-1" });
  });

  test("creates issue report for authenticated user", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createIssueReport("Bug", "It broke", "/boards");
    expect(result).toBeUndefined();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Bug",
        description: "It broke",
        url: "/boards",
        authorId: "user-1",
      },
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createIssueReport("Bug", "Broke");
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("returns error for empty title", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createIssueReport("  ", "Description");
    expect(result).toEqual({ error: "Title must be 1-200 characters", code: "invalidInput" });
  });

  test("returns error for empty description", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createIssueReport("Title", "  ");
    expect(result).toEqual({
      error: "Description must be 1-2000 characters",
      code: "invalidInput",
    });
  });

  test("sets url to null when empty", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    await createIssueReport("Bug", "Description", "");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ url: null }),
    });
  });

  test("calls rate limit", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    await createIssueReport("Bug", "Description");
    expect(mockRateLimit).toHaveBeenCalledWith("issue:create");
  });
});
