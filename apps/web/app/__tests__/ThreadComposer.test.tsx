import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import ThreadComposer from "../components/ThreadComposer";

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

jest.mock("@/lib/thread-actions", () => ({
  createThread: jest.fn().mockResolvedValue(undefined),
}));

const defaultProps = {
  parentType: "POST" as const,
  parentId: "post-1",
  revalidateUrl: "/boards/general/test-post",
};

describe("ThreadComposer", () => {
  test("renders the text field with placeholder", () => {
    render(<ThreadComposer {...defaultProps} />);
    expect(screen.getByPlaceholderText("Write a comment...")).toBeInTheDocument();
  });

  test("renders the submit button", () => {
    render(<ThreadComposer {...defaultProps} />);
    expect(screen.getByText("Post comment")).toBeInTheDocument();
  });

  test("submit button is disabled when text field is empty", () => {
    render(<ThreadComposer {...defaultProps} />);
    const button = screen.getByText("Post comment");
    expect(button).toBeDisabled();
  });

  test("submit button is disabled when text field contains only whitespace", () => {
    render(<ThreadComposer {...defaultProps} />);
    const input = screen.getByPlaceholderText("Write a comment...");
    fireEvent.change(input, { target: { value: "   " } });
    const button = screen.getByText("Post comment");
    expect(button).toBeDisabled();
  });

  test("submit button is enabled when text is entered", () => {
    render(<ThreadComposer {...defaultProps} />);
    const input = screen.getByPlaceholderText("Write a comment...");
    fireEvent.change(input, { target: { value: "A real comment" } });
    const button = screen.getByText("Post comment");
    expect(button).toBeEnabled();
  });

  test("uses custom placeholder when provided", () => {
    render(<ThreadComposer {...defaultProps} placeholder="Write a reply..." />);
    expect(screen.getByPlaceholderText("Write a reply...")).toBeInTheDocument();
  });

  test("renders cancel button when onCancel is provided", () => {
    render(<ThreadComposer {...defaultProps} onCancel={jest.fn()} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("does not render cancel button by default", () => {
    render(<ThreadComposer {...defaultProps} />);
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<ThreadComposer {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
