const mockAuth = jest.fn();
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockRateLimit = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    issueReport: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { createIssueReport, resolveIssue } from "@/lib/issue-actions";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

function authenticatedSession(
  id = "user-1",
  role = "user",
  permissions: Record<string, boolean> = {},
) {
  return { user: { id, role, permissions } };
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

describe("resolveIssue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({ id: VALID_UUID, resolvedAt: null });
    mockUpdate.mockResolvedValue({ id: VALID_UUID });
  });

  test("resolves an open issue with issue:resolve permission", async () => {
    mockAuth.mockResolvedValue(
      authenticatedSession("user-1", "superuser", { "issue:resolve": true }),
    );
    const result = await resolveIssue(VALID_UUID);
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { resolvedAt: expect.any(Date) },
    });
  });

  test("reopens a resolved issue with issue:resolve permission", async () => {
    mockAuth.mockResolvedValue(
      authenticatedSession("user-1", "superuser", { "issue:resolve": true }),
    );
    mockFindUnique.mockResolvedValue({ id: VALID_UUID, resolvedAt: new Date() });
    const result = await resolveIssue(VALID_UUID);
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { resolvedAt: null },
    });
  });

  test("returns error when missing issue:resolve permission", async () => {
    mockAuth.mockResolvedValue(authenticatedSession("user-1", "user", {}));
    const result = await resolveIssue(VALID_UUID);
    expect(result).toEqual({
      error: "Missing permission: issue:resolve",
      code: "permissionDenied",
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await resolveIssue(VALID_UUID);
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("returns error for invalid UUID", async () => {
    mockAuth.mockResolvedValue(
      authenticatedSession("user-1", "superuser", { "issue:resolve": true }),
    );
    const result = await resolveIssue("bad-id");
    expect(result).toEqual({ error: "Invalid issue ID: not a valid UUID", code: "invalidId" });
  });

  test("returns error when issue not found", async () => {
    mockAuth.mockResolvedValue(
      authenticatedSession("user-1", "superuser", { "issue:resolve": true }),
    );
    mockFindUnique.mockResolvedValue(null);
    const result = await resolveIssue(VALID_UUID);
    expect(result).toEqual({ error: "Issue not found", code: "notFound" });
  });
});
