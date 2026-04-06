const mockAuth = jest.fn();
const mockWowCreate = jest.fn();
const mockWowFindFirst = jest.fn();
const mockWowFindMany = jest.fn();
const mockWowDelete = jest.fn();
const mockWowUpdate = jest.fn();
const mockFetchRaiderIo = jest.fn();

jest.mock("@/auth", () => ({ auth: () => mockAuth() }));

jest.mock("@/lib/db", () => ({
  prisma: {
    wowCharacter: {
      create: (...a: unknown[]) => mockWowCreate(...a),
      findFirst: (...a: unknown[]) => mockWowFindFirst(...a),
      findMany: (...a: unknown[]) => mockWowFindMany(...a),
      delete: (...a: unknown[]) => mockWowDelete(...a),
      update: (...a: unknown[]) => mockWowUpdate(...a),
    },
  },
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "platform", sessionId: null }),
}));

jest.mock("@/lib/raiderio", () => ({
  fetchRaiderIoCharacter: (...a: unknown[]) => mockFetchRaiderIo(...a),
}));

import { addCharacter, removeCharacter, refreshCharacter } from "@/lib/mythicplus-actions";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

const raiderIoResult = {
  name: "Testchar",
  realm: "tarren-mill",
  region: "eu",
  className: "Warrior",
  spec: "Arms",
  specRole: "DPS",
  race: "Human",
  itemLevel: 489,
  mythicPlusRating: 2500,
  thumbnailUrl: "https://example.com/avatar.jpg",
  profileUrl: "https://raider.io/characters/eu/tarren-mill/testchar",
};

describe("addCharacter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockWowFindFirst.mockResolvedValue(null);
    mockFetchRaiderIo.mockResolvedValue(raiderIoResult);
    mockWowCreate.mockResolvedValue({ id: "c1" });
  });

  test("succeeds with valid input", async () => {
    const result = await addCharacter("Testchar", "Tarren Mill", "eu");
    expect(result?.error).toBeUndefined();
    expect(mockWowCreate).toHaveBeenCalled();
  });

  test("rejects unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await addCharacter("Test", "Realm", "eu");
    expect(result?.error).toBeTruthy();
  });

  test("rejects empty name", async () => {
    const result = await addCharacter("", "Realm", "eu");
    expect(result?.error).toContain("required");
  });

  test("rejects invalid region", async () => {
    const result = await addCharacter("Test", "Realm", "xx");
    expect(result?.error).toContain("Invalid region");
  });

  test("rejects duplicate character", async () => {
    mockWowFindFirst.mockResolvedValue({ id: "existing" });
    const result = await addCharacter("Test", "Realm", "eu");
    expect(result?.error).toContain("already been added");
  });
});

describe("removeCharacter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockWowFindFirst.mockResolvedValue({ id: validUUID });
    mockWowDelete.mockResolvedValue({});
  });

  test("succeeds", async () => {
    const result = await removeCharacter(validUUID);
    expect(result?.error).toBeUndefined();
    expect(mockWowDelete).toHaveBeenCalled();
  });

  test("rejects not found", async () => {
    mockWowFindFirst.mockResolvedValue(null);
    const result = await removeCharacter(validUUID);
    expect(result?.error).toContain("not found");
  });
});

describe("refreshCharacter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockWowFindFirst.mockResolvedValue({
      id: validUUID,
      characterName: "Test",
      realm: "realm",
      region: "eu",
    });
    mockFetchRaiderIo.mockResolvedValue(raiderIoResult);
    mockWowUpdate.mockResolvedValue({});
  });

  test("succeeds", async () => {
    const result = await refreshCharacter(validUUID);
    expect(result?.error).toBeUndefined();
    expect(mockWowUpdate).toHaveBeenCalled();
  });
});
