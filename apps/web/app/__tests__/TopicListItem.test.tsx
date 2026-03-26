import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import TopicListItem from "../components/TopicListItem";

jest.mock("next/link", () => function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
  return <a href={href}>{children}</a>;
});

const defaultProps = {
  title: "Welcome to the forum",
  slug: "welcome",
  forumSlug: "general-discussion",
  authorName: "Admin",
  createdAt: "2025-01-10",
  pinned: false,
  locked: false,
};

describe("TopicListItem", () => {
  test("renders the topic title", () => {
    render(<TopicListItem {...defaultProps} />);
    expect(screen.getByText("Welcome to the forum")).toBeInTheDocument();
  });

  test("renders the author name", () => {
    render(<TopicListItem {...defaultProps} />);
    expect(screen.getByText(/Admin/)).toBeInTheDocument();
  });

  test("renders the creation date", () => {
    render(<TopicListItem {...defaultProps} />);
    expect(screen.getByText(/2025-01-10/)).toBeInTheDocument();
  });

  test("does not show pinned badge when not pinned", () => {
    render(<TopicListItem {...defaultProps} />);
    expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
  });

  test("shows pinned badge when pinned", () => {
    render(<TopicListItem {...defaultProps} pinned={true} />);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  test("does not show locked badge when not locked", () => {
    render(<TopicListItem {...defaultProps} />);
    expect(screen.queryByText("Locked")).not.toBeInTheDocument();
  });

  test("shows locked badge when locked", () => {
    render(<TopicListItem {...defaultProps} locked={true} />);
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  test("shows both pinned and locked badges", () => {
    render(<TopicListItem {...defaultProps} pinned={true} locked={true} />);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  test("links to the correct topic page", () => {
    render(<TopicListItem {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/forums/general-discussion/welcome");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<TopicListItem {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
