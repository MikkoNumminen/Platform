import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApproveButton from "../admin/users/ApproveButton";

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

const mockUpdateUserRole = jest.fn();

jest.mock("@/lib/user-actions", () => ({
  updateUserRole: (...args: unknown[]) => mockUpdateUserRole(...args),
}));

describe("ApproveButton", () => {
  beforeEach(() => {
    mockUpdateUserRole.mockClear();
  });

  test("renders approve button", () => {
    render(<ApproveButton userId="user-1" />);
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  test("calls updateUserRole with user role on click", async () => {
    mockUpdateUserRole.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ApproveButton userId="user-1" />);
    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(mockUpdateUserRole).toHaveBeenCalledWith("user-1", "user");
  });

  test("shows approved state after successful approval", async () => {
    mockUpdateUserRole.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ApproveButton userId="user-1" />);
    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByRole("button", { name: "Approved" })).toBeDisabled();
  });

  test("keeps approve button on error", async () => {
    mockUpdateUserRole.mockResolvedValue({ error: "permissionDenied" });
    const user = userEvent.setup();

    render(<ApproveButton userId="user-1" />);
    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });
});
