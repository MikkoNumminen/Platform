import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import BoardsPage from "../boards/page";

jest.mock(
  "next/link",
  () =>
    function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
      return <a href={href}>{children}</a>;
    },
);

jest.mock(
  "../components/TopBar",
  () =>
    function MockTopBar({ title }: { title: string }) {
      return <div data-testid="topbar">{title}</div>;
    },
);

jest.mock("@/lib/board-queries", () => ({
  getBoards: jest.fn().mockResolvedValue([
    {
      id: "1",
      name: "General Discussion",
      slug: "general",
      description: "A place for community-wide conversations.",
      postCount: 12,
    },
    {
      id: "2",
      name: "Feature Requests",
      slug: "feature-requests",
      description: "Suggest new features and vote on ideas.",
      postCount: 8,
    },
    {
      id: "3",
      name: "Help & Support",
      slug: "help-support",
      description: "Got a question or ran into an issue?",
      postCount: 5,
    },
  ]),
}));

describe("BoardsPage", () => {
  test("renders the TopBar with title Boards", async () => {
    render(await BoardsPage());
    expect(screen.getByTestId("topbar")).toHaveTextContent("Boards");
  });

  test("renders all boards from the database", async () => {
    render(await BoardsPage());
    expect(screen.getByText("General Discussion")).toBeInTheDocument();
    expect(screen.getByText("Feature Requests")).toBeInTheDocument();
    expect(screen.getByText("Help & Support")).toBeInTheDocument();
  });

  test("renders board descriptions", async () => {
    render(await BoardsPage());
    expect(screen.getByText(/community-wide conversations/)).toBeInTheDocument();
    expect(screen.getByText(/Suggest new features/)).toBeInTheDocument();
    expect(screen.getByText(/Got a question/)).toBeInTheDocument();
  });

  test("renders board post counts", async () => {
    render(await BoardsPage());
    expect(screen.getByText("12 posts")).toBeInTheDocument();
    expect(screen.getByText("8 posts")).toBeInTheDocument();
    expect(screen.getByText("5 posts")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(await BoardsPage());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
