const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockRevalidatePath = jest.fn();

const mockQuestFindFirst = jest.fn();
const mockQuestCreate = jest.fn();
const mockQuestUpdate = jest.fn();
const mockUserQuestProgressCreate = jest.fn();
const mockUserFindFirst = jest.fn();
const mockUserFindUnique = jest.fn();
const mockAwardCustomXp = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: any[]) => mockRateLimit(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    quest: {
      findFirst: (...args: any[]) => mockQuestFindFirst(...args),
      create: (...args: any[]) => mockQuestCreate(...args),
      update: (...args: any[]) => mockQuestUpdate(...args),
    },
    userQuestProgress: {
      create: (...args: any[]) => mockUserQuestProgressCreate(...args),
    },
    user: {
      findFirst: (...args: any[]) => mockUserFindFirst(...args),
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
  },
}));

jest.mock("@/lib/gamification/xp-service", () => ({
  awardCustomXp: (...args: any[]) => mockAwardCustomXp(...args),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({ get: () => null }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@/lib/guardedAction", () => require("./helpers/mock-guarded-action"));

import {
  createCustomQuest,
  updateCustomQuest,
  completeCustomQuest,
  deleteCustomQuest,
} from "@/lib/custom-quest-actions";
import { resolvePermissions } from "@/lib/permissions";

const superuserSession = () => ({
  user: { id: "superuser-1", role: "superuser", permissions: resolvePermissions("superuser") },
});

const userSession = () => ({
  user: { id: "user-1", role: "user", permissions: resolvePermissions("user") },
});

const questId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const assigneeId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("createCustomQuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  test("superuser can create a quest", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockUserFindFirst.mockResolvedValue({ id: assigneeId });
    mockQuestCreate.mockResolvedValue({ id: questId });

    const result = await createCustomQuest(
      "Check GDPR",
      "Review GDPR compliance",
      assigneeId,
      100,
      "high",
      null,
      null,
    );

    expect(result).toBeUndefined();
    expect(mockQuestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Check GDPR",
          description: "Review GDPR compliance",
          xpReward: 100,
          type: "assigned",
          priority: "high",
          assigneeId,
          creatorId: "superuser-1",
        }),
      }),
    );
  });

  test("regular user cannot create a quest", async () => {
    mockAuth.mockResolvedValue(userSession());

    const result = await createCustomQuest("Test", "Test", assigneeId, 50, null, null, null);

    expect(result).toEqual({
      error: expect.stringContaining("Missing permission"),
      code: "permissionDenied",
    });
    expect(mockQuestCreate).not.toHaveBeenCalled();
  });

  test("rejects invalid assignee", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockUserFindFirst.mockResolvedValue(null);

    const result = await createCustomQuest("Test", "Test", assigneeId, 50, null, null, null);

    expect(result).toEqual({ error: "Assignee not found", code: "notFound" });
  });

  test("rejects XP reward out of range", async () => {
    mockAuth.mockResolvedValue(superuserSession());

    const result = await createCustomQuest("Test", "Test", assigneeId, 99999, null, null, null);

    expect(result).toEqual({
      error: "XP reward must be between 0 and 10,000",
      code: "invalidInput",
    });
  });
});

describe("completeCustomQuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  test("superuser can complete a quest and XP is awarded", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({
      id: questId,
      status: "in_progress",
      xpReward: 200,
      assigneeId,
    });
    mockQuestUpdate.mockResolvedValue({});
    mockAwardCustomXp.mockResolvedValue(null);

    const result = await completeCustomQuest(questId);

    expect(result).toBeUndefined();
    expect(mockQuestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "completed", completedAt: expect.any(Date) },
      }),
    );
    expect(mockAwardCustomXp).toHaveBeenCalledWith(
      assigneeId,
      200,
      "custom_quest:complete",
      questId,
    );
  });

  test("cannot complete already completed quest", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({
      id: questId,
      status: "completed",
      xpReward: 100,
      assigneeId,
    });

    const result = await completeCustomQuest(questId);

    expect(result).toEqual({
      error: "Quest is already completed",
      code: "questAlreadyCompleted",
    });
  });

  test("skips XP award when reward is 0", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({
      id: questId,
      status: "open",
      xpReward: 0,
      assigneeId,
    });
    mockQuestUpdate.mockResolvedValue({});

    await completeCustomQuest(questId);

    expect(mockAwardCustomXp).not.toHaveBeenCalled();
  });

  test("awards double XP when assignee skill matches quest targetSkill", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({
      id: questId,
      status: "open",
      xpReward: 100,
      assigneeId,
      targetSkill: "Coding (frontend)",
    });
    mockQuestUpdate.mockResolvedValue({});
    mockUserFindUnique.mockResolvedValue({
      developmentSkills: ["Coding (frontend)", "Testing / QA"],
    });
    mockAwardCustomXp.mockResolvedValue(null);

    await completeCustomQuest(questId);

    expect(mockAwardCustomXp).toHaveBeenCalledWith(
      assigneeId,
      200, // doubled
      "custom_quest:complete",
      questId,
    );
  });

  test("awards normal XP when assignee skill does not match quest targetSkill", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({
      id: questId,
      status: "open",
      xpReward: 100,
      assigneeId,
      targetSkill: "Graphic art / illustrations",
    });
    mockQuestUpdate.mockResolvedValue({});
    mockUserFindUnique.mockResolvedValue({
      developmentSkills: ["Coding (frontend)"],
    });
    mockAwardCustomXp.mockResolvedValue(null);

    await completeCustomQuest(questId);

    expect(mockAwardCustomXp).toHaveBeenCalledWith(
      assigneeId,
      100, // not doubled
      "custom_quest:complete",
      questId,
    );
  });
});

describe("updateCustomQuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  test("superuser can update quest title and priority", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({ id: questId, status: "open" });
    mockQuestUpdate.mockResolvedValue({});

    const result = await updateCustomQuest(questId, { title: "Updated", priority: "urgent" });

    expect(result).toBeUndefined();
    expect(mockQuestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Updated", priority: "urgent" }),
      }),
    );
  });

  test("cannot edit completed quest", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({ id: questId, status: "completed" });

    const result = await updateCustomQuest(questId, { title: "Nope" });

    expect(result).toEqual({
      error: "Cannot edit a completed quest",
      code: "questAlreadyCompleted",
    });
  });
});

describe("deleteCustomQuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  test("superuser can soft-delete a quest", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue({ id: questId });
    mockQuestUpdate.mockResolvedValue({});

    const result = await deleteCustomQuest(questId);

    expect(result).toBeUndefined();
    expect(mockQuestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  test("returns error for non-existent quest", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockQuestFindFirst.mockResolvedValue(null);

    const result = await deleteCustomQuest(questId);

    expect(result).toEqual({ error: "Quest not found", code: "questNotFound" });
  });
});
