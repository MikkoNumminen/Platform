const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    post: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
}));

import { getPostsByBoard, getPostBySlug } from "@/lib/post-queries";

describe("getPostsByBoard", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns posts mapped with author name", async () => {
    const now = new Date("2026-03-25T10:00:00Z");
    mockFindMany.mockResolvedValue([
      {
        id: "p1",
        title: "First post",
        slug: "first-post",
        pinned: true,
        createdAt: now,
        author: { alias: null, name: "Alice" },
      },
    ]);

    const posts = await getPostsByBoard("board-1");
    expect(posts).toEqual([
      {
        id: "p1",
        title: "First post",
        slug: "first-post",
        pinned: true,
        authorName: "Alice",
        createdAt: now,
      },
    ]);
  });

  test("prefers alias over real name", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "p1",
        title: "Post",
        slug: "post",
        pinned: false,
        createdAt: new Date(),
        author: { alias: "CoolAlias", name: "Alice" },
      },
    ]);

    const posts = await getPostsByBoard("board-1");
    expect(posts[0].authorName).toBe("CoolAlias");
  });

  test("uses 'Unknown' for null author name and alias", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "p1",
        title: "Post",
        slug: "post",
        pinned: false,
        createdAt: new Date(),
        author: { alias: null, name: null },
      },
    ]);

    const posts = await getPostsByBoard("board-1");
    expect(posts[0].authorName).toBe("Unknown");
  });

  test("orders by pinned desc then createdAt desc", async () => {
    mockFindMany.mockResolvedValue([]);
    await getPostsByBoard("board-1");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      }),
    );
  });

  test("filters by boardId and excludes deleted", async () => {
    mockFindMany.mockResolvedValue([]);
    await getPostsByBoard("board-123");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { boardId: "board-123", deletedAt: null, sessionId: null },
      }),
    );
  });
});

describe("getPostBySlug", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns post detail when found", async () => {
    const now = new Date("2026-03-25T10:00:00Z");
    mockFindFirst.mockResolvedValue({
      id: "p1",
      title: "My Post",
      slug: "my-post",
      body: "Post body content",
      pinned: false,
      authorId: "user-1",
      createdAt: now,
      author: { alias: null, name: "Bob" },
    });

    const post = await getPostBySlug("board-1", "my-post");
    expect(post).toEqual({
      id: "p1",
      title: "My Post",
      slug: "my-post",
      body: "Post body content",
      pinned: false,
      authorId: "user-1",
      authorName: "Bob",
      createdAt: now,
    });
  });

  test("returns null when post not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const post = await getPostBySlug("board-1", "nonexistent");
    expect(post).toBeNull();
  });
});
