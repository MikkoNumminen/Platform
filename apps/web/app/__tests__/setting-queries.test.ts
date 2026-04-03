const mockPlatformSettingFindUnique = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    platformSetting: {
      findUnique: (...a: any[]) => mockPlatformSettingFindUnique(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
}));

import { getMotd } from "@/lib/setting-queries";

beforeEach(() => jest.clearAllMocks());

describe("getMotd", () => {
  test("returns motd value from database when setting exists", async () => {
    mockPlatformSettingFindUnique.mockResolvedValue({ key: "motd", value: "Hello, guild!" });

    const result = await getMotd();

    expect(result).toBe("Hello, guild!");
    expect(mockPlatformSettingFindUnique).toHaveBeenCalledWith({ where: { key: "motd" } });
  });

  test("returns default motd when no setting found", async () => {
    mockPlatformSettingFindUnique.mockResolvedValue(null);

    const result = await getMotd();

    expect(result).toBe("Welcome. Type /help for commands.");
  });

  test("returns default motd when database throws", async () => {
    mockPlatformSettingFindUnique.mockRejectedValue(new Error("relation does not exist"));

    const result = await getMotd();

    expect(result).toBe("Welcome. Type /help for commands.");
  });
});
