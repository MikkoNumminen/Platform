import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/lib/feedback-actions", () => ({
  submitFeedback: jest.fn(),
  replyToFeedback: jest.fn(),
  getAllFeedback: jest.fn(),
}));

import { submitFeedback, getAllFeedback, replyToFeedback } from "@/lib/feedback-actions";
import FeedbackSection from "../components/feedback/FeedbackSection";

const mockSubmitFeedback = submitFeedback as jest.MockedFunction<typeof submitFeedback>;
const mockGetAllFeedback = getAllFeedback as jest.MockedFunction<typeof getAllFeedback>;
const mockReplyToFeedback = replyToFeedback as jest.MockedFunction<typeof replyToFeedback>;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAllFeedback.mockResolvedValue([]);
});

describe("FeedbackSection", () => {
  test("renders form and empty state", async () => {
    render(<FeedbackSection canReply={false} />);

    expect(screen.getByText("Quick Feedback")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/no feedback yet/i)).toBeInTheDocument();
    });
  });

  test("submit button is disabled when input is empty", async () => {
    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    });
  });

  test("submits feedback and refreshes list", async () => {
    mockSubmitFeedback.mockResolvedValue({ success: true });
    mockGetAllFeedback.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: "fb1",
        message: "Test feedback",
        createdAt: new Date().toISOString(),
        author: { id: "u1", alias: "Tester", name: null, image: null },
        adminReply: null,
        adminRepliedAt: null,
        adminReplyBy: null,
      },
    ]);

    render(<FeedbackSection canReply={false} />);

    const input = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(input, { target: { value: "Test feedback" } });
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(mockSubmitFeedback).toHaveBeenCalledWith("Test feedback");
    await waitFor(() => {
      expect(screen.getByText("Test feedback")).toBeInTheDocument();
    });
  });

  test("displays feedback items with author info", async () => {
    mockGetAllFeedback.mockResolvedValue([
      {
        id: "fb1",
        message: "Great platform!",
        createdAt: "2026-04-01T00:00:00.000Z",
        author: { id: "u1", alias: "Alice", name: "Alice A", image: null },
        adminReply: null,
        adminRepliedAt: null,
        adminReplyBy: null,
      },
    ]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("Great platform!")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  test("shows admin reply when present", async () => {
    mockGetAllFeedback.mockResolvedValue([
      {
        id: "fb1",
        message: "Feature request",
        createdAt: "2026-04-01T00:00:00.000Z",
        author: { id: "u1", alias: "Bob", name: null, image: null },
        adminReply: "We'll consider it!",
        adminRepliedAt: "2026-04-01T12:00:00.000Z",
        adminReplyBy: { alias: "Admin", name: null },
      },
    ]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("Feature request")).toBeInTheDocument();
      expect(screen.getByText("We'll consider it!")).toBeInTheDocument();
    });
  });

  test("shows reply button for admins on unreplied feedback", async () => {
    mockGetAllFeedback.mockResolvedValue([
      {
        id: "fb1",
        message: "Needs improvement",
        createdAt: "2026-04-01T00:00:00.000Z",
        author: { id: "u1", alias: "User1", name: null, image: null },
        adminReply: null,
        adminRepliedAt: null,
        adminReplyBy: null,
      },
    ]);

    render(<FeedbackSection canReply={true} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reply/i })).toBeInTheDocument();
    });
  });

  test("does not show reply button for non-admins", async () => {
    mockGetAllFeedback.mockResolvedValue([
      {
        id: "fb1",
        message: "Test",
        createdAt: "2026-04-01T00:00:00.000Z",
        author: { id: "u1", alias: "User1", name: null, image: null },
        adminReply: null,
        adminRepliedAt: null,
        adminReplyBy: null,
      },
    ]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /reply/i })).not.toBeInTheDocument();
  });

  test("admin can submit a reply", async () => {
    mockReplyToFeedback.mockResolvedValue({ success: true });
    mockGetAllFeedback.mockResolvedValue([
      {
        id: "fb1",
        message: "Fix this",
        createdAt: "2026-04-01T00:00:00.000Z",
        author: { id: "u1", alias: "User1", name: null, image: null },
        adminReply: null,
        adminRepliedAt: null,
        adminReplyBy: null,
      },
    ]);

    render(<FeedbackSection canReply={true} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reply/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /reply/i }));

    const replyInput = screen.getByPlaceholderText(/write a reply/i);
    fireEvent.change(replyInput, { target: { value: "On it!" } });

    const replyButtons = screen.getAllByRole("button", { name: /reply/i });
    fireEvent.click(replyButtons[0]);

    expect(mockReplyToFeedback).toHaveBeenCalledWith("fb1", "On it!");
  });

  test("displays character count", async () => {
    render(<FeedbackSection canReply={false} />);

    expect(screen.getByText("0/1000")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(screen.getByText("5/1000")).toBeInTheDocument();
  });
});
