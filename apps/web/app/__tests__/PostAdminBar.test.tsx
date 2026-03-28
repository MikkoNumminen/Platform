import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseSession = jest.fn();
const mockPush = jest.fn();
const mockDeletePost = jest.fn();
const mockTogglePostPin = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/post-actions", () => ({
  deletePost: (...args: unknown[]) => mockDeletePost(...args),
  togglePostPin: (...args: unknown[]) => mockTogglePostPin(...args),
}));

jest.mock(
  "../components/PostFormDialog",
  () =>
    function MockPostFormDialog({ open }: { open: boolean }) {
      return open ? <div data-testid="post-form-dialog">PostFormDialog</div> : null;
    },
);

jest.mock(
  "../components/ConfirmDeleteDialog",
  () =>
    function MockConfirmDeleteDialog({
      open,
      onConfirm,
    }: {
      open: boolean;
      onConfirm: () => void;
    }) {
      return open ? (
        <div data-testid="confirm-delete-dialog">
          <button onClick={onConfirm}>Confirm</button>
        </div>
      ) : null;
    },
);

import PostAdminBar from "../components/PostAdminBar";

const defaultProps = {
  postId: "post-1",
  postTitle: "Test Post",
  postBody: "Test body",
  pinned: false,
  boardId: "board-1",
  boardSlug: "general",
};

function sessionWith(permissions: Record<string, boolean>) {
  return {
    data: { user: { id: "u1", permissions } },
    status: "authenticated",
  };
}

describe("PostAdminBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeletePost.mockResolvedValue(undefined);
    mockTogglePostPin.mockResolvedValue(undefined);
  });

  test("renders nothing when user has no edit or delete permissions", () => {
    mockUseSession.mockReturnValue(sessionWith({}));
    const { container } = render(<PostAdminBar {...defaultProps} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when session is null", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    const { container } = render(<PostAdminBar {...defaultProps} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders Pin and Edit buttons when user has post:edit permission", () => {
    mockUseSession.mockReturnValue(sessionWith({ "post:edit": true }));
    render(<PostAdminBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /pin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  test("renders Unpin label when post is pinned", () => {
    mockUseSession.mockReturnValue(sessionWith({ "post:edit": true }));
    render(<PostAdminBar {...defaultProps} pinned={true} />);
    expect(screen.getByRole("button", { name: /unpin/i })).toBeInTheDocument();
  });

  test("renders Delete button when user has post:delete permission", () => {
    mockUseSession.mockReturnValue(sessionWith({ "post:delete": true }));
    render(<PostAdminBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });

  test("calls togglePostPin when Pin button is clicked", async () => {
    mockUseSession.mockReturnValue(sessionWith({ "post:edit": true }));
    render(<PostAdminBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /pin/i }));
    expect(mockTogglePostPin).toHaveBeenCalledWith("post-1");
  });

  test("opens edit dialog when Edit button is clicked", () => {
    mockUseSession.mockReturnValue(sessionWith({ "post:edit": true }));
    render(<PostAdminBar {...defaultProps} />);
    expect(screen.queryByTestId("post-form-dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByTestId("post-form-dialog")).toBeInTheDocument();
  });

  test("opens delete dialog when Delete button is clicked", () => {
    mockUseSession.mockReturnValue(sessionWith({ "post:delete": true }));
    render(<PostAdminBar {...defaultProps} />);
    expect(screen.queryByTestId("confirm-delete-dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByTestId("confirm-delete-dialog")).toBeInTheDocument();
  });

  test("calls deletePost and navigates on confirm", async () => {
    mockUseSession.mockReturnValue(sessionWith({ "post:delete": true }));
    render(<PostAdminBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockDeletePost).toHaveBeenCalledWith("post-1");
  });
});
