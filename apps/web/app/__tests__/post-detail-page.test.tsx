import { render, screen } from "@testing-library/react";

const mockGetBoardBySlug = jest.fn();
const mockGetPostBySlug = jest.fn();
const mockGetThreadsByParent = jest.fn();
const mockNotFound = jest.fn();

jest.mock("@/lib/board-queries", () => ({
  getBoardBySlug: (...a: unknown[]) => mockGetBoardBySlug(...a),
}));

jest.mock("@/lib/post-queries", () => ({
  getPostBySlug: (...a: unknown[]) => mockGetPostBySlug(...a),
}));

jest.mock("@/lib/thread-queries", () => ({
  getThreadsByParent: (...a: unknown[]) => mockGetThreadsByParent(...a),
}));

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

jest.mock("@/app/components/PostAdminBar", () => {
  return function MockPostAdminBar() {
    return <div data-testid="post-admin-bar" />;
  };
});

jest.mock("@/app/components/ThreadList", () => {
  return function MockThreadList({ threads }: { threads: unknown[] }) {
    return <div data-testid="thread-list">threads:{threads.length}</div>;
  };
});

import PostPage from "../boards/[slug]/[postSlug]/page";

const makeParams = (slug: string, postSlug: string) => Promise.resolve({ slug, postSlug });

describe("PostPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls notFound when board does not exist", async () => {
    mockGetBoardBySlug.mockResolvedValue(null);
    await expect(PostPage({ params: makeParams("general", "hello") })).rejects.toThrow("NOT_FOUND");
  });

  test("calls notFound when post does not exist", async () => {
    mockGetBoardBySlug.mockResolvedValue({ id: "b1", slug: "general" });
    mockGetPostBySlug.mockResolvedValue(null);
    await expect(PostPage({ params: makeParams("general", "missing") })).rejects.toThrow(
      "NOT_FOUND",
    );
  });

  test("renders post title in TopBar", async () => {
    mockGetBoardBySlug.mockResolvedValue({ id: "b1", slug: "general" });
    mockGetPostBySlug.mockResolvedValue({
      id: "p1",
      title: "Hello World",
      body: "Post body here",
      authorName: "Alice",
      createdAt: new Date("2026-03-15"),
      pinned: false,
    });
    mockGetThreadsByParent.mockResolvedValue([]);
    const page = await PostPage({ params: makeParams("general", "hello-world") });
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Hello World");
  });

  test("renders post body and author", async () => {
    mockGetBoardBySlug.mockResolvedValue({ id: "b1", slug: "general" });
    mockGetPostBySlug.mockResolvedValue({
      id: "p1",
      title: "Test Post",
      body: "This is the post content",
      authorName: "Bob",
      createdAt: new Date("2026-03-15"),
      pinned: false,
    });
    mockGetThreadsByParent.mockResolvedValue([]);
    const page = await PostPage({ params: makeParams("general", "test-post") });
    render(page);
    expect(screen.getByText("This is the post content")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("renders thread list", async () => {
    mockGetBoardBySlug.mockResolvedValue({ id: "b1", slug: "general" });
    mockGetPostBySlug.mockResolvedValue({
      id: "p1",
      title: "Test",
      body: "Body",
      authorName: "Alice",
      createdAt: new Date("2026-03-15"),
      pinned: false,
    });
    mockGetThreadsByParent.mockResolvedValue([{ id: "t1" }, { id: "t2" }]);
    const page = await PostPage({ params: makeParams("general", "test") });
    render(page);
    expect(screen.getByText("threads:2")).toBeInTheDocument();
  });

  test("renders pinned chip when post is pinned", async () => {
    mockGetBoardBySlug.mockResolvedValue({ id: "b1", slug: "general" });
    mockGetPostBySlug.mockResolvedValue({
      id: "p1",
      title: "Pinned Post",
      body: "Important",
      authorName: "Admin",
      createdAt: new Date("2026-03-15"),
      pinned: true,
    });
    mockGetThreadsByParent.mockResolvedValue([]);
    const page = await PostPage({ params: makeParams("general", "pinned") });
    render(page);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });
});
