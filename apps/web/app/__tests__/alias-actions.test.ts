const mockAuth = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

const mockFindUnique = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

jest.mock("@/lib/gamification/trigger", () => ({
  triggerGamification: jest.fn().mockResolvedValue(undefined),
}));

import { setAlias, toggleWantsToDevelop, getMyDeveloperInfo } from "@/lib/alias-actions";

function authenticatedSession(id = "user-1") {
  return { user: { id } };
}

describe("setAlias", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(null); // no conflict by default
    mockUpdate.mockResolvedValue({ id: "user-1" });
  });

  test("sets alias for authenticated user", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await setAlias("TestAlias");
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { alias: "TestAlias" },
    });
  });

  test("trims whitespace from alias", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    await setAlias("  trimmed  ");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { alias: "trimmed" },
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await setAlias("MyAlias");
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("returns error for alias too short", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await setAlias("a");
    expect(result).toEqual({
      error: "Alias must be between 2 and 30 characters",
      code: "invalidInput",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("returns error for alias too long", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await setAlias("a".repeat(31));
    expect(result).toEqual({
      error: "Alias must be between 2 and 30 characters",
      code: "invalidInput",
    });
  });

  test("returns error for invalid characters", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await setAlias("bad alias!");
    expect(result).toEqual({
      error: "Alias can only contain letters, numbers, hyphens, and underscores",
      code: "invalidInput",
    });
  });

  test("returns error when alias is taken", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockFindFirst.mockResolvedValue({ id: "other-user", alias: "TakenAlias" });
    const result = await setAlias("TakenAlias");
    expect(result).toEqual({ error: "This alias is already taken", code: "conflict" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("checks uniqueness excluding current user", async () => {
    mockAuth.mockResolvedValue(authenticatedSession("user-1"));
    mockFindFirst.mockResolvedValue(null);
    await setAlias("MyAlias");
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { alias: "MyAlias", id: { not: "user-1" } },
    });
  });

  test("allows hyphens and underscores", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await setAlias("test-user_123");
    expect(result).toBeUndefined();
  });
});

describe("toggleWantsToDevelop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  test("sets wantsToDevelop to true", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await toggleWantsToDevelop(true);
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { wantsToDevelop: true },
    });
  });

  test("sets wantsToDevelop to false", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await toggleWantsToDevelop(false);
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { wantsToDevelop: false },
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await toggleWantsToDevelop(true);
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });
});

describe("getMyDeveloperInfo", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns null when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await getMyDeveloperInfo()).toBeNull();
  });

  test("returns developer info when authenticated", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockFindUnique.mockResolvedValue({ wantsToDevelop: true, developerTag: "architect" });
    const result = await getMyDeveloperInfo();
    expect(result).toEqual({ wantsToDevelop: true, developerTag: "architect" });
  });

  test("returns null when user not found", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockFindUnique.mockResolvedValue(null);
    expect(await getMyDeveloperInfo()).toBeNull();
  });
});
