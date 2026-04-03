const mockPlatformSettingUpsert = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    platformSetting: {
      upsert: (...a: any[]) => mockPlatformSettingUpsert(...a),
    },
    user: {
      findUnique: (...a: any[]) => mockUserFindUnique(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { auth } from "@/auth";
import { setMotd } from "@/lib/setting-actions";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => jest.clearAllMocks());

describe("setMotd", () => {
  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await setMotd("hello");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("allows superuser to set MOTD", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "superuser" } } as any);
    mockPlatformSettingUpsert.mockResolvedValue({});

    const result = await setMotd("Welcome!");
    expect(result).toBeUndefined();
    expect(mockPlatformSettingUpsert).toHaveBeenCalledWith({
      where: { key: "motd" },
      create: { key: "motd", value: "Welcome!" },
      update: { value: "Welcome!" },
    });
  });

  test("allows architect to set MOTD", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "vuohi" } } as any);
    mockUserFindUnique.mockResolvedValue({ developerTag: "architect" });
    mockPlatformSettingUpsert.mockResolvedValue({});

    const result = await setMotd("Hello!");
    expect(result).toBeUndefined();
  });

  test("rejects non-superuser non-architect", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "user" } } as any);
    mockUserFindUnique.mockResolvedValue({ developerTag: null });

    const result = await setMotd("hello");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error for empty message", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "superuser" } } as any);
    const result = await setMotd("   ");
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });

  test("returns error for message over 300 chars", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "superuser" } } as any);
    const result = await setMotd("a".repeat(301));
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });
});
