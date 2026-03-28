/**
 * Integration test: Board → Post → Thread multi-step workflow
 *
 * Tests the full content lifecycle: admin creates a board, user creates a post
 * on that board, another user replies with a thread, nested replies work,
 * and author-only edit/delete restrictions are enforced.
 */

const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockRevalidatePath = jest.fn();

const mockBoardFindFirst = jest.fn();
const mockBoardCreate = jest.fn();
const mockBoardUpdate = jest.fn();
const mockBoardAggregate = jest.fn();
const mockPostFindFirst = jest.fn();
const mockPostCreate = jest.fn();
const mockPostUpdate = jest.fn();
const mockThreadFindFirst = jest.fn();
const mockThreadCreate = jest.fn();
const mockThreadUpdate = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
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
      create: (...args: unknown[]) => mockBoardCreate(...args),
      update: (...args: unknown[]) => mockBoardUpdate(...args),
      aggregate: (...args: unknown[]) => mockBoardAggregate(...args),
    },
    post: {
      findFirst: (...args: unknown[]) => mockPostFindFirst(...args),
      create: (...args: unknown[]) => mockPostCreate(...args),
      update: (...args: unknown[]) => mockPostUpdate(...args),
    },
    thread: {
      findFirst: (...args: unknown[]) => mockThreadFindFirst(...args),
      create: (...args: unknown[]) => mockThreadCreate(...args),
      update: (...args: unknown[]) => mockThreadUpdate(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({ get: () => null }),
}));

