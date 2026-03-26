import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import ThreadItem from "../components/ThreadItem";
import type { ThreadData } from "../types/thread";

jest.mock("@/lib/thread-actions", () => ({
  createThread: jest.fn().mockResolvedValue(undefined),
}));

const baseThread: ThreadData = {
  id: "t1",
  body: "Hello world",
  authorName: "Mika Virtanen",
  createdAt: "2026-03-24T09:15:00Z",
  replies: [],
};

const defaultProps = {
  parentType: "POST" as const,
  parentId: "post-1",
  revalidateUrl: "/boards/general/test-post",
};

describe("ThreadItem", () => {
  test("renders the author name", () => {
    render(<ThreadItem thread={baseThread} {...defaultProps} />);
    expect(screen.getByText("Mika Virtanen")).toBeInTheDocument();
  });

  test("renders the body text", () => {
    render(<ThreadItem thread={baseThread} {...defaultProps} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  test("renders the formatted date", () => {
    render(<ThreadItem thread={baseThread} {...defaultProps} />);
    // formatTimestamp uses en-US locale with month, day, year, hour, minute
    expect(screen.getByText(/Mar/)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  test("renders author initials in the avatar", () => {
    render(<ThreadItem thread={baseThread} {...defaultProps} />);
    expect(screen.getByText("MV")).toBeInTheDocument();
  });

  test("renders a Reply button", () => {
    render(<ThreadItem thread={baseThread} {...defaultProps} />);
    expect(screen.getByText("Reply")).toBeInTheDocument();
  });

  test("renders nested replies recursively", () => {
    const threadWithReplies: ThreadData = {
      ...baseThread,
      replies: [
        {
          id: "r1",
          body: "First reply",
          authorName: "Laura Korhonen",
          createdAt: "2026-03-24T10:00:00Z",
          replies: [
            {
              id: "r1-r1",
              body: "Nested reply",
              authorName: "Antti Heikkinen",
              createdAt: "2026-03-24T11:00:00Z",
              replies: [],
            },
          ],
        },
      ],
    };

    render(<ThreadItem thread={threadWithReplies} {...defaultProps} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("First reply")).toBeInTheDocument();
    expect(screen.getByText("Nested reply")).toBeInTheDocument();
    expect(screen.getByText("Laura Korhonen")).toBeInTheDocument();
    expect(screen.getByText("Antti Heikkinen")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<ThreadItem thread={baseThread} {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
