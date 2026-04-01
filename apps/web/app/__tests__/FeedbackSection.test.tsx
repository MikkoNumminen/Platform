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

const FEEDBACK_ITEM = {
  id: "fb1",
  message: "Great platform!",
  createdAt: "2026-04-01T00:00:00.000Z",
  author: { id: "u1", alias: "Alice", name: "Alice A", image: null },
  adminReply: null,
  adminRepliedAt: null,
  adminReplyBy: null,
};

describe("FeedbackSection", () => {
  test("renders form and no accordion when empty", async () => {
    render(<FeedbackSection canReply={false} />);

    expect(screen.getByText("Quick Feedback")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("View Feedback")).not.toBeInTheDocument();
    });
  });

  test("submit button is disabled when input is empty", async () => {
    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    });
  });

  test("submits feedback and shows accordion", async () => {
    mockSubmitFeedback.mockResolvedValue({ success: true });
    mockGetAllFeedback.mockResolvedValueOnce([]).mockResolvedValueOnce([FEEDBACK_ITEM]);

    render(<FeedbackSection canReply={false} />);

    const input = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(input, { target: { value: "Test feedback" } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(mockSubmitFeedback).toHaveBeenCalledWith("Test feedback");
    await waitFor(() => {
      expect(screen.getByText("View Feedback")).toBeInTheDocument();
    });
  });

  test("shows feedback items when accordion is expanded", async () => {
    mockGetAllFeedback.mockResolvedValue([FEEDBACK_ITEM]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("View Feedback")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Feedback"));

    await waitFor(() => {
      expect(screen.getByText("Great platform!")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  test("accordion toggles between View/Hide", async () => {
    mockGetAllFeedback.mockResolvedValue([FEEDBACK_ITEM]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("View Feedback")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Feedback"));
    expect(screen.getByText("Hide Feedback")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide Feedback"));
    expect(screen.getByText("View Feedback")).toBeInTheDocument();
  });

  test("shows admin reply when present", async () => {
    mockGetAllFeedback.mockResolvedValue([
      {
        ...FEEDBACK_ITEM,
        adminReply: "We'll consider it!",
        adminRepliedAt: "2026-04-01T12:00:00.000Z",
        adminReplyBy: { alias: "Admin", name: null },
      },
    ]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("View Feedback")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Feedback"));

    await waitFor(() => {
      expect(screen.getByText("We'll consider it!")).toBeInTheDocument();
    });
  });

  test("shows reply button for admins on unreplied feedback", async () => {
    mockGetAllFeedback.mockResolvedValue([FEEDBACK_ITEM]);

    render(<FeedbackSection canReply={true} />);

    await waitFor(() => {
      expect(screen.getByText("View Feedback")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Feedback"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reply/i })).toBeInTheDocument();
    });
  });

  test("does not show reply button for non-admins", async () => {
    mockGetAllFeedback.mockResolvedValue([FEEDBACK_ITEM]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("View Feedback")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Feedback"));

    await waitFor(() => {
      expect(screen.getByText("Great platform!")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /reply/i })).not.toBeInTheDocument();
  });

  test("admin can submit a reply", async () => {
    mockReplyToFeedback.mockResolvedValue({ success: true });
    mockGetAllFeedback.mockResolvedValue([
      {
        ...FEEDBACK_ITEM,
        message: "Fix this",
        author: { ...FEEDBACK_ITEM.author, alias: "User1" },
      },
    ]);

    render(<FeedbackSection canReply={true} />);

    await waitFor(() => {
      expect(screen.getByText("View Feedback")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Feedback"));

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

  test("shows feedback count in header", async () => {
    mockGetAllFeedback.mockResolvedValue([FEEDBACK_ITEM]);

    render(<FeedbackSection canReply={false} />);

    await waitFor(() => {
      expect(screen.getByText("(1)")).toBeInTheDocument();
    });
  });
});
