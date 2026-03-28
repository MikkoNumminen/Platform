import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockFetchOverrides = jest.fn();
const mockUpdatePermissions = jest.fn();

jest.mock("@/lib/user-actions", () => ({
  fetchUserPermissionOverrides: (...a: unknown[]) => mockFetchOverrides(...a),
  updateUserPermissions: (...a: unknown[]) => mockUpdatePermissions(...a),
}));

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

import UserPermissionEditor from "../admin/users/UserPermissionEditor";

describe("UserPermissionEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchOverrides.mockResolvedValue([]);
    mockUpdatePermissions.mockResolvedValue(undefined);
  });

  test("renders toggle button", () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={false}
        initialHasOverrides={false}
      />,
    );
    expect(screen.getByLabelText("Toggle permissions")).toBeInTheDocument();
  });

  test("toggle button is disabled when isSelf", () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={true}
        initialHasOverrides={false}
      />,
    );
    expect(screen.getByLabelText("Toggle permissions")).toBeDisabled();
  });

  test("shows Custom permissions chip when initialHasOverrides is true", () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={false}
        initialHasOverrides={true}
      />,
    );
    expect(screen.getByText("Custom permissions")).toBeInTheDocument();
  });

  test("does not show Custom permissions chip when no overrides", () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={false}
        initialHasOverrides={false}
      />,
    );
    expect(screen.queryByText("Custom permissions")).not.toBeInTheDocument();
  });

  test("expands permission groups on toggle click", async () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={false}
        initialHasOverrides={false}
      />,
    );
    await userEvent.click(screen.getByLabelText("Toggle permissions"));

    await waitFor(() => {
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Boards")).toBeInTheDocument();
      expect(screen.getByText("Posts")).toBeInTheDocument();
    });
  });

  test("fetches overrides when expanded", async () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={false}
        initialHasOverrides={false}
      />,
    );
    await userEvent.click(screen.getByLabelText("Toggle permissions"));

    await waitFor(() => {
      expect(mockFetchOverrides).toHaveBeenCalledWith("u1");
    });
  });

  test("renders Save Permissions button when expanded", async () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={false}
        initialHasOverrides={false}
      />,
    );
    await userEvent.click(screen.getByLabelText("Toggle permissions"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save permissions/i })).toBeInTheDocument();
    });
  });

  test("renders permission checkboxes with role defaults", async () => {
    render(
      <UserPermissionEditor
        userId="u1"
        userRole="user"
        isSelf={false}
        initialHasOverrides={false}
      />,
    );
    await userEvent.click(screen.getByLabelText("Toggle permissions"));

    await waitFor(() => {
      // "user" role should have some permissions like post:create
      expect(screen.getByText(/Create posts/i)).toBeInTheDocument();
    });
  });
});
