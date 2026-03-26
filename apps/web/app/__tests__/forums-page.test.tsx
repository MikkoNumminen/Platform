import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import ForumsPage from "../forums/page";

jest.mock("next/link", () => function MockLink({ children, href }: any) {
  return <a href={href}>{children}</a>;
});

jest.mock("../components/TopBar", () => function MockTopBar({ title }: { title: string }) {
  return <div data-testid="topbar">{title}</div>;
});

describe("ForumsPage", () => {
  test("renders the TopBar with title Forums", () => {
    render(<ForumsPage />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Forums");
  });

  test("renders the subtitle text", () => {
    render(<ForumsPage />);
    expect(screen.getByText("Browse community discussions by category.")).toBeInTheDocument();
  });

  test("renders all mock forums", () => {
    render(<ForumsPage />);
    expect(screen.getByText("General Discussion")).toBeInTheDocument();
    expect(screen.getByText("Development")).toBeInTheDocument();
    expect(screen.getByText("Feedback & Suggestions")).toBeInTheDocument();
  });

  test("renders forum descriptions", () => {
    render(<ForumsPage />);
    expect(screen.getByText(/Talk about anything/)).toBeInTheDocument();
    expect(screen.getByText(/Technical discussions/)).toBeInTheDocument();
    expect(screen.getByText(/Share ideas for improving/)).toBeInTheDocument();
  });

  test("renders forum topic counts", () => {
    render(<ForumsPage />);
    expect(screen.getByText("4 topics")).toBeInTheDocument();
    expect(screen.getAllByText("3 topics")).toHaveLength(2);
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<ForumsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
