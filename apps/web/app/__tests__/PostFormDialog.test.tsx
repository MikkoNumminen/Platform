import { render, screen, fireEvent } from "@testing-library/react";
import PostFormDialog from "../components/PostFormDialog";

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

jest.mock("@/lib/post-actions", () => ({
  createPost: jest.fn().mockResolvedValue(undefined),
  updatePost: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  mode: "create" as const,
  boardId: "board-1",
  boardSlug: "general",
};

describe("PostFormDialog", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders create title in create mode", () => {
    render(<PostFormDialog {...defaultProps} />);
    expect(screen.getByText("Create Post")).toBeInTheDocument();
  });

  test("renders edit title in edit mode", () => {
    render(
      <PostFormDialog
        {...defaultProps}
        mode="edit"
        postId="p1"
        initialTitle="Old"
        initialBody="Body"
      />,
    );
    expect(screen.getByText("Edit Post")).toBeInTheDocument();
  });

  test("renders title and body fields", () => {
    render(<PostFormDialog {...defaultProps} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Body")).toBeInTheDocument();
  });

  test("publish button is disabled when fields are empty", () => {
    render(<PostFormDialog {...defaultProps} />);
    expect(screen.getByText("Publish")).toBeDisabled();
  });

  test("publish button is enabled when both fields have content", () => {
    render(<PostFormDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Post Title" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Post body" } });
    expect(screen.getByText("Publish")).toBeEnabled();
  });

  test("publish button is disabled when only title is filled", () => {
    render(<PostFormDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Title" } });
    expect(screen.getByText("Publish")).toBeDisabled();
  });

  test("pre-fills fields in edit mode", () => {
    render(
      <PostFormDialog
        {...defaultProps}
        mode="edit"
        postId="p1"
        initialTitle="My Post"
        initialBody="My body"
      />,
    );
    expect(screen.getByLabelText("Title")).toHaveValue("My Post");
    expect(screen.getByLabelText("Body")).toHaveValue("My body");
  });

  test("shows Save button in edit mode", () => {
    render(
      <PostFormDialog {...defaultProps} mode="edit" postId="p1" initialTitle="T" initialBody="B" />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(<PostFormDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Create Post")).not.toBeInTheDocument();
  });
});
