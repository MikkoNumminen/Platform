import { getMockEvents } from "../data/mockEvents";
import type { CalendarEvent } from "../data/mockEvents";

describe("getMockEvents", () => {
  let events: CalendarEvent[];

  beforeAll(() => {
    events = getMockEvents();
  });

  test("returns a non-empty array", () => {
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  test("each event has the expected shape", () => {
    for (const event of events) {
      expect(typeof event.id).toBe("string");
      expect(typeof event.title).toBe("string");
      expect(typeof event.description).toBe("string");
      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
      expect(typeof event.allDay).toBe("boolean");
      expect(typeof event.authorId).toBe("string");
      // location is string | null
      expect(event.location === null || typeof event.location === "string").toBe(true);
    }
  });

  test("events are anchored to the current month", () => {
    const now = new Date();
    for (const event of events) {
      expect(event.startTime.getFullYear()).toBe(now.getFullYear());
      expect(event.startTime.getMonth()).toBe(now.getMonth());
    }
  });

  test("contains both all-day and timed events", () => {
    const allDay = events.filter((e) => e.allDay);
    const timed = events.filter((e) => !e.allDay);
    expect(allDay.length).toBeGreaterThan(0);
    expect(timed.length).toBeGreaterThan(0);
  });

  test("returns a fresh array on each call", () => {
    const a = getMockEvents();
    const b = getMockEvents();
    expect(a).not.toBe(b);
  });
});
