import { getMockThreads } from "../data/mockThreads";
import type { ThreadData } from "../types/thread";

describe("getMockThreads", () => {
  let threads: ThreadData[];

  beforeAll(() => {
    threads = getMockThreads();
  });

  test("returns a non-empty array", () => {
    expect(Array.isArray(threads)).toBe(true);
    expect(threads.length).toBeGreaterThan(0);
  });

  test("each thread has the expected shape", () => {
    for (const thread of threads) {
      expect(thread).toHaveProperty("id");
      expect(thread).toHaveProperty("body");
      expect(thread).toHaveProperty("authorName");
      expect(thread).toHaveProperty("createdAt");
      expect(thread).toHaveProperty("replies");
      expect(typeof thread.id).toBe("string");
      expect(typeof thread.body).toBe("string");
      expect(typeof thread.authorName).toBe("string");
      expect(typeof thread.createdAt).toBe("string");
      expect(Array.isArray(thread.replies)).toBe(true);
    }
  });

  test("contains threads with replies", () => {
    const withReplies = threads.filter((t) => t.replies.length > 0);
    expect(withReplies.length).toBeGreaterThan(0);
  });

  test("replies also conform to ThreadData shape", () => {
    const firstWithReplies = threads.find((t) => t.replies.length > 0);
    expect(firstWithReplies).toBeDefined();
    const reply = firstWithReplies!.replies[0];
    expect(reply).toHaveProperty("id");
    expect(reply).toHaveProperty("body");
    expect(reply).toHaveProperty("authorName");
    expect(reply).toHaveProperty("createdAt");
    expect(reply).toHaveProperty("replies");
  });

  test("returns a fresh array on each call (no shared reference)", () => {
    const a = getMockThreads();
    const b = getMockThreads();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
