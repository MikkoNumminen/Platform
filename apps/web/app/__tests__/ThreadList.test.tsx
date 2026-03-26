import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import ThreadList from "../components/ThreadList";
import type { ThreadData } from "../types/thread";

jest.mock("@/lib/thread-actions", () => ({
  createThread: jest.fn().mockResolvedValue(undefined),
}));

const sampleThreads: ThreadData[] = [
  {
    id: "t1",
    body: "First thread body",
    authorName: "Mika Virtanen",
    createdAt: "2026-03-24T09:15:00Z",
    replies: [],
  },
  {
    id: "t2",
    body: "Second thread body",
    authorName: "Laura Korhonen",
    createdAt: "2026-03-25T14:20:00Z",
    replies: [],
  },
];

const defaultProps = {
  parentType: "POST" as const,
  parentId: "post-1",
  revalidateUrl: "/boards/general/test-post",
};

describe("ThreadList", () => {
  test("renders the thread count in the heading", () => {
    render(<ThreadList threads={sampleThreads} {...defaultProps} />);
    expect(screen.getByText("Discussion (2)")).toBeInTheDocument();
  });

  test("renders all thread items", () => {
    render(<ThreadList threads={sampleThreads} {...defaultProps} />);
    expect(screen.getByText("First thread body")).toBeInTheDocument();
    expect(screen.getByText("Second thread body")).toBeInTheDocument();
  });

  test("renders the empty state when no threads", () => {
    render(<ThreadList threads={[]} {...defaultProps} />);
    expect(screen.getByText("Discussion (0)")).toBeInTheDocument();
    expect(screen.getByText("No comments yet. Start the conversation.")).toBeInTheDocument();
  });

  test("renders the ThreadComposer", () => {
    render(<ThreadList threads={[]} {...defaultProps} />);
    expect(screen.getByText("Post comment")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<ThreadList threads={sampleThreads} {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
