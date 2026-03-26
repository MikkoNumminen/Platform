import { guardedAction } from "@/lib/guardedAction";

const mockAuth = jest.fn();
const mockRateLimit = jest.fn();

jest.mock("@/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

function makeSession(permissions: Record<string, boolean>) {
  return {
    user: {
      id: "user-1",
      permissions,
    },
  };
}

describe("guardedAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  test("executes action when authenticated with correct permission", async () => {
    mockAuth.mockResolvedValue(makeSession({ "board:create": true }));
    const fn = jest.fn();
    const action = guardedAction("board:create", "create-board", fn);

    const result = await action("arg1", "arg2");
    expect(result).toBeUndefined();
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  test("returns error when not authenticated (null session)", async () => {
    mockAuth.mockResolvedValue(null);
    const fn = jest.fn();
    const action = guardedAction("board:create", "create-board", fn);

    const result = await action();
    expect(result).toEqual({
      error: "Not authenticated",
      code: "permissionDenied",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  test("returns error when session has no user", async () => {
    mockAuth.mockResolvedValue({ user: null });
    const fn = jest.fn();
    const action = guardedAction("board:create", "create-board", fn);

    const result = await action();
    expect(result).toEqual({
      error: "Not authenticated",
      code: "permissionDenied",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  test("returns error when user lacks the required permission", async () => {
    mockAuth.mockResolvedValue(makeSession({ "board:create": false }));
    const fn = jest.fn();
    const action = guardedAction("board:create", "create-board", fn);

    const result = await action();
    expect(result).toEqual({
      error: "Missing permission: board:create",
      code: "permissionDenied",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  test("returns error when permissions object is undefined", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const fn = jest.fn();
    const action = guardedAction("board:create", "create-board", fn);

    const result = await action();
    expect(result).toEqual({
      error: "Missing permission: board:create",
      code: "permissionDenied",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  test("calls rateLimit with the correct key", async () => {
    mockAuth.mockResolvedValue(makeSession({ "event:create": true }));
    const fn = jest.fn();
    const action = guardedAction("event:create", "create-event", fn);

    await action();
    expect(mockRateLimit).toHaveBeenCalledWith("create-event");
  });

  test("returns rateLimited error when rate limit throws", async () => {
    mockAuth.mockResolvedValue(makeSession({ "post:create": true }));
    const { RateLimitError } = await import("@/lib/actionErrors");
    mockRateLimit.mockRejectedValue(new RateLimitError("Rate limit exceeded for post"));
    const fn = jest.fn();
    const action = guardedAction("post:create", "create-post", fn);

    const result = await action();
    expect(result).toEqual({
      error: "Rate limit exceeded for post",
      code: "rateLimited",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  test("returns error when action throws ActionError", async () => {
    mockAuth.mockResolvedValue(makeSession({ "board:edit": true }));
    const { ActionError } = await import("@/lib/actionErrors");
    const fn = jest.fn().mockRejectedValue(new ActionError("boardNotFound", "Board not found"));
    const action = guardedAction("board:edit", "edit-board", fn);

    const result = await action();
    expect(result).toEqual({
      error: "Board not found",
      code: "boardNotFound",
    });
  });

  test("returns generic error when action throws unknown error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockAuth.mockResolvedValue(makeSession({ "board:delete": true }));
    const fn = jest.fn().mockRejectedValue(new Error("db crashed"));
    const action = guardedAction("board:delete", "delete-board", fn);

    const result = await action();
    expect(result).toEqual({
      error: "An unexpected error occurred",
      code: "unexpectedError",
    });
    consoleSpy.mockRestore();
  });

  test("checks auth before permission before rate limit before action", async () => {
    const callOrder: string[] = [];
    mockAuth.mockImplementation(async () => {
      callOrder.push("auth");
      return makeSession({ "thread:create": true });
    });
    mockRateLimit.mockImplementation(async () => {
      callOrder.push("rateLimit");
    });
    const fn = jest.fn().mockImplementation(async () => {
      callOrder.push("action");
    });

    const action = guardedAction("thread:create", "create-thread", fn);
    await action();

    expect(callOrder).toEqual(["auth", "rateLimit", "action"]);
  });

  test("passes all arguments through to the wrapped function", async () => {
    mockAuth.mockResolvedValue(makeSession({ "topic:create": true }));
    const fn = jest.fn();
    const action = guardedAction("topic:create", "create-topic", fn);

    await action("a", 42, { nested: true });
    expect(fn).toHaveBeenCalledWith("a", 42, { nested: true });
  });
});
