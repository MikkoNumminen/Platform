import { safe, validateUUID, createStringValidator } from "@/lib/actionUtils";
import { ActionError, RateLimitError } from "@/lib/actionErrors";

describe("validateUUID", () => {
  test("accepts a valid UUID", () => {
    expect(() => validateUUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "id")).not.toThrow();
  });

  test("accepts uppercase UUID", () => {
    expect(() => validateUUID("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", "id")).not.toThrow();
  });

  test("rejects an empty string", () => {
    expect(() => validateUUID("", "userId")).toThrow(ActionError);
    expect(() => validateUUID("", "userId")).toThrow("not a valid UUID");
  });

  test("rejects a non-UUID string", () => {
    expect(() => validateUUID("not-a-uuid", "recordId")).toThrow(ActionError);
  });

  test("rejects UUID without hyphens", () => {
    expect(() => validateUUID("a0eebc999c0b4ef8bb6d6bb9bd380a11", "id")).toThrow(ActionError);
  });

  test("thrown error has invalidId code", () => {
    try {
      validateUUID("bad", "fieldName");
      fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ActionError);
      expect((error as ActionError).code).toBe("invalidId");
    }
  });

  test("includes field name in error message", () => {
    try {
      validateUUID("bad", "eventId");
      fail("should have thrown");
    } catch (error) {
      expect((error as ActionError).message).toContain("eventId");
    }
  });

  test("rejects UUID with extra characters", () => {
    expect(() => validateUUID("550e8400-e29b-41d4-a716-446655440000-extra", "id")).toThrow(
      ActionError,
    );
  });
});

describe("safe", () => {
  test("returns undefined on success", async () => {
    const result = await safe(async () => {});
    expect(result).toBeUndefined();
  });

  test("catches ActionError and returns error result", async () => {
    const result = await safe(async () => {
      throw new ActionError("boardNotFound", "Board not found");
    });
    expect(result).toEqual({ error: "Board not found", code: "boardNotFound" });
  });

  test("catches RateLimitError and returns rateLimited code", async () => {
    const result = await safe(async () => {
      throw new RateLimitError("Too fast");
    });
    expect(result).toEqual({ error: "Too fast", code: "rateLimited" });
  });

  test("catches unknown errors and returns generic message", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = await safe(async () => {
      throw new Error("database exploded");
    });
    expect(result).toEqual({
      error: "An unexpected error occurred",
      code: "unexpectedError",
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected action error"),
      expect.stringContaining("database exploded"),
    );
    consoleSpy.mockRestore();
  });

  test("re-throws NEXT_REDIRECT errors", async () => {
    await expect(
      safe(async () => {
        throw new Error("NEXT_REDIRECT");
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  test("re-throws NEXT_NOT_FOUND errors", async () => {
    await expect(
      safe(async () => {
        throw new Error("NEXT_NOT_FOUND");
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  test("re-throws errors with digest property (Next.js internals)", async () => {
    const error = Object.assign(new Error("redirect"), {
      digest: "NEXT_REDIRECT;/dashboard",
    });
    await expect(
      safe(async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });

  test("does not expose internal error details for non-Error throws", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = await safe(async () => {
      throw "raw string error";
    });
    expect(result).toEqual({
      error: "An unexpected error occurred",
      code: "unexpectedError",
    });
    consoleSpy.mockRestore();
  });
});

describe("createStringValidator", () => {
  const validate = createStringValidator("Title", 100, "emptyTitle", "titleTooLong");

  test("returns trimmed string for valid input", () => {
    expect(validate("  hello world  ")).toBe("hello world");
  });

  test("throws for empty string", () => {
    expect(() => validate("")).toThrow(ActionError);
    expect(() => validate("")).toThrow("Title is required");
  });

  test("throws for whitespace-only string", () => {
    expect(() => validate("   ")).toThrow("Title is required");
  });

  test("throws with correct code for empty", () => {
    try {
      validate("");
    } catch (e) {
      expect((e as ActionError).code).toBe("emptyTitle");
    }
  });

  test("throws for string exceeding max length", () => {
    const longString = "a".repeat(101);
    expect(() => validate(longString)).toThrow("Title must be 100 characters or less");
  });

  test("throws with correct code for too long", () => {
    try {
      validate("a".repeat(101));
    } catch (e) {
      expect((e as ActionError).code).toBe("titleTooLong");
    }
  });

  test("accepts string at exact max length", () => {
    expect(validate("a".repeat(100))).toBe("a".repeat(100));
  });
});
