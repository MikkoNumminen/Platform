const mockAuth = jest.fn();
const mockUserFindUnique = jest.fn();
const mockAchievementFindUnique = jest.fn();
const mockAchievementCreate = jest.fn();
const mockAchievementUpdate = jest.fn();
const mockAchievementDelete = jest.fn();
const mockQuestFindUnique = jest.fn();
const mockQuestCreate = jest.fn();
const mockQuestUpdate = jest.fn();
const mockQuestDelete = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => mockUserFindUnique(...a) },
    achievement: {
      findUnique: (...a: unknown[]) => mockAchievementFindUnique(...a),
      create: (...a: unknown[]) => mockAchievementCreate(...a),
      update: (...a: unknown[]) => mockAchievementUpdate(...a),
      delete: (...a: unknown[]) => mockAchievementDelete(...a),
    },
    quest: {
      findUnique: (...a: unknown[]) => mockQuestFindUnique(...a),
      create: (...a: unknown[]) => mockQuestCreate(...a),
      update: (...a: unknown[]) => mockQuestUpdate(...a),
      delete: (...a: unknown[]) => mockQuestDelete(...a),
    },
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
  createQuest,
  updateQuest,
  deleteQuest,
} from "@/lib/gamification/admin-actions";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

function adminSession() {
  return { user: { id: "admin-1", role: "admin" } };
}

const validAchievementData = {
  key: "first-post",
  name: "First Post",
  description: "Create your first post",
  icon: "star",
  category: "social",
  criteria: { action: "post:create", count: 1 },
};

const validQuestData = {
  key: "daily-login",
  name: "Daily Login",
  description: "Log in today",
  icon: "calendar",
  type: "daily",
  xpReward: 50,
  criteria: { action: "login", count: 1 },
};

describe("createAchievement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
    mockUserFindUnique.mockResolvedValue({ role: "admin" });
    mockAchievementFindUnique.mockResolvedValue(null);
    mockAchievementCreate.mockResolvedValue({ id: "new-ach" });
  });

  test("creates achievement when admin", async () => {
    const result = await createAchievement(validAchievementData);
    expect(result).toBeUndefined();
    expect(mockAchievementCreate).toHaveBeenCalledTimes(1);
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createAchievement(validAchievementData);
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("returns error when not admin", async () => {
    mockUserFindUnique.mockResolvedValue({ role: "user" });
    const result = await createAchievement(validAchievementData);
    expect(result).toEqual({ error: "Admin access required", code: "permissionDenied" });
  });

  test("returns error for duplicate key", async () => {
    mockAchievementFindUnique.mockResolvedValue({ id: "existing" });
    const result = await createAchievement(validAchievementData);
    expect(result).toEqual({
      error: "An achievement with this key already exists",
      code: "conflict",
    });
  });

  test("returns error for empty key", async () => {
    const result = await createAchievement({ ...validAchievementData, key: "" });
    expect(result).toEqual({ error: "Key is required", code: "invalidInput" });
  });

  test("returns error for empty name", async () => {
    const result = await createAchievement({ ...validAchievementData, name: "" });
    expect(result).toEqual({ error: "Name is required", code: "invalidInput" });
  });

  test("returns error for invalid criteria", async () => {
    const result = await createAchievement({
      ...validAchievementData,
      criteria: "not-an-object" as unknown as Record<string, unknown>,
    });
    expect(result).toEqual({ error: "Criteria must be a valid object", code: "invalidInput" });
  });

  test("allows superuser", async () => {
    mockUserFindUnique.mockResolvedValue({ role: "superuser" });
    const result = await createAchievement(validAchievementData);
    expect(result).toBeUndefined();
  });
});

describe("updateAchievement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
    mockUserFindUnique.mockResolvedValue({ role: "admin" });
    mockAchievementFindUnique.mockResolvedValue({ id: validUUID });
    mockAchievementUpdate.mockResolvedValue({ id: validUUID });
  });

  test("updates achievement", async () => {
    const result = await updateAchievement(validUUID, { name: "Updated" });
    expect(result).toBeUndefined();
    expect(mockAchievementUpdate).toHaveBeenCalledTimes(1);
  });

  test("returns error for invalid UUID", async () => {
    const result = await updateAchievement("bad-id", { name: "Updated" });
    expect(result).toEqual({
      error: "Invalid achievement ID: not a valid UUID",
      code: "invalidId",
    });
  });

  test("returns error when achievement not found", async () => {
    mockAchievementFindUnique.mockResolvedValue(null);
    const result = await updateAchievement(validUUID, { name: "Updated" });
    expect(result).toEqual({ error: "Achievement not found", code: "notFound" });
  });

  test("returns error when not admin", async () => {
    mockUserFindUnique.mockResolvedValue({ role: "user" });
    const result = await updateAchievement(validUUID, { name: "Updated" });
    expect(result).toEqual({ error: "Admin access required", code: "permissionDenied" });
  });
});

