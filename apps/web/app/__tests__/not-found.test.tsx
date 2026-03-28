import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("NotFound", () => {
  test("renders 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });

  test("renders descriptive message", () => {
    render(<NotFound />);
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
  });

  test("renders link to home page", () => {
    render(<NotFound />);
    const link = screen.getByText("Go home");
    expect(link).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
