const mockQuestFindFirst = jest.fn();
const mockQuestFindMany = jest.fn();
const mockQuestUpdate = jest.fn();
const mockSurveyRoundFindFirst = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    quest: {
      findFirst: (...a: any[]) => mockQuestFindFirst(...a),
      findMany: (...a: any[]) => mockQuestFindMany(...a),
      update: (...a: any[]) => mockQuestUpdate(...a),
    },
    surveyRound: {
      findFirst: (...a: any[]) => mockSurveyRoundFindFirst(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/demo-session", () => ({ getDemoSessionId: jest.fn().mockResolvedValue(null) }));

const mockAwardCustomXp = jest.fn().mockResolvedValue(null);
jest.mock("@/lib/gamification/xp-service", () => ({
  awardCustomXp: (...a: any[]) => mockAwardCustomXp(...a),
}));

import { auth } from "@/auth";
import { autoCompleteCampaignQuest, completeWhisperQuest } from "@/lib/campaign-completion";
import { getActiveCampaign } from "@/lib/campaign-queries";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => jest.clearAllMocks());

describe("autoCompleteCampaignQuest", () => {
  test("does nothing when no matching quest exists", async () => {
    mockQuestFindFirst.mockResolvedValue(null);
    await autoCompleteCampaignQuest("u1", "Some Quest");
    expect(mockQuestUpdate).not.toHaveBeenCalled();
  });

  test("completes matching quest and awards XP", async () => {
    mockQuestFindFirst.mockResolvedValue({ id: "q1", xpReward: 50 });
    mockQuestUpdate.mockResolvedValue({});

    await autoCompleteCampaignQuest("u1", "Send your first");
    expect(mockQuestUpdate).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: expect.objectContaining({ status: "completed" }),
    });
    expect(mockAwardCustomXp).toHaveBeenCalledWith("u1", 50, "custom_quest:complete", "q1");
  });

  test("skips XP award when xpReward is 0", async () => {
    mockQuestFindFirst.mockResolvedValue({ id: "q1", xpReward: 0 });
    mockQuestUpdate.mockResolvedValue({});

    await autoCompleteCampaignQuest("u1", "Test");
    expect(mockAwardCustomXp).not.toHaveBeenCalled();
  });

  test("silently catches errors", async () => {
    mockQuestFindFirst.mockRejectedValue(new Error("db error"));
    await expect(autoCompleteCampaignQuest("u1", "Test")).resolves.toBeUndefined();
  });
});

describe("completeWhisperQuest", () => {
  test("does nothing when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    await completeWhisperQuest();
    expect(mockQuestFindFirst).not.toHaveBeenCalled();
  });

  test("auto-completes whisper quest for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockQuestFindFirst.mockResolvedValue(null);
    await completeWhisperQuest();
    expect(mockQuestFindFirst).toHaveBeenCalled();
  });
});

describe("getActiveCampaign", () => {
  test("returns null when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    expect(await getActiveCampaign()).toBeNull();
  });

  test("returns null when no active campaign round", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockSurveyRoundFindFirst.mockResolvedValue(null);
    expect(await getActiveCampaign()).toBeNull();
  });

  test("returns null when no quests for user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockSurveyRoundFindFirst.mockResolvedValue({
      id: "r1",
      title: "Campaign",
      description: null,
      deadline: new Date(),
      customQuestions: null,
    });
    mockQuestFindMany.mockResolvedValue([]);
    expect(await getActiveCampaign()).toBeNull();
  });

  test("returns campaign with quests", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockSurveyRoundFindFirst.mockResolvedValue({
      id: "r1",
      title: "Campaign",
      description: "Do stuff",
      deadline: new Date("2026-04-10"),
      customQuestions: null,
    });
    mockQuestFindMany.mockResolvedValue([
      { id: "q1", title: "Quest 1", xpReward: 50, status: "open", completedAt: null },
    ]);

    const result = await getActiveCampaign();
    expect(result?.roundTitle).toBe("Campaign");
    expect(result?.quests).toHaveLength(1);
    expect(result?.quests[0].title).toBe("Quest 1");
  });
});
