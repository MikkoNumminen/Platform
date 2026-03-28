const mockAuth = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({ get: () => null }),
}));

import { markPromotionSeen } from "@/lib/promotion-actions";

describe("markPromotionSeen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  test("sets hasSeenPromotion to true for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await markPromotionSeen();
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        hasSeenPromotion: true,
        permissionsVersion: { increment: 1 },
      },
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await markPromotionSeen();
    expect(result).toEqual({
      error: "Not authenticated",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
