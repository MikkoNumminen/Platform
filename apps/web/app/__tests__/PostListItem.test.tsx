import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import PostListItem from "../components/PostListItem";

jest.mock("next/link", () => function MockLink({ children, href }: any) {
  return <a href={href}>{children}</a>;
});

const defaultProps = {
  title: "How to get started",
  slug: "how-to-get-started",
  authorName: "Alice",
  date: "2025-01-15",
  pinned: false,
  href: "/boards/general/how-to-get-started",
};

describe("PostListItem", () => {
  test("renders the post title", () => {
    render(<PostListItem {...defaultProps} />);
    expect(screen.getByText("How to get started")).toBeInTheDocument();
  });

  test("renders the author name", () => {
    render(<PostListItem {...defaultProps} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  test("renders the date", () => {
    render(<PostListItem {...defaultProps} />);
    expect(screen.getByText(/2025-01-15/)).toBeInTheDocument();
  });

  test("does not show pinned badge when not pinned", () => {
    render(<PostListItem {...defaultProps} />);
    expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
  });

  test("shows pinned badge when pinned", () => {
    render(<PostListItem {...defaultProps} pinned={true} />);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  test("links to the correct href", () => {
    render(<PostListItem {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/boards/general/how-to-get-started");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<PostListItem {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
