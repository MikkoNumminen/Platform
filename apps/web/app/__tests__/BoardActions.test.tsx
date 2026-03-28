import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock(
  "../components/BoardFormDialog",
  () =>
    function MockBoardFormDialog({ open }: { open: boolean }) {
      return open ? <div data-testid="board-form-dialog">BoardFormDialog</div> : null;
    },
);

import BoardActions from "../components/BoardActions";

function sessionWith(permissions: Record<string, boolean>) {
  return {
    data: { user: { id: "u1", permissions } },
    status: "authenticated",
  };
}

describe("BoardActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing when user lacks board:create permission", () => {
    mockUseSession.mockReturnValue(sessionWith({}));
    const { container } = render(<BoardActions />);
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when session is null", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    const { container } = render(<BoardActions />);
    expect(container.innerHTML).toBe("");
  });

  test("renders New Board button when user has board:create permission", () => {
    mockUseSession.mockReturnValue(sessionWith({ "board:create": true }));
    render(<BoardActions />);
    expect(screen.getByRole("button", { name: /new board/i })).toBeInTheDocument();
  });

  test("opens BoardFormDialog when New Board button is clicked", () => {
    mockUseSession.mockReturnValue(sessionWith({ "board:create": true }));
    render(<BoardActions />);
    expect(screen.queryByTestId("board-form-dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /new board/i }));
    expect(screen.getByTestId("board-form-dialog")).toBeInTheDocument();
  });
});
