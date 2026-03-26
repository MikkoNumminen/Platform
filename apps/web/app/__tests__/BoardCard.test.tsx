import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import BoardCard from "../components/BoardCard";

jest.mock("next/link", () => function MockLink({ children, href }: any) {
  return <a href={href}>{children}</a>;
});

const defaultProps = {
  name: "General Discussion",
  slug: "general",
  description: "A place for community-wide conversations.",
  postCount: 12,
};

describe("BoardCard", () => {
  test("renders the board name", () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText("General Discussion")).toBeInTheDocument();
  });

  test("renders the description", () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText("A place for community-wide conversations.")).toBeInTheDocument();
  });

  test("renders post count with plural form", () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText("12 posts")).toBeInTheDocument();
  });

  test("renders post count with singular form", () => {
    render(<BoardCard {...defaultProps} postCount={1} />);
    expect(screen.getByText("1 post")).toBeInTheDocument();
  });

  test("links to the correct board page", () => {
    render(<BoardCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/boards/general");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<BoardCard {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
