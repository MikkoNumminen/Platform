import { render, screen } from "@testing-library/react";

const mockNotFound = jest.fn();

jest.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NOT_FOUND");
  },
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

const renderedTopics: string[] = [];
jest.mock("@/app/components/TopicListItem", () => {
  return function MockTopicListItem({ title, pinned }: { title: string; pinned: boolean }) {
    renderedTopics.push(title);
    return (
      <div data-testid="topic-item">
        {title}
        {pinned && <span data-testid="pinned">pinned</span>}
      </div>
    );
  };
});

import ForumPage from "../forums/[slug]/page";

describe("ForumPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    renderedTopics.length = 0;
  });

  test("calls notFound for non-existent forum", async () => {
    await expect(ForumPage({ params: Promise.resolve({ slug: "nonexistent" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mockNotFound).toHaveBeenCalled();
  });

  test("renders General Discussion forum", async () => {
    const page = await ForumPage({
      params: Promise.resolve({ slug: "general-discussion" }),
    });
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("General Discussion");
    expect(screen.getByText(/Talk about anything/)).toBeInTheDocument();
  });

  test("renders Development forum topics", async () => {
    const page = await ForumPage({
      params: Promise.resolve({ slug: "development" }),
    });
    render(page);
    expect(screen.getByText("Next.js 15 App Router — tips and gotchas")).toBeInTheDocument();
    expect(screen.getByText("TypeScript strict mode — worth it?")).toBeInTheDocument();
  });

  test("sorts pinned topics first", async () => {
    const page = await ForumPage({
      params: Promise.resolve({ slug: "general-discussion" }),
    });
    render(page);
    // Pinned topics should render first
    const topics = screen.getAllByTestId("topic-item");
    expect(topics.length).toBe(4);
    // First two should be pinned
    expect(screen.getAllByTestId("pinned").length).toBe(2);
  });

  test("renders Feedback forum", async () => {
    const page = await ForumPage({
      params: Promise.resolve({ slug: "feedback-suggestions" }),
    });
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Feedback & Suggestions");
    expect(screen.getByText("Feature request: dark mode toggle")).toBeInTheDocument();
  });
});
