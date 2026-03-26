const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    calendarEvent: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

import { getEvents, getEventById } from "@/lib/calendar-queries";

describe("getEvents", () => {
  beforeEach(() => jest.clearAllMocks());

  test("queries events for the given month", async () => {
    mockFindMany.mockResolvedValue([]);
    await getEvents(2026, 2); // March 2026

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const args = mockFindMany.mock.calls[0][0];
    expect(args.where.deletedAt).toBeNull();
    expect(args.where.startTime.gte).toEqual(new Date(2026, 2, 1));
    expect(args.where.startTime.lt).toEqual(new Date(2026, 3, 1));
    expect(args.orderBy).toEqual({ startTime: "asc" });
  });

  test("returns the query result", async () => {
    const mockEvents = [
      {
        id: "evt-1",
        title: "Test Event",
        description: "A test",
        location: null,
        startTime: new Date(2026, 2, 15),
        endTime: new Date(2026, 2, 15),
        allDay: true,
        authorId: "user-1",
        author: { id: "user-1", name: "Test User" },
      },
    ];
    mockFindMany.mockResolvedValue(mockEvents);
    const result = await getEvents(2026, 2);
    expect(result).toEqual(mockEvents);
  });

  test("handles year boundary (December to January)", async () => {
    mockFindMany.mockResolvedValue([]);
    await getEvents(2026, 11); // December 2026

    const args = mockFindMany.mock.calls[0][0];
    expect(args.where.startTime.gte).toEqual(new Date(2026, 11, 1));
    expect(args.where.startTime.lt).toEqual(new Date(2027, 0, 1));
  });

  test("selects expected fields including author", async () => {
    mockFindMany.mockResolvedValue([]);
    await getEvents(2026, 0);

    const args = mockFindMany.mock.calls[0][0];
    expect(args.select).toHaveProperty("id");
    expect(args.select).toHaveProperty("title");
    expect(args.select).toHaveProperty("author");
    expect(args.select.author.select).toEqual({ id: true, name: true });
  });
});

describe("getEventById", () => {
  beforeEach(() => jest.clearAllMocks());

  test("queries by id and excludes soft-deleted", async () => {
    mockFindFirst.mockResolvedValue(null);
    await getEventById("evt-123");

    expect(mockFindFirst).toHaveBeenCalledTimes(1);
    const args = mockFindFirst.mock.calls[0][0];
    expect(args.where.id).toBe("evt-123");
    expect(args.where.deletedAt).toBeNull();
  });

  test("returns the event when found", async () => {
    const mockEvent = {
      id: "evt-123",
      title: "Found Event",
      description: "desc",
      location: "here",
      startTime: new Date(),
      endTime: new Date(),
      allDay: false,
      authorId: "user-1",
      author: { id: "user-1", name: "User" },
    };
    mockFindFirst.mockResolvedValue(mockEvent);
    const result = await getEventById("evt-123");
    expect(result).toEqual(mockEvent);
  });

  test("returns null when not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await getEventById("nonexistent");
    expect(result).toBeNull();
  });
});
