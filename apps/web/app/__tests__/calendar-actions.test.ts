const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    calendarEvent: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({
    get: () => null,
  }),
}));

// Re-implement guardedAction without "use server" for testing
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
    fn: (...args: TArgs) => Promise<void>,
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
        await fn(...args);
      });
    };
  }

  return { guardedAction };
});

import { createEvent, updateEvent, deleteEvent } from "@/lib/calendar-actions";

function authenticatedSession(perms: Record<string, boolean> = {}) {
  return {
    user: {
      id: "user-1",
      permissions: {
        "event:create": true,
        "event:edit": true,
        "event:delete": true,
        ...perms,
      },
    },
  };
}

const validInput = {
  title: "Team Standup",
  description: "Daily sync",
  location: "Room A",
  startTime: "2026-03-26T09:00:00",
  endTime: "2026-03-26T09:30:00",
  allDay: false,
};

describe("createEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({ id: "new-evt" });
  });

  test("creates event when authenticated with permission", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createEvent(validInput);
    expect(result).toBeUndefined();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createEvent(validInput);
    expect(result).toEqual({
      error: "Not authenticated",
      code: "permissionDenied",
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("returns error for empty title", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createEvent({ ...validInput, title: "" });
    expect(result).toEqual({
      error: "Event title is required",
      code: "invalidEventTitle",
    });
  });

  test("returns error for end before start", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createEvent({
      ...validInput,
      startTime: "2026-03-26T10:00:00",
      endTime: "2026-03-26T09:00:00",
    });
    expect(result).toEqual({
      error: "End time must be after start time",
      code: "eventEndBeforeStart",
    });
  });

  test("passes authorId from session to prisma create", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    await createEvent(validInput);
    const createArgs = mockCreate.mock.calls[0][0];
    expect(createArgs.data.authorId).toBe("user-1");
  });
});

describe("updateEvent", () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
    mockFindFirst.mockResolvedValue({ id: eventId, authorId: "user-1" });
    mockUpdate.mockResolvedValue({ id: eventId });
  });

  test("updates event when user is the author", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await updateEvent({ ...validInput, id: eventId });
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("returns error when event not found", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockFindFirst.mockResolvedValue(null);
    const result = await updateEvent({ ...validInput, id: eventId });
    expect(result).toEqual({
      error: "Event not found",
      code: "eventNotFound",
    });
  });

  test("returns error for invalid UUID", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await updateEvent({ ...validInput, id: "bad-id" });
    expect(result).toEqual({
      error: "Invalid event ID: not a valid UUID",
      code: "invalidId",
    });
  });

  test("returns error without event:edit permission", async () => {
    mockAuth.mockResolvedValue(authenticatedSession({ "event:edit": false }));
    const result = await updateEvent({ ...validInput, id: eventId });
    expect(result).toEqual({
      error: "Missing permission: event:edit",
      code: "permissionDenied",
    });
  });

  test("returns error when user is not the author", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockFindFirst.mockResolvedValue({ id: eventId, authorId: "other-user" });
    const result = await updateEvent({ ...validInput, id: eventId });
    expect(result).toEqual({
      error: "You can only edit your own events",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteEvent", () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
    mockFindFirst.mockResolvedValue({ id: eventId });
    mockUpdate.mockResolvedValue({ id: eventId });
  });

  test("soft-deletes event by setting deletedAt", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await deleteEvent(eventId);
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updateArgs = mockUpdate.mock.calls[0][0];
    expect(updateArgs.where.id).toBe(eventId);
    expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
  });

  test("returns error when event not found", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockFindFirst.mockResolvedValue(null);
    const result = await deleteEvent(eventId);
    expect(result).toEqual({
      error: "Event not found",
      code: "eventNotFound",
    });
  });

  test("returns error for invalid UUID", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await deleteEvent("not-uuid");
    expect(result).toEqual({
      error: "Invalid event ID: not a valid UUID",
      code: "invalidId",
    });
  });

  test("returns error without event:delete permission", async () => {
    mockAuth.mockResolvedValue(authenticatedSession({ "event:delete": false }));
    const result = await deleteEvent(eventId);
    expect(result).toEqual({
      error: "Missing permission: event:delete",
      code: "permissionDenied",
    });
  });
});
