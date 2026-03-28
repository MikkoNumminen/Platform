import React from "react";
import { render, screen } from "@testing-library/react";

const mockUseSession = jest.fn();
const mockPush = jest.fn();
const mockDeleteBoard = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/board-actions", () => ({
  deleteBoard: (...args: unknown[]) => mockDeleteBoard(...args),
}));

jest.mock(
  "../components/BoardFormDialog",
  () =>
    function MockBoardFormDialog({ open }: { open: boolean }) {
      return open ? <div data-testid="board-form-dialog">BoardFormDialog</div> : null;
    },
);

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

import BoardAdminBar from "../components/BoardAdminBar";

const defaultProps = {
  boardId: "board-1",
  boardName: "Test Board",
  boardDescription: "A test board",
  boardSlug: "test-board",
};

function sessionWith(permissions: Record<string, boolean>) {
  return {
    data: { user: { id: "u1", permissions } },
    status: "authenticated",
  };
}

describe("BoardAdminBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteBoard.mockResolvedValue(undefined);
  });

  test("renders nothing when user lacks board:edit and board:delete permissions", () => {
    mockUseSession.mockReturnValue(sessionWith({}));
    const { container } = render(<BoardAdminBar {...defaultProps} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when session is null", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    const { container } = render(<BoardAdminBar {...defaultProps} />);
    expect(container.innerHTML).toBe("");
  });

  test("shows edit button with board:edit permission", () => {
    mockUseSession.mockReturnValue(sessionWith({ "board:edit": true }));
    render(<BoardAdminBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /edit board/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete board/i })).not.toBeInTheDocument();
  });

  test("shows delete button with board:delete permission", () => {
    mockUseSession.mockReturnValue(sessionWith({ "board:delete": true }));
    render(<BoardAdminBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /delete board/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit board/i })).not.toBeInTheDocument();
  });

  test("shows both buttons with both permissions", () => {
    mockUseSession.mockReturnValue(sessionWith({ "board:edit": true, "board:delete": true }));
    render(<BoardAdminBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /edit board/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete board/i })).toBeInTheDocument();
  });
});