describe("deleteAchievement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
    mockUserFindUnique.mockResolvedValue({ role: "admin" });
    mockAchievementFindUnique.mockResolvedValue({ id: validUUID });
    mockAchievementDelete.mockResolvedValue({ id: validUUID });
  });

  test("deletes achievement", async () => {
    const result = await deleteAchievement(validUUID);
    expect(result).toBeUndefined();
    expect(mockAchievementDelete).toHaveBeenCalledWith({ where: { id: validUUID } });
  });

  test("returns error when not found", async () => {
    mockAchievementFindUnique.mockResolvedValue(null);
    const result = await deleteAchievement(validUUID);
    expect(result).toEqual({ error: "Achievement not found", code: "notFound" });
  });

  test("returns error for invalid UUID", async () => {
    const result = await deleteAchievement("bad");
    expect(result).toEqual({
      error: "Invalid achievement ID: not a valid UUID",
      code: "invalidId",
    });
  });
});

describe("createQuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
    mockUserFindUnique.mockResolvedValue({ role: "admin" });
    mockQuestFindUnique.mockResolvedValue(null);
    mockQuestCreate.mockResolvedValue({ id: "new-quest" });
  });

  test("creates quest when admin", async () => {
    const result = await createQuest(validQuestData);
    expect(result).toBeUndefined();
    expect(mockQuestCreate).toHaveBeenCalledTimes(1);
  });

  test("returns error for duplicate key", async () => {
    mockQuestFindUnique.mockResolvedValue({ id: "existing" });
    const result = await createQuest(validQuestData);
    expect(result).toEqual({
      error: "A quest with this key already exists",
      code: "conflict",
    });
  });

  test("returns error for negative XP reward", async () => {
    const result = await createQuest({ ...validQuestData, xpReward: -10 });
    expect(result).toEqual({
      error: "XP reward must be a non-negative number",
      code: "invalidInput",
    });
  });

  test("returns error for empty type", async () => {
    const result = await createQuest({ ...validQuestData, type: "" });
    expect(result).toEqual({ error: "Type is required", code: "invalidInput" });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createQuest(validQuestData);
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });
});

describe("updateQuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
    mockUserFindUnique.mockResolvedValue({ role: "admin" });
    mockQuestFindUnique.mockResolvedValue({ id: validUUID });
    mockQuestUpdate.mockResolvedValue({ id: validUUID });
  });

  test("updates quest", async () => {
    const result = await updateQuest(validUUID, { name: "Updated Quest" });
    expect(result).toBeUndefined();
    expect(mockQuestUpdate).toHaveBeenCalledTimes(1);
  });

  test("returns error when quest not found", async () => {
    mockQuestFindUnique.mockResolvedValue(null);
    const result = await updateQuest(validUUID, { name: "Updated" });
    expect(result).toEqual({ error: "Quest not found", code: "notFound" });
  });

  test("returns error for invalid UUID", async () => {
    const result = await updateQuest("bad", { name: "Updated" });
    expect(result).toEqual({
      error: "Invalid quest ID: not a valid UUID",
      code: "invalidId",
    });
  });
});

describe("deleteQuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
    mockUserFindUnique.mockResolvedValue({ role: "admin" });
    mockQuestFindUnique.mockResolvedValue({ id: validUUID });
    mockQuestDelete.mockResolvedValue({ id: validUUID });
  });

  test("deletes quest", async () => {
    const result = await deleteQuest(validUUID);
    expect(result).toBeUndefined();
    expect(mockQuestDelete).toHaveBeenCalledWith({ where: { id: validUUID } });
  });

  test("returns error when not found", async () => {
    mockQuestFindUnique.mockResolvedValue(null);
    const result = await deleteQuest(validUUID);
    expect(result).toEqual({ error: "Quest not found", code: "notFound" });
  });

  test("returns error when not admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "user" } });
    const result = await deleteQuest("some-uuid");
    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});
