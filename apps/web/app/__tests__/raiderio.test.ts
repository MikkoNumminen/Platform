import { fetchRaiderIoCharacter } from "@/lib/raiderio";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const validResponse = {
  name: "Testchar",
  race: "Human",
  class: "Warrior",
  active_spec_name: "Arms",
  active_spec_role: "DPS",
  region: "eu",
  realm: "tarren-mill",
  thumbnail_url: "https://render.worldofwarcraft.com/avatar.jpg",
  profile_url: "https://raider.io/characters/eu/tarren-mill/testchar",
  gear: { item_level_equipped: 489 },
  mythic_plus_scores_by_season: [{ scores: { all: 2500.5 } }],
};

describe("fetchRaiderIoCharacter", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test("parses a valid response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(validResponse),
    });

    const result = await fetchRaiderIoCharacter("testchar", "tarren-mill", "eu");

    expect(result.name).toBe("Testchar");
    expect(result.className).toBe("Warrior");
    expect(result.spec).toBe("Arms");
    expect(result.specRole).toBe("DPS");
    expect(result.race).toBe("Human");
    expect(result.itemLevel).toBe(489);
    expect(result.mythicPlusRating).toBe(2500.5);
    expect(result.thumbnailUrl).toBe("https://render.worldofwarcraft.com/avatar.jpg");
    expect(result.profileUrl).toBe("https://raider.io/characters/eu/tarren-mill/testchar");
  });

  test("throws characterNotFound on 404", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchRaiderIoCharacter("nobody", "fake-realm", "eu")).rejects.toThrow("not found");
  });

  test("throws raiderIoError on 500", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchRaiderIoCharacter("test", "realm", "eu")).rejects.toThrow("status 500");
  });

  test("handles missing gear and scores gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          ...validResponse,
          gear: undefined,
          mythic_plus_scores_by_season: [],
        }),
    });

    const result = await fetchRaiderIoCharacter("test", "realm", "eu");
    expect(result.itemLevel).toBe(0);
    expect(result.mythicPlusRating).toBe(0);
  });
});
