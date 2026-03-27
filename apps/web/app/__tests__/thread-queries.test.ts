const mockFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    thread: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { getThreadsByParent } from "@/lib/thread-queries";

describe("getThreadsByParent", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns flat threads as tree roots", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "t1",
        body: "First comment",
        replyToId: null,
        createdAt: new Date("2026-03-25T10:00:00Z"),
        author: { alias: null, name: "Alice" },
      },
      {
        id: "t2",
        body: "Second comment",
        replyToId: null,
        createdAt: new Date("2026-03-25T11:00:00Z"),
        author: { alias: null, name: "Bob" },
      },
    ]);

    const threads = await getThreadsByParent("POST", "post-1");
    expect(threads).toHaveLength(2);
    expect(threads[0].body).toBe("First comment");
    expect(threads[0].authorName).toBe("Alice");
    expect(threads[0].replies).toEqual([]);
    expect(threads[1].body).toBe("Second comment");
  });

  test("nests replies under their parent thread", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "t1",
        body: "Root comment",
        replyToId: null,
        createdAt: new Date("2026-03-25T10:00:00Z"),
        author: { alias: null, name: "Alice" },
      },
      {
        id: "t2",
        body: "Reply to root",
        replyToId: "t1",
        createdAt: new Date("2026-03-25T10:05:00Z"),
        author: { alias: null, name: "Bob" },
      },
      {
        id: "t3",
        body: "Nested reply",
        replyToId: "t2",
        createdAt: new Date("2026-03-25T10:10:00Z"),
        author: { alias: null, name: "Charlie" },
      },
    ]);

    const threads = await getThreadsByParent("POST", "post-1");
    expect(threads).toHaveLength(1);
    expect(threads[0].replies).toHaveLength(1);
    expect(threads[0].replies[0].body).toBe("Reply to root");
    expect(threads[0].replies[0].replies).toHaveLength(1);
    expect(threads[0].replies[0].replies[0].body).toBe("Nested reply");
  });

  test("returns empty array when no threads exist", async () => {
    mockFindMany.mockResolvedValue([]);
    const threads = await getThreadsByParent("POST", "post-1");
    expect(threads).toEqual([]);
  });

  test("uses 'Unknown' for null author name", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "t1",
        body: "Anonymous comment",
        replyToId: null,
        createdAt: new Date(),
        author: { alias: null, name: null },
      },
    ]);

    const threads = await getThreadsByParent("TOPIC", "topic-1");
    expect(threads[0].authorName).toBe("Unknown");
  });

  test("prefers alias over real name", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "t1",
        body: "Comment with alias",
        replyToId: null,
        createdAt: new Date(),
        author: { alias: "CoolUser", name: "Alice" },
      },
    ]);

    const threads = await getThreadsByParent("POST", "post-1");
    expect(threads[0].authorName).toBe("CoolUser");
  });

  test("orphaned replies become roots", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "t1",
        body: "Reply to deleted parent",
        replyToId: "deleted-thread",
        createdAt: new Date(),
        author: { alias: null, name: "Alice" },
      },
    ]);

    const threads = await getThreadsByParent("POST", "post-1");
    expect(threads).toHaveLength(1);
    expect(threads[0].body).toBe("Reply to deleted parent");
  });

  test("converts createdAt to ISO string", async () => {
    const date = new Date("2026-03-25T10:00:00Z");
    mockFindMany.mockResolvedValue([
      {
        id: "t1",
        body: "Comment",
        replyToId: null,
        createdAt: date,
        author: { alias: null, name: "Alice" },
      },
    ]);

    const threads = await getThreadsByParent("POST", "post-1");
    expect(threads[0].createdAt).toBe(date.toISOString());
  });
});
