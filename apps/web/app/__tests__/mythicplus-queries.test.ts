/* eslint-disable @typescript-eslint/no-explicit-any */

const mockWowCharacterFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    wowCharacter: { findMany: (...a: any[]) => mockWowCharacterFindMany(...a) },
  },
}));

jest.mock("@/lib/demo-session", () => ({ getDemoSessionId: jest.fn().mockResolvedValue(null) }));

import { getTeamCharacters } from "@/lib/mythicplus-queries";

beforeEach(() => jest.clearAllMocks());

describe("getTeamCharacters", () => {
  test("returns formatted character list", async () => {
    mockWowCharacterFindMany.mockResolvedValue([
      {
        id: "c1",
        characterName: "Thrall",
        realm: "Area-52",
        region: "us",
        className: "Shaman",
        spec: "Enhancement",
        specRole: "dps",
        race: "Orc",
        itemLevel: 620,
        mythicPlusRating: 2500,
        thumbnailUrl: null,
        profileUrl: null,
        lastFetchedAt: new Date("2026-04-01"),
        createdAt: new Date("2026-03-01"),
        addedBy: { alias: "Player1", name: "P1" },
      },
    ]);

    const result = await getTeamCharacters();
    expect(result).toHaveLength(1);
    expect(result[0].characterName).toBe("Thrall");
    expect(result[0].addedBy).toBe("Player1");
    expect(result[0].lastFetchedAt).toBe("2026-04-01T00:00:00.000Z");
  });

  test("returns empty array when no characters", async () => {
    mockWowCharacterFindMany.mockResolvedValue([]);
    expect(await getTeamCharacters()).toEqual([]);
  });
});

// Note: getTeams() references MythicPlusTeam model which doesn't exist in schema yet
