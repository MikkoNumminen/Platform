import { render, screen } from "@testing-library/react";

const mockGetBoardBySlug = jest.fn();
const mockGetPostsByBoard = jest.fn();
const mockNotFound = jest.fn();

jest.mock("@/lib/board-queries", () => ({
  getBoardBySlug: (...a: unknown[]) => mockGetBoardBySlug(...a),
}));

jest.mock("@/lib/post-queries", () => ({
  getPostsByBoard: (...a: unknown[]) => mockGetPostsByBoard(...a),
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

jest.mock("@/app/components/PostListItem", () => {
  return function MockPostListItem({ title, pinned }: { title: string; pinned: boolean }) {
    return (
      <div data-testid="post-item">
        {title}
        {pinned && <span>pinned</span>}
      </div>
    );
  };
});

jest.mock("@/app/components/BoardAdminBar", () => {
  return function MockBoardAdminBar({ boardName }: { boardName: string }) {
    return <div data-testid="admin-bar">{boardName}</div>;
  };
});

import BoardPage from "../boards/[slug]/page";

describe("BoardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls notFound when board does not exist", async () => {
    mockGetBoardBySlug.mockResolvedValue(null);
    await expect(BoardPage({ params: Promise.resolve({ slug: "nonexistent" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mockNotFound).toHaveBeenCalled();
  });

  test("renders board title in TopBar", async () => {
    mockGetBoardBySlug.mockResolvedValue({
      id: "b1",
      name: "General",
      slug: "general",
      description: "General discussion",
    });
    mockGetPostsByBoard.mockResolvedValue([]);
    const page = await BoardPage({ params: Promise.resolve({ slug: "general" }) });
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("General");
  });

  test("renders board description", async () => {
    mockGetBoardBySlug.mockResolvedValue({
      id: "b1",
      name: "News",
      slug: "news",
      description: "Important updates for the community",
    });
    mockGetPostsByBoard.mockResolvedValue([]);
    const page = await BoardPage({ params: Promise.resolve({ slug: "news" }) });
    render(page);
    expect(screen.getByText("Important updates for the community")).toBeInTheDocument();
  });

  test("renders posts", async () => {
    mockGetBoardBySlug.mockResolvedValue({
      id: "b1",
      name: "General",
      slug: "general",
      description: null,
    });
    mockGetPostsByBoard.mockResolvedValue([
      {
        id: "p1",
        title: "Hello World",
        slug: "hello-world",
        authorName: "Alice",
        createdAt: new Date("2026-03-15"),
        pinned: false,
      },
      {
        id: "p2",
        title: "Pinned Post",
        slug: "pinned-post",
        authorName: "Bob",
        createdAt: new Date("2026-03-16"),
        pinned: true,
      },
    ]);
    const page = await BoardPage({ params: Promise.resolve({ slug: "general" }) });
    render(page);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("Pinned Post")).toBeInTheDocument();
    expect(screen.getByText("pinned")).toBeInTheDocument();
  });

  test("renders admin bar with board info", async () => {
    mockGetBoardBySlug.mockResolvedValue({
      id: "b1",
      name: "Announcements",
      slug: "announcements",
      description: "Official announcements",
    });
    mockGetPostsByBoard.mockResolvedValue([]);
    const page = await BoardPage({ params: Promise.resolve({ slug: "announcements" }) });
    render(page);
    expect(screen.getByTestId("admin-bar")).toHaveTextContent("Announcements");
  });
});
