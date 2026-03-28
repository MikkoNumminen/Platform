const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockRevalidatePath = jest.fn();

const mockPostFindFirst = jest.fn();
const mockThreadFindFirst = jest.fn();
const mockThreadCreate = jest.fn();
const mockThreadUpdate = jest.fn();

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
    post: {
      findFirst: (...args: unknown[]) => mockPostFindFirst(...args),
    },
    thread: {
      findFirst: (...args: unknown[]) => mockThreadFindFirst(...args),
      create: (...args: unknown[]) => mockThreadCreate(...args),
      update: (...args: unknown[]) => mockThreadUpdate(...args),
    },
  },
}));

import { createThread, deleteThread } from "@/lib/thread-actions";

function authedSession(
  permissions: Record<string, boolean> = {
    "thread:create": true,
    "thread:delete": true,
  },
) {
  return { user: { id: "user-1", permissions } };
}

const parentId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const threadId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const replyToId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

describe("createThread", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockPostFindFirst.mockResolvedValue({ id: parentId });
    mockThreadFindFirst.mockResolvedValue(null);
    mockThreadCreate.mockResolvedValue({ id: "new-thread" });
  });

  test("creates a thread with valid data", async () => {
    const result = await createThread("POST", parentId, "Hello world");
    expect(result).toBeUndefined();
    expect(mockThreadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          body: "Hello world",
          parentType: "POST",
          parentId,
          authorId: "user-1",
          replyToId: null,
        }),
      }),
    );
  });

  test("creates a reply to another thread", async () => {
    mockThreadFindFirst.mockResolvedValue({ id: replyToId });
    const result = await createThread("POST", parentId, "Reply", replyToId);
    expect(result).toBeUndefined();
    expect(mockThreadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          replyToId,
        }),
      }),
    );
  });

  test("returns error for empty body", async () => {
    const result = await createThread("POST", parentId, "  ");
    expect(result).toEqual({
      error: "Comment is required",
      code: "threadBodyRequired",
    });
  });

  test("returns error for body exceeding 5000 characters", async () => {
    const result = await createThread("POST", parentId, "a".repeat(5001));
    expect(result).toEqual({
      error: "Comment must be 5000 characters or less",
      code: "threadBodyRequired",
    });
  });

  test("returns error for invalid parentId UUID", async () => {
    const result = await createThread("POST", "bad-id", "Hello");
    expect(result).toEqual({
      error: "Invalid parentId: not a valid UUID",
      code: "invalidId",
    });
  });

  test("returns error when parent post not found", async () => {
    mockPostFindFirst.mockResolvedValue(null);
    const result = await createThread("POST", parentId, "Hello");
    expect(result).toEqual({
      error: "Post not found",
      code: "postNotFound",
    });
  });

  test("returns error when reply target not found", async () => {
    mockThreadFindFirst.mockResolvedValue(null);
    const result = await createThread("POST", parentId, "Reply", replyToId);
    expect(result).toEqual({
      error: "Reply target not found",
      code: "threadNotFound",
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createThread("POST", parentId, "Hello");
    expect(result).toEqual({
      error: "Not authenticated",
      code: "permissionDenied",
    });
  });

  test("returns error without thread:create permission", async () => {
    mockAuth.mockResolvedValue(authedSession({ "thread:create": false }));
    const result = await createThread("POST", parentId, "Hello");
    expect(result).toEqual({
      error: "Missing permission: thread:create",
      code: "permissionDenied",
    });
  });

  test("revalidates path when provided", async () => {
    await createThread("POST", parentId, "Hello", undefined, "/boards/general/my-post");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/boards/general/my-post");
  });

  test("does not revalidate when no url provided", async () => {
    await createThread("POST", parentId, "Hello");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  test("accepts body at exactly 5000 characters", async () => {
    const result = await createThread("POST", parentId, "a".repeat(5000));
    expect(result).toBeUndefined();
  });
});

describe("deleteThread", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockThreadFindFirst.mockResolvedValue({ id: threadId, authorId: "user-1" });
    mockThreadUpdate.mockResolvedValue({});
  });

  test("soft-deletes the thread", async () => {
    const result = await deleteThread(threadId);
    expect(result).toBeUndefined();
    expect(mockThreadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: threadId },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  test("returns error when thread not found", async () => {
    mockThreadFindFirst.mockResolvedValue(null);
    const result = await deleteThread(threadId);
    expect(result).toEqual({
      error: "Comment not found",
      code: "threadNotFound",
    });
  });

  test("returns error for invalid UUID", async () => {
    const result = await deleteThread("bad-id");
    expect(result).toEqual({
      error: "Invalid threadId: not a valid UUID",
      code: "invalidId",
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteThread(threadId);
    expect(result).toEqual({
      error: "Not authenticated",
      code: "permissionDenied",
    });
  });

  test("revalidates path when provided", async () => {
    await deleteThread(threadId, "/boards/general/my-post");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/boards/general/my-post");
  });
});
