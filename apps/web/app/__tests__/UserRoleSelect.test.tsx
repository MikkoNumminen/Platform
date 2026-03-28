import React from "react";
import { render, screen } from "@testing-library/react";

const mockUpdateUserRole = jest.fn();

jest.mock("@/lib/user-actions", () => ({
  updateUserRole: (...args: unknown[]) => mockUpdateUserRole(...args),
}));

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

import UserRoleSelect from "../admin/users/UserRoleSelect";

describe("UserRoleSelect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUserRole.mockResolvedValue(undefined);
  });

  test("renders plain text when user cannot modify (same rank)", () => {
    render(<UserRoleSelect userId="u1" currentRole="vuohi" isSelf={false} actorRole="vuohi" />);
    expect(screen.getByText("vuohi")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  test("renders plain text when user is self", () => {
    render(<UserRoleSelect userId="u1" currentRole="admin" isSelf={true} actorRole="admin" />);
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  test("renders plain text for higher rank target", () => {
    render(<UserRoleSelect userId="u1" currentRole="superuser" isSelf={false} actorRole="vuohi" />);
    expect(screen.getByText("superuser")).toBeInTheDocument();
  });

  test("renders select dropdown when actor can modify lower-ranked user", () => {
    render(<UserRoleSelect userId="u1" currentRole="user" isSelf={false} actorRole="vuohi" />);
    // MUI Select renders a combobox
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  test("superuser can modify vuohi", () => {
    render(<UserRoleSelect userId="u1" currentRole="vuohi" isSelf={false} actorRole="superuser" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  test("admin cannot modify another admin", () => {
    render(<UserRoleSelect userId="u1" currentRole="admin" isSelf={false} actorRole="admin" />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });
});
