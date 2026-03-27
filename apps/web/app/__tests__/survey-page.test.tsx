import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

const mockAuth = jest.fn();
const mockRedirect = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

jest.mock("../components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

jest.mock("../components/survey/SurveyForm", () => {
  return function MockSurveyForm() {
    return <div data-testid="survey-form">Survey Form</div>;
  };
});

import SurveyPage from "../survey/page";

describe("SurveyPage", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "u1" } });
    });

    test("renders TopBar with correct title", async () => {
      render(await SurveyPage());
      expect(screen.getByTestId("topbar")).toHaveTextContent("Community Survey");
    });

    test("renders SurveyForm", async () => {
      render(await SurveyPage());
      expect(screen.getByTestId("survey-form")).toBeInTheDocument();
    });

    test("has no accessibility violations", async () => {
      const { container } = render(await SurveyPage());
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  test("redirects unauthenticated users to sign-in", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(SurveyPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/signin");
  });
});
