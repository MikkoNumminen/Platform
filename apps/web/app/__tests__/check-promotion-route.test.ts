jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown) => ({
      status: 200,
      json: async () => body,
    }),
  },
}));

const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: (...a: unknown[]) => mockAuth(...a),
}));

const mockFindUnique = jest.fn();
jest.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
  },
}));

import { GET } from "../api/check-promotion/route";

describe("check-promotion route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns promoted:false and hasSeenPromotion:true when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ promoted: false, hasSeenPromotion: true });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("returns promoted:false and hasSeenPromotion:true when user not found in DB", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ promoted: false, hasSeenPromotion: true });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { role: true, hasSeenPromotion: true },
    });
  });

  test("returns promoted:false when user role is pending", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } });
    mockFindUnique.mockResolvedValue({ role: "pending", hasSeenPromotion: false });

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ promoted: false, hasSeenPromotion: false });
  });

  test("returns promoted:true and hasSeenPromotion:false when user is vuohi and has not seen promotion", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-3" } });
    mockFindUnique.mockResolvedValue({ role: "vuohi", hasSeenPromotion: false });

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ promoted: true, hasSeenPromotion: false });
  });

  test("returns promoted:true and hasSeenPromotion:true when user is vuohi and has seen promotion", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-4" } });
    mockFindUnique.mockResolvedValue({ role: "vuohi", hasSeenPromotion: true });

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ promoted: true, hasSeenPromotion: true });
  });
});
