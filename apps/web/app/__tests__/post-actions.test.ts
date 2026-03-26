const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockRevalidatePath = jest.fn();

const mockBoardFindFirst = jest.fn();
const mockPostFindFirst = jest.fn();
const mockPostCreate = jest.fn();
const mockPostUpdate = jest.fn();

jest.mock("@/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    board: {
      findFirst: (...args: unknown[]) => mockBoardFindFirst(...args),
    },
    post: {
      findFirst: (...args: unknown[]) => mockPostFindFirst(...args),
      create: (...args: unknown[]) => mockPostCreate(...args),
      update: (...args: unknown[]) => mockPostUpdate(...args),
    },
  },
}));

import { createPost, updatePost, togglePostPin, deletePost } from "@/lib/post-actions";

function authedSession(
  permissions: Record<string, boolean> = {
    "post:create": true,
    "post:edit": true,
    "post:delete": true,
  },
) {
  return { user: { id: "user-1", permissions } };
}

const boardId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const postId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("createPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockBoardFindFirst.mockResolvedValue({ id: boardId, slug: "general" });
    mockPostFindFirst.mockResolvedValue(null); // no slug conflict
    mockPostCreate.mockResolvedValue({ id: "new-post" });
  });

  test("creates a post with valid data", async () => {
    const result = await createPost(boardId, "My Post", "Post body");
    expect(result).toBeUndefined();
    expect(mockPostCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "My Post",
          slug: "my-post",
          body: "Post body",
          authorId: "user-1",
          boardId,
        }),
      }),
    );
  });

  test("returns error for empty title", async () => {
    const result = await createPost(boardId, "  ", "Body");
    expect(result).toEqual({ error: "Post title is required", code: "invalidPostTitle" });
  });

  test("returns error for title over 200 characters", async () => {
    const result = await createPost(boardId, "a".repeat(201), "Body");
    expect(result).toEqual({
      error: "Post title must be 200 characters or less",
      code: "postTitleTooLong",
    });
  });

  test("returns error for empty body", async () => {
    const result = await createPost(boardId, "Title", "  ");
    expect(result).toEqual({ error: "Post body is required", code: "postBodyRequired" });
  });

  test("returns error when board not found", async () => {
    mockBoardFindFirst.mockResolvedValue(null);
    const result = await createPost(boardId, "Title", "Body");
    expect(result).toEqual({ error: "Board not found", code: "boardNotFound" });
  });

  test("revalidates board path on success", async () => {
    await createPost(boardId, "Title", "Body");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/boards/general");
  });
});

describe("updatePost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockPostFindFirst
      .mockResolvedValueOnce({ id: postId, boardId, board: { slug: "general" } })
      .mockResolvedValue(null); // no slug conflict
    mockPostUpdate.mockResolvedValue({});
  });

  test("updates post title and body", async () => {
    const result = await updatePost(postId, "Updated Title", "Updated body");
    expect(result).toBeUndefined();
    expect(mockPostUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: postId },
        data: expect.objectContaining({
          title: "Updated Title",
          body: "Updated body",
        }),
      }),
    );
  });

  test("returns error when post not found", async () => {
    mockPostFindFirst.mockReset().mockResolvedValue(null);
    const result = await updatePost(postId, "Title", "Body");
    expect(result).toEqual({ error: "Post not found", code: "postNotFound" });
  });
});

describe("togglePostPin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockPostUpdate.mockResolvedValue({});
  });

  test("toggles pinned from false to true", async () => {
    mockPostFindFirst.mockResolvedValue({ id: postId, pinned: false, board: { slug: "general" } });
    const result = await togglePostPin(postId);
    expect(result).toBeUndefined();
    expect(mockPostUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { pinned: true },
      }),
    );
  });

  test("toggles pinned from true to false", async () => {
    mockPostFindFirst.mockResolvedValue({ id: postId, pinned: true, board: { slug: "general" } });
    const result = await togglePostPin(postId);
    expect(result).toBeUndefined();
    expect(mockPostUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { pinned: false },
      }),
    );
  });
});

describe("deletePost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockPostFindFirst.mockResolvedValue({ id: postId, board: { slug: "general" } });
    mockPostUpdate.mockResolvedValue({});
  });

  test("soft-deletes the post", async () => {
    const result = await deletePost(postId);
    expect(result).toBeUndefined();
    expect(mockPostUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: postId },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  test("returns error when post not found", async () => {
    mockPostFindFirst.mockResolvedValue(null);
    const result = await deletePost(postId);
    expect(result).toEqual({ error: "Post not found", code: "postNotFound" });
  });

  test("revalidates board path on success", async () => {
    await deletePost(postId);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/boards/general");
  });
});
