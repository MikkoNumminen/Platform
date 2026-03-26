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

describe("BoardsPage", () => {
  test("renders the TopBar with title Boards", () => {
    render(<BoardsPage />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Boards");
  });

  test("renders all mock boards", () => {
    render(<BoardsPage />);
    expect(screen.getByText("General Discussion")).toBeInTheDocument();
    expect(screen.getByText("Feature Requests")).toBeInTheDocument();
    expect(screen.getByText("Help & Support")).toBeInTheDocument();
  });

  test("renders board descriptions", () => {
    render(<BoardsPage />);
    expect(screen.getByText(/community-wide conversations/)).toBeInTheDocument();
    expect(screen.getByText(/Suggest new features/)).toBeInTheDocument();
    expect(screen.getByText(/Got a question/)).toBeInTheDocument();
  });

  test("renders board post counts", () => {
    render(<BoardsPage />);
    expect(screen.getByText("12 posts")).toBeInTheDocument();
    expect(screen.getByText("8 posts")).toBeInTheDocument();
    expect(screen.getByText("5 posts")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<BoardsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