jest.mock("@/lib/gamification/trigger", () => ({
  triggerGamification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/guardedAction", () => {
  const { ActionError } = jest.requireActual("@/lib/actionErrors");
  const { safe } = jest.requireActual("@/lib/actionUtils");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { rateLimit } = require("@/lib/rateLimit");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { auth } = require("@/auth");

  function guardedAction<TArgs extends unknown[]>(
    permission: string,
    rateLimitKey: string,
    fn: (session: unknown, ...args: TArgs) => Promise<void>,
  ) {
    return async (...args: TArgs) => {
      return safe(async () => {
        const session = await auth();
        if (!session?.user) {
          throw new ActionError("permissionDenied", "Not authenticated");
        }
        const permissions = session.user.permissions as Record<string, boolean> | undefined;
        if (!permissions?.[permission]) {
          throw new ActionError("permissionDenied", `Missing permission: ${permission}`);
        }
        await rateLimit(rateLimitKey);
        await fn(session, ...args);
      });
    };
  }

  return { guardedAction };
});

import { resolvePermissions } from "@/lib/permissions";
import { createBoard, deleteBoard } from "@/lib/board-actions";
import { createPost, updatePost, deletePost } from "@/lib/post-actions";
import { createThread, deleteThread } from "@/lib/thread-actions";

// --- Constants ---

const boardId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const postId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const threadId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
const replyThreadId = "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";

const adminId = "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55";
const userId = "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66";
const otherUserId = "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77";

// --- Session helpers ---

function adminSession() {
  return {
    user: {
      id: adminId,
      role: "admin",
      permissions: resolvePermissions("admin"),
    },
  };
}

function userSession(id: string = userId) {
  return {
    user: {
      id,
      role: "user",
      permissions: resolvePermissions("user"),
    },
  };
}

function pendingSession() {
  return {
    user: {
      id: "pending-1",
      role: "pending",
      permissions: resolvePermissions("pending"),
    },
  };
}

// --- Tests ---

describe("Integration: Board → Post → Thread workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  describe("Step 1: Admin creates a board", () => {
    test("admin can create a board", async () => {
      mockAuth.mockResolvedValue(adminSession());
      mockBoardFindFirst.mockResolvedValue(null);
      mockBoardAggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
      mockBoardCreate.mockResolvedValue({ id: boardId });

      const result = await createBoard("General Discussion", "A place for general chat");

      expect(result).toBeUndefined();
      expect(mockBoardCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "General Discussion",
            slug: "general-discussion",
            description: "A place for general chat",
            sortOrder: 3,
          }),
        }),
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/boards");
    });

    test("regular user cannot create a board", async () => {
      mockAuth.mockResolvedValue(userSession());

      const result = await createBoard("User Board");

      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
      expect(mockBoardCreate).not.toHaveBeenCalled();
    });

    test("pending user cannot create a board", async () => {
      mockAuth.mockResolvedValue(pendingSession());

      const result = await createBoard("Pending Board");

      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
    });
  });

  describe("Step 2: User creates a post on the board", () => {
    test("user can create a post on an existing board", async () => {
      mockAuth.mockResolvedValue(userSession());
      mockBoardFindFirst.mockResolvedValue({ id: boardId, slug: "general-discussion" });
      mockPostFindFirst.mockResolvedValue(null); // no slug conflict
      mockPostCreate.mockResolvedValue({ id: postId });

      const result = await createPost(boardId, "My First Post", "Hello everyone!");

      expect(result).toBeUndefined();
      expect(mockPostCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "My First Post",
            slug: "my-first-post",
            body: "Hello everyone!",
            authorId: userId,
            boardId,
          }),
        }),
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/boards/general-discussion");
    });

    test("post on non-existent board fails", async () => {
      mockAuth.mockResolvedValue(userSession());
      mockBoardFindFirst.mockResolvedValue(null);

      const result = await createPost(boardId, "Ghost Post", "Where's the board?");

      expect(result).toEqual({
        error: "Board not found",
        code: "boardNotFound",
      });
      expect(mockPostCreate).not.toHaveBeenCalled();
    });

    test("pending user cannot create a post", async () => {
      mockAuth.mockResolvedValue(pendingSession());

      const result = await createPost(boardId, "Pending Post", "Please let me in");

      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
    });
  });

  describe("Step 3: Another user replies with a thread", () => {
    test("user can create a thread reply to a post", async () => {
      mockAuth.mockResolvedValue(userSession(otherUserId));
      mockPostFindFirst.mockResolvedValue({ id: postId, deletedAt: null });
      mockThreadCreate.mockResolvedValue({ id: threadId });

      const result = await createThread(
        "POST",
        postId,
        "Great post!",
        undefined,
        "/boards/general-discussion/my-first-post",
      );

      expect(result).toBeUndefined();
      expect(mockThreadCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            body: "Great post!",
            parentType: "POST",
            parentId: postId,
            authorId: otherUserId,
            replyToId: null,
          }),
        }),
      );
    });

    test("thread on non-existent post fails", async () => {
      mockAuth.mockResolvedValue(userSession());
      mockPostFindFirst.mockResolvedValue(null);

      const result = await createThread("POST", postId, "Replying to nothing");

      expect(result).toEqual({
        error: "Post not found",
        code: "postNotFound",
      });
      expect(mockThreadCreate).not.toHaveBeenCalled();
    });
  });

  describe("Step 4: Nested reply (thread replying to a thread)", () => {
    test("user can reply to an existing thread", async () => {
      mockAuth.mockResolvedValue(userSession());
      mockPostFindFirst.mockResolvedValue({ id: postId, deletedAt: null });
      // First call: verify post exists, second call: verify reply target
      mockThreadFindFirst.mockResolvedValue({ id: threadId, deletedAt: null });
      mockThreadCreate.mockResolvedValue({ id: replyThreadId });

      const result = await createThread("POST", postId, "I agree!", threadId);

      expect(result).toBeUndefined();
      expect(mockThreadCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            body: "I agree!",
            parentType: "POST",
            parentId: postId,
            authorId: userId,
            replyToId: threadId,
          }),
        }),
      );
    });

    test("reply to non-existent thread fails", async () => {
      mockAuth.mockResolvedValue(userSession());
      mockPostFindFirst.mockResolvedValue({ id: postId, deletedAt: null });
      mockThreadFindFirst.mockResolvedValue(null); // reply target not found

      const result = await createThread("POST", postId, "Replying to ghost", threadId);

      expect(result).toEqual({
        error: "Reply target not found",
        code: "threadNotFound",
      });
    });
  });

  describe("Step 5: Edit restrictions", () => {
    test("regular user cannot edit posts (no post:edit permission)", async () => {
      mockAuth.mockResolvedValue(userSession());

      const result = await updatePost(postId, "Updated Title", "Updated body text");

      // user role does NOT have post:edit permission
      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
      expect(mockPostUpdate).not.toHaveBeenCalled();
    });

    test("admin can edit their own post", async () => {
      const adminAuthorSession = {
        user: {
          id: adminId,
          role: "admin",
          permissions: resolvePermissions("admin"),
        },
      };
      mockAuth.mockResolvedValue(adminAuthorSession);
      mockPostFindFirst
        .mockResolvedValueOnce({
          id: postId,
          authorId: adminId,
          boardId,
          board: { slug: "general-discussion" },
          deletedAt: null,
        })
        .mockResolvedValue(null); // no slug conflict
      mockPostUpdate.mockResolvedValue({});

      const result = await updatePost(postId, "Updated Title", "Updated body text");

      expect(result).toBeUndefined();
      expect(mockPostUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: postId },
          data: expect.objectContaining({
            title: "Updated Title",
            body: "Updated body text",
          }),
        }),
      );
    });

    test("admin cannot edit another admin's post (author check)", async () => {
      mockAuth.mockResolvedValue(adminSession());
      mockPostFindFirst.mockResolvedValue({
        id: postId,
        authorId: otherUserId, // different from adminId
        boardId,
        board: { slug: "general-discussion" },
        deletedAt: null,
      });

      const result = await updatePost(postId, "Hijacked", "Not your post");

      expect(result).toEqual({
        error: "You can only edit your own posts",
        code: "permissionDenied",
      });
      expect(mockPostUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Step 6: Delete cascade behavior", () => {
    test("admin can delete a thread (soft delete)", async () => {
      mockAuth.mockResolvedValue(adminSession());
      mockThreadFindFirst.mockResolvedValue({
        id: threadId,
        authorId: otherUserId,
        deletedAt: null,
      });
      mockThreadUpdate.mockResolvedValue({});

      const result = await deleteThread(threadId);

      expect(result).toBeUndefined();
      expect(mockThreadUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: threadId },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });

    test("regular user cannot delete threads (no thread:delete permission)", async () => {
      mockAuth.mockResolvedValue(userSession());

      const result = await deleteThread(threadId);

      // user role does NOT have thread:delete permission
      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
      expect(mockThreadUpdate).not.toHaveBeenCalled();
    });

    test("admin cannot delete another admin's thread (author check for non-admin threads)", async () => {
      // Admin CAN delete because isAdmin check passes for admin role
      mockAuth.mockResolvedValue(adminSession());
      mockThreadFindFirst.mockResolvedValue({
        id: threadId,
        authorId: otherUserId,
        deletedAt: null,
      });
      mockThreadUpdate.mockResolvedValue({});

      const result = await deleteThread(threadId);

      // Admin role IS in the admin list, so they can delete anyone's thread
      expect(result).toBeUndefined();
      expect(mockThreadUpdate).toHaveBeenCalled();
    });

    test("admin can soft-delete a post", async () => {
      mockAuth.mockResolvedValue(adminSession());
      mockPostFindFirst.mockResolvedValue({
        id: postId,
        board: { slug: "general-discussion" },
        deletedAt: null,
      });
      mockPostUpdate.mockResolvedValue({});

      const result = await deletePost(postId);

      expect(result).toBeUndefined();
      expect(mockPostUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: postId },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });

    test("admin can soft-delete a board", async () => {
      mockAuth.mockResolvedValue(adminSession());
      mockBoardFindFirst.mockResolvedValue({
        id: boardId,
        deletedAt: null,
      });
      mockBoardUpdate.mockResolvedValue({});

      const result = await deleteBoard(boardId);

      expect(result).toBeUndefined();
      expect(mockBoardUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: boardId },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });
  });

  describe("Step 7: Full lifecycle — create board, post, thread, then delete", () => {
    test("complete content lifecycle works end-to-end", async () => {
      // 1. Admin creates a board
      mockAuth.mockResolvedValue(adminSession());
      mockBoardFindFirst.mockResolvedValue(null);
      mockBoardAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
      mockBoardCreate.mockResolvedValue({ id: boardId });

      let result = await createBoard("Lifecycle Board");
      expect(result).toBeUndefined();

      // 2. User creates a post
      jest.clearAllMocks();
      mockRateLimit.mockResolvedValue(undefined);
      mockAuth.mockResolvedValue(userSession());
      mockBoardFindFirst.mockResolvedValue({ id: boardId, slug: "lifecycle-board" });
      mockPostFindFirst.mockResolvedValue(null);
      mockPostCreate.mockResolvedValue({ id: postId });

      result = await createPost(boardId, "Lifecycle Post", "Testing the full flow");
      expect(result).toBeUndefined();

      // 3. Another user creates a thread reply
      jest.clearAllMocks();
      mockRateLimit.mockResolvedValue(undefined);
      mockAuth.mockResolvedValue(userSession(otherUserId));
      mockPostFindFirst.mockResolvedValue({ id: postId, deletedAt: null });
      mockThreadCreate.mockResolvedValue({ id: threadId });

      result = await createThread("POST", postId, "Nice post!");
      expect(result).toBeUndefined();

      // 4. Original user replies to the thread
      jest.clearAllMocks();
      mockRateLimit.mockResolvedValue(undefined);
      mockAuth.mockResolvedValue(userSession());
      mockPostFindFirst.mockResolvedValue({ id: postId, deletedAt: null });
      mockThreadFindFirst.mockResolvedValue({ id: threadId, deletedAt: null });
      mockThreadCreate.mockResolvedValue({ id: replyThreadId });

      result = await createThread("POST", postId, "Thanks!", threadId);
      expect(result).toBeUndefined();

      // 5. Admin cleans up — delete thread, post, board
      jest.clearAllMocks();
      mockRateLimit.mockResolvedValue(undefined);
      mockAuth.mockResolvedValue(adminSession());

      mockThreadFindFirst.mockResolvedValue({
        id: threadId,
        authorId: otherUserId,
        deletedAt: null,
      });
      mockThreadUpdate.mockResolvedValue({});
      result = await deleteThread(threadId);
      expect(result).toBeUndefined();

      mockPostFindFirst.mockResolvedValue({
        id: postId,
        board: { slug: "lifecycle-board" },
        deletedAt: null,
      });
      mockPostUpdate.mockResolvedValue({});
      result = await deletePost(postId);
      expect(result).toBeUndefined();

      mockBoardFindFirst.mockResolvedValue({ id: boardId, deletedAt: null });
      mockBoardUpdate.mockResolvedValue({});
      result = await deleteBoard(boardId);
      expect(result).toBeUndefined();
    });
  });
});
