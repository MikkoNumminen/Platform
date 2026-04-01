/* eslint-disable @typescript-eslint/no-explicit-any */

const mockFeedbackCreate = jest.fn();
const mockFeedbackFindUnique = jest.fn();
const mockFeedbackUpdate = jest.fn();
const mockFeedbackFindMany = jest.fn();
const mockAuditLogCreate = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    feedback: {
      create: (...a: any[]) => mockFeedbackCreate(...a),
      findUnique: (...a: any[]) => mockFeedbackFindUnique(...a),
      update: (...a: any[]) => mockFeedbackUpdate(...a),
      findMany: (...a: any[]) => mockFeedbackFindMany(...a),
    },
    auditLog: {
      create: (...a: any[]) => mockAuditLogCreate(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));

const mockTriggerGamification = jest.fn();
jest.mock("@/lib/gamification/trigger", () => ({
  triggerGamification: (...a: any[]) => mockTriggerGamification(...a),
}));

jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
}));

import { auth } from "@/auth";
import { submitFeedback, replyToFeedback, getAllFeedback } from "@/lib/feedback-actions";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("feedback-actions", () => {
  describe("submitFeedback", () => {
    test("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);
      const result = await submitFeedback("test");
      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });

    test("returns error for empty message", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
      const result = await submitFeedback("   ");
      expect(result).toEqual({ success: false, error: "Feedback cannot be empty" });
    });

    test("returns error for message exceeding max length", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
      const result = await submitFeedback("a".repeat(1001));
      expect(result.success).toBe(false);
      expect(result.error).toContain("under");
    });

    test("creates feedback and triggers gamification", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
      mockFeedbackCreate.mockResolvedValue({ id: "fb1" });
      mockTriggerGamification.mockResolvedValue(undefined);

      const result = await submitFeedback("Great platform!");
      expect(result).toEqual({ success: true });
      expect(mockFeedbackCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          message: "Great platform!",
          authorId: "u1",
        }),
      });
      expect(mockTriggerGamification).toHaveBeenCalledWith("u1", "feedback:submit", "fb1");
    });

    test("succeeds even if gamification fails", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
      mockFeedbackCreate.mockResolvedValue({ id: "fb1" });
      mockTriggerGamification.mockRejectedValue(new Error("db error"));

      const result = await submitFeedback("feedback");
      expect(result).toEqual({ success: true });
    });
  });

  describe("replyToFeedback", () => {
    test("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);
      const result = await replyToFeedback("fb1", "thanks");
      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });

    test("returns error for non-admin users", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1", role: "user" } } as any);
      const result = await replyToFeedback("fb1", "thanks");
      expect(result).toEqual({ success: false, error: "Not authorized" });
    });

    test("returns error for empty reply", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1", role: "superuser" } } as any);
      const result = await replyToFeedback("fb1", "   ");
      expect(result).toEqual({ success: false, error: "Reply cannot be empty" });
    });

    test("returns error when feedback not found", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1", role: "superuser" } } as any);
      mockFeedbackFindUnique.mockResolvedValue(null);
      const result = await replyToFeedback("fb1", "thanks");
      expect(result).toEqual({ success: false, error: "Feedback not found" });
    });

    test("updates feedback with admin reply", async () => {
      mockAuth.mockResolvedValue({ user: { id: "admin1", role: "superuser" } } as any);
      mockFeedbackFindUnique.mockResolvedValue({ id: "fb1" });
      mockFeedbackUpdate.mockResolvedValue({});
      mockAuditLogCreate.mockResolvedValue({});

      const result = await replyToFeedback("fb1", "Thanks for the feedback!");
      expect(result).toEqual({ success: true });
      expect(mockFeedbackUpdate).toHaveBeenCalledWith({
        where: { id: "fb1" },
        data: expect.objectContaining({
          adminReply: "Thanks for the feedback!",
          adminReplyById: "admin1",
        }),
      });
    });

    test("allows admin role to reply", async () => {
      mockAuth.mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
      mockFeedbackFindUnique.mockResolvedValue({ id: "fb1" });
      mockFeedbackUpdate.mockResolvedValue({});
      mockAuditLogCreate.mockResolvedValue({});

      const result = await replyToFeedback("fb1", "noted");
      expect(result).toEqual({ success: true });
    });

    test("allows vuohi role to reply", async () => {
      mockAuth.mockResolvedValue({ user: { id: "v1", role: "vuohi" } } as any);
      mockFeedbackFindUnique.mockResolvedValue({ id: "fb1" });
      mockFeedbackUpdate.mockResolvedValue({});
      mockAuditLogCreate.mockResolvedValue({});

      const result = await replyToFeedback("fb1", "noted");
      expect(result).toEqual({ success: true });
    });
  });

  describe("getAllFeedback", () => {
    test("returns empty array when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);
      const result = await getAllFeedback();
      expect(result).toEqual([]);
    });

    test("returns feedback items with author and admin info", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
      mockFeedbackFindMany.mockResolvedValue([
        {
          id: "fb1",
          message: "Great!",
          createdAt: new Date("2026-04-01"),
          author: { id: "u2", alias: "Bob", name: "Bob B", image: null },
          adminReply: "Thanks!",
          adminRepliedAt: new Date("2026-04-01"),
          adminReplyBy: { alias: "Admin", name: "Admin A" },
        },
      ]);

      const result = await getAllFeedback();
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe("Great!");
      expect(result[0].author.alias).toBe("Bob");
      expect(result[0].adminReply).toBe("Thanks!");
    });

    test("filters by demo session when in demo mode", async () => {
      mockAuth.mockResolvedValue({ user: { id: "u1", demoSessionId: "demo-123" } } as any);
      mockFeedbackFindMany.mockResolvedValue([]);

      await getAllFeedback();
      expect(mockFeedbackFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: "demo-123" },
        }),
      );
    });
  });
});
