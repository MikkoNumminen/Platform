import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import ForumCard from "../components/ForumCard";

jest.mock("next/link", () => function MockLink({ children, href }: any) {
  return <a href={href}>{children}</a>;
});

const defaultProps = {
  name: "Development",
  slug: "development",
  description: "Technical discussions about software development.",
  topicCount: 3,
};

describe("ForumCard", () => {
  test("renders the forum name", () => {
    render(<ForumCard {...defaultProps} />);
    expect(screen.getByText("Development")).toBeInTheDocument();
  });

  test("renders the description", () => {
    render(<ForumCard {...defaultProps} />);
    expect(screen.getByText("Technical discussions about software development.")).toBeInTheDocument();
  });

  test("renders topic count with plural form", () => {
    render(<ForumCard {...defaultProps} />);
    expect(screen.getByText("3 topics")).toBeInTheDocument();
  });

  test("renders topic count with singular form", () => {
    render(<ForumCard {...defaultProps} topicCount={1} />);
    expect(screen.getByText("1 topic")).toBeInTheDocument();
  });

  test("links to the correct forum page", () => {
    render(<ForumCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/forums/development");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<ForumCard {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
