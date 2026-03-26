import { ActionError, RateLimitError } from "@/lib/actionErrors";
import type { ErrorCode } from "@/lib/actionErrors";

describe("ActionError", () => {
  test("creates error with code and message", () => {
    const error = new ActionError("invalidId", "Bad UUID");
    expect(error.message).toBe("Bad UUID");
    expect(error.code).toBe("invalidId");
    expect(error.name).toBe("ActionError");
  });

  test("is an instance of Error", () => {
    const error = new ActionError("notFound", "Gone");
    expect(error).toBeInstanceOf(Error);
  });

  test("code is readonly", () => {
    const error = new ActionError("permissionDenied", "No access");
    expect(error.code).toBe("permissionDenied");
  });

  test("works with all domain error codes", () => {
    const codes: ErrorCode[] = [
      "invalidBoardName",
      "boardNameTooLong",
      "boardNotFound",
      "boardSlugExists",
      "invalidPostTitle",
      "postTitleTooLong",
      "postBodyRequired",
      "postNotFound",
      "invalidForumName",
      "forumNameTooLong",
      "forumNotFound",
      "forumSlugExists",
      "invalidTopicTitle",
      "topicTitleTooLong",
      "topicBodyRequired",
      "topicNotFound",
      "topicLocked",
      "threadBodyRequired",
      "threadNotFound",
      "invalidEventTitle",
      "eventTitleTooLong",
      "eventNotFound",
      "eventEndBeforeStart",
      "notFound",
      "invalidId",
      "permissionDenied",
      "rateLimited",
      "unexpectedError",
    ];

    for (const code of codes) {
      const error = new ActionError(code, `Error: ${code}`);
      expect(error.code).toBe(code);
      expect(error.message).toBe(`Error: ${code}`);
    }
  });
});

describe("RateLimitError", () => {
  test("creates error with default message", () => {
    const error = new RateLimitError();
    expect(error.message).toBe("Rate limit exceeded");
    expect(error.name).toBe("RateLimitError");
  });

  test("creates error with custom message", () => {
    const error = new RateLimitError("Too many requests");
    expect(error.message).toBe("Too many requests");
  });

  test("is an instance of Error", () => {
    const error = new RateLimitError();
    expect(error).toBeInstanceOf(Error);
  });
});
