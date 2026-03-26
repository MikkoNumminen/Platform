import { validateEventInput } from "@/lib/calendar-schemas";
import { ActionError } from "@/lib/actionErrors";

describe("validateEventInput", () => {
  const validInput = {
    title: "Team Standup",
    description: "Daily sync meeting",
    location: "Room 101",
    startTime: "2026-03-26T09:00:00",
    endTime: "2026-03-26T09:30:00",
    allDay: false,
  };

  test("returns validated data for valid input", () => {
    const result = validateEventInput(validInput);
    expect(result.title).toBe("Team Standup");
    expect(result.description).toBe("Daily sync meeting");
    expect(result.location).toBe("Room 101");
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.endTime).toBeInstanceOf(Date);
    expect(result.allDay).toBe(false);
  });

  test("trims title whitespace", () => {
    const result = validateEventInput({ ...validInput, title: "  Standup  " });
    expect(result.title).toBe("Standup");
  });

  test("throws invalidEventTitle for empty title", () => {
    expect(() => validateEventInput({ ...validInput, title: "" })).toThrow(ActionError);
    expect(() => validateEventInput({ ...validInput, title: "  " })).toThrow(ActionError);
  });

  test("throws eventTitleTooLong for title exceeding 200 chars", () => {
    const longTitle = "x".repeat(201);
    try {
      validateEventInput({ ...validInput, title: longTitle });
      fail("Expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ActionError);
      expect((err as ActionError).code).toBe("eventTitleTooLong");
    }
  });

  test("accepts title at exactly 200 chars", () => {
    const result = validateEventInput({
      ...validInput,
      title: "x".repeat(200),
    });
    expect(result.title).toHaveLength(200);
  });

  test("returns null for empty description", () => {
    const result = validateEventInput({ ...validInput, description: "" });
    expect(result.description).toBeNull();
  });

  test("returns null for undefined description", () => {
    const result = validateEventInput({
      ...validInput,
      description: undefined,
    });
    expect(result.description).toBeNull();
  });

  test("returns null for empty location", () => {
    const result = validateEventInput({ ...validInput, location: "" });
    expect(result.location).toBeNull();
  });

  test("throws eventEndBeforeStart when end is before start", () => {
    try {
      validateEventInput({
        ...validInput,
        startTime: "2026-03-26T10:00:00",
        endTime: "2026-03-26T09:00:00",
      });
      fail("Expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ActionError);
      expect((err as ActionError).code).toBe("eventEndBeforeStart");
    }
  });

  test("accepts same start and end time", () => {
    const result = validateEventInput({
      ...validInput,
      startTime: "2026-03-26T09:00:00",
      endTime: "2026-03-26T09:00:00",
    });
    expect(result.startTime.getTime()).toBe(result.endTime.getTime());
  });

  test("throws for invalid start time", () => {
    expect(() => validateEventInput({ ...validInput, startTime: "not-a-date" })).toThrow(
      ActionError,
    );
  });

  test("throws for invalid end time", () => {
    expect(() => validateEventInput({ ...validInput, endTime: "not-a-date" })).toThrow(ActionError);
  });

  test("converts allDay to boolean", () => {
    const result = validateEventInput({ ...validInput, allDay: true });
    expect(result.allDay).toBe(true);
  });

  test("throws for description exceeding 2000 chars", () => {
    expect(() =>
      validateEventInput({
        ...validInput,
        description: "x".repeat(2001),
      }),
    ).toThrow(ActionError);
  });

  test("throws for location exceeding 200 chars", () => {
    expect(() =>
      validateEventInput({
        ...validInput,
        location: "x".repeat(201),
      }),
    ).toThrow(ActionError);
  });
});
