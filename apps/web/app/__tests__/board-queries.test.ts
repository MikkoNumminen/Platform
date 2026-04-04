const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    board: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "vuohiliitto", sessionId: null }),
  getActiveTenant: jest.fn().mockResolvedValue("vuohiliitto"),
}));

import { getBoards, getBoardBySlug } from "@/lib/board-queries";

describe("getBoards", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns boards with post counts", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "b1",
        name: "General",
        slug: "general",
        description: "General discussion",
        _count: { posts: 5 },
      },
      {
        id: "b2",
        name: "Help",
        slug: "help",
        description: null,
        _count: { posts: 0 },
      },
    ]);

    const boards = await getBoards();
    expect(boards).toEqual([
      {
        id: "b1",
        name: "General",
        slug: "general",
        description: "General discussion",
        postCount: 5,
      },
      { id: "b2", name: "Help", slug: "help", description: null, postCount: 0 },
    ]);
  });

  test("queries only non-deleted boards ordered by sortOrder", async () => {
    mockFindMany.mockResolvedValue([]);
    await getBoards();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, tenant: "vuohiliitto", sessionId: null },
        orderBy: { sortOrder: "asc" },
      }),
    );
  });

  test("returns empty array when no boards exist", async () => {
    mockFindMany.mockResolvedValue([]);
    const boards = await getBoards();
    expect(boards).toEqual([]);
  });
});

describe("getBoardBySlug", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns board when found", async () => {
    mockFindFirst.mockResolvedValue({
      id: "b1",
      name: "General",
      slug: "general",
      description: "General discussion",
    });

    const board = await getBoardBySlug("general");
    expect(board).toEqual({
      id: "b1",
      name: "General",
      slug: "general",
      description: "General discussion",
    });
  });

  test("returns null when board not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const board = await getBoardBySlug("nonexistent");
    expect(board).toBeNull();
  });

  test("queries by slug and excludes deleted", async () => {
    mockFindFirst.mockResolvedValue(null);
    await getBoardBySlug("test-board");

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "test-board", deletedAt: null, tenant: "vuohiliitto", sessionId: null },
      }),
    );
  });
});
