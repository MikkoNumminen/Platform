const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockRevalidatePath = jest.fn();

const mockBoardFindFirst = jest.fn();
const mockBoardCreate = jest.fn();
const mockBoardUpdate = jest.fn();
const mockBoardAggregate = jest.fn();

jest.mock("@/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

jest.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    board: {
      findFirst: (...args: unknown[]) => mockBoardFindFirst(...args),
      create: (...args: unknown[]) => mockBoardCreate(...args),
      update: (...args: unknown[]) => mockBoardUpdate(...args),
      aggregate: (...args: unknown[]) => mockBoardAggregate(...args),
    },
  },
}));

import { createBoard, updateBoard, deleteBoard } from "@/lib/board-actions";

function authedSession(
  permissions: Record<string, boolean> = {
    "board:create": true,
    "board:edit": true,
    "board:delete": true,
  },
) {
  return { user: { id: "user-1", permissions } };
}

describe("createBoard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockBoardFindFirst.mockResolvedValue(null);
    mockBoardAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
    mockBoardCreate.mockResolvedValue({ id: "new-board" });
  });

  test("creates a board with valid name", async () => {
    const result = await createBoard("Test Board");
    expect(result).toBeUndefined();
    expect(mockBoardCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Test Board",
          slug: "test-board",
          sortOrder: 1,
        }),
      }),
    );
  });

  test("trims the board name", async () => {
    await createBoard("  Spaces  ");
    expect(mockBoardCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Spaces" }),
      }),
    );
  });

  test("returns error for empty name", async () => {
    const result = await createBoard("  ");
    expect(result).toEqual({ error: "Board name is required", code: "invalidBoardName" });
  });

  test("returns error for name over 100 characters", async () => {
    const result = await createBoard("a".repeat(101));
    expect(result).toEqual({
      error: "Board name must be 100 characters or less",
      code: "boardNameTooLong",
    });
  });

  test("returns error when slug already exists", async () => {
    mockBoardFindFirst.mockResolvedValue({ id: "existing" });
    const result = await createBoard("General");
    expect(result).toEqual({
      error: "A board with this name already exists",
      code: "boardSlugExists",
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createBoard("Test");
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("revalidates /boards on success", async () => {
    await createBoard("Test Board");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/boards");
  });

  test("saves description when provided", async () => {
    await createBoard("Test Board", "A description");
    expect(mockBoardCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: "A description" }),
      }),
    );
  });

  test("accepts name at exactly 100 characters", async () => {
    const result = await createBoard("a".repeat(100));
    expect(result).toBeUndefined();
  });
});

describe("updateBoard", () => {
  const boardId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockBoardFindFirst.mockResolvedValue({ id: boardId, slug: "old-slug" });
    mockBoardUpdate.mockResolvedValue({});
  });

  test("updates board name and slug", async () => {
    // First call: find by id, second call: conflict check
    mockBoardFindFirst
      .mockResolvedValueOnce({ id: boardId }) // board exists
      .mockResolvedValueOnce(null); // no slug conflict

    const result = await updateBoard(boardId, "New Name");
    expect(result).toBeUndefined();
    expect(mockBoardUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: boardId },
        data: expect.objectContaining({ name: "New Name", slug: "new-name" }),
      }),
    );
  });

  test("returns error for invalid UUID", async () => {
    const result = await updateBoard("bad-id", "Name");
    expect(result).toEqual(expect.objectContaining({ code: "invalidId" }));
  });

  test("returns error when board not found", async () => {
    mockBoardFindFirst.mockResolvedValue(null);
    const result = await updateBoard(boardId, "Name");
    expect(result).toEqual({ error: "Board not found", code: "boardNotFound" });
  });
});

describe("deleteBoard", () => {
  const boardId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(authedSession());
    mockRateLimit.mockResolvedValue(undefined);
    mockBoardFindFirst.mockResolvedValue({ id: boardId });
    mockBoardUpdate.mockResolvedValue({});
  });

  test("soft-deletes the board", async () => {
    const result = await deleteBoard(boardId);
    expect(result).toBeUndefined();
    expect(mockBoardUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: boardId },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  test("returns error when board not found", async () => {
    mockBoardFindFirst.mockResolvedValue(null);
    const result = await deleteBoard(boardId);
    expect(result).toEqual({ error: "Board not found", code: "boardNotFound" });
  });

  test("revalidates /boards on success", async () => {
    await deleteBoard(boardId);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/boards");
  });
});
