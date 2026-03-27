import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseSession = jest.fn();
const mockUpdate = jest.fn();
const mockReplace = jest.fn();
const mockSetAlias = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => ({ ...mockUseSession(), update: mockUpdate }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/lib/alias-actions", () => ({
  setAlias: (...args: unknown[]) => mockSetAlias(...args),
}));

import SetupAliasPage from "@/app/setup-alias/page";

describe("SetupAliasPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: { user: { id: "u1", alias: null } }, status: "authenticated" });
    mockSetAlias.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  test("renders alias setup form", () => {
    render(<SetupAliasPage />);
    expect(screen.getByText("Choose your alias")).toBeInTheDocument();
    expect(screen.getByLabelText(/alias/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set alias/i })).toBeInTheDocument();
  });

  test("submit button is disabled when alias is too short", () => {
    render(<SetupAliasPage />);
    const button = screen.getByRole("button", { name: /set alias/i });
    expect(button).toBeDisabled();
  });

  test("submit button is enabled with valid alias", () => {
    render(<SetupAliasPage />);
    const input = screen.getByLabelText(/alias/i);
    fireEvent.change(input, { target: { value: "testuser" } });
    const button = screen.getByRole("button", { name: /set alias/i });
    expect(button).toBeEnabled();
  });

  test("submits alias and redirects on success", async () => {
    render(<SetupAliasPage />);
    const input = screen.getByLabelText(/alias/i);
    fireEvent.change(input, { target: { value: "myalias" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockSetAlias).toHaveBeenCalledWith("myalias");
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  test("shows error when action returns error", async () => {
    mockSetAlias.mockResolvedValue({ error: "This alias is already taken", code: "conflict" });
    render(<SetupAliasPage />);
    const input = screen.getByLabelText(/alias/i);
    fireEvent.change(input, { target: { value: "taken" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("This alias is already taken")).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("redirects to home if user already has alias", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", alias: "existing" } },
      status: "authenticated",
    });
    render(<SetupAliasPage />);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
