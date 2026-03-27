import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockCreateIssueReport = jest.fn();
const mockPush = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "u1", alias: "Test" } },
    status: "authenticated",
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/issue-actions", () => ({
  createIssueReport: (...args: unknown[]) => mockCreateIssueReport(...args),
}));

jest.mock("../components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

import ReportIssuePage from "@/app/report-issue/page";

describe("ReportIssuePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateIssueReport.mockResolvedValue(undefined);
  });

  test("renders the form", () => {
    render(<ReportIssuePage />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Report Issue");
    expect(screen.getByLabelText(/what's wrong/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/describe the issue/i)).toBeInTheDocument();
  });

  test("submit button disabled when fields empty", () => {
    render(<ReportIssuePage />);
    expect(screen.getByRole("button", { name: /submit report/i })).toBeDisabled();
  });

  test("submits report and shows success", async () => {
    render(<ReportIssuePage />);
    fireEvent.change(screen.getByLabelText(/what's wrong/i), { target: { value: "Bug" } });
    fireEvent.change(screen.getByLabelText(/describe the issue/i), {
      target: { value: "It broke" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

    await waitFor(() => {
      expect(mockCreateIssueReport).toHaveBeenCalledWith("Bug", "It broke", undefined);
    });

    await waitFor(() => {
      expect(screen.getByText(/thanks/i)).toBeInTheDocument();
    });
  });

  test("shows error on failure", async () => {
    mockCreateIssueReport.mockResolvedValue({
      error: "Not authenticated",
      code: "permissionDenied",
    });
    render(<ReportIssuePage />);
    fireEvent.change(screen.getByLabelText(/what's wrong/i), { target: { value: "Bug" } });
    fireEvent.change(screen.getByLabelText(/describe the issue/i), {
      target: { value: "Broke" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

    await waitFor(() => {
      expect(screen.getByText("Not authenticated")).toBeInTheDocument();
    });
  });
});
