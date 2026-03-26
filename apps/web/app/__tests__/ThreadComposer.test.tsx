import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import ThreadComposer from "../components/ThreadComposer";

describe("ThreadComposer", () => {
  test("renders the text field with placeholder", () => {
    render(<ThreadComposer />);
    expect(
      screen.getByPlaceholderText("Write a comment...")
    ).toBeInTheDocument();
  });

  test("renders the submit button", () => {
    render(<ThreadComposer />);
    expect(screen.getByText("Post comment")).toBeInTheDocument();
  });

  test("submit button is disabled when text field is empty", () => {
    render(<ThreadComposer />);
    const button = screen.getByText("Post comment");
    expect(button).toBeDisabled();
  });

  test("submit button is disabled when text field contains only whitespace", () => {
    render(<ThreadComposer />);
    const input = screen.getByPlaceholderText("Write a comment...");
    fireEvent.change(input, { target: { value: "   " } });
    const button = screen.getByText("Post comment");
    expect(button).toBeDisabled();
  });

  test("submit button is enabled when text is entered", () => {
    render(<ThreadComposer />);
    const input = screen.getByPlaceholderText("Write a comment...");
    fireEvent.change(input, { target: { value: "A real comment" } });
    const button = screen.getByText("Post comment");
    expect(button).toBeEnabled();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<ThreadComposer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
