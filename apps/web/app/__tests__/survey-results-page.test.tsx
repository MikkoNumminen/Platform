import { render, screen } from "@testing-library/react";
import SurveyResultsPage from "../admin/survey-results/page";

const mockAuth = jest.fn();
const mockGetSurveyResults = jest.fn();
const mockRedirect = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/survey-queries", () => ({
  getSurveyResults: () => mockGetSurveyResults(),
}));

jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

jest.mock("@/app/components/survey/ResultsBarChart", () => {
  return function MockChart({ title }: { title: string }) {
    return <div data-testid="chart">{title}</div>;
  };
});

jest.mock("@/app/components/survey/TextResponseList", () => {
  return function MockList({ title }: { title: string }) {
    return <div data-testid="text-list">{title}</div>;
  };
});

const surveyResults = {
  totalResponses: 5,
  conversationStyleCounts: [],
  featureCounts: [],
  mustHaveResponses: [],
  dealbreakerResponses: [],
  otherFeedbackResponses: [],
};

describe("SurveyResultsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSurveyResults.mockResolvedValue(surveyResults);
  });

  test("redirects when user lacks survey:results permission", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } });
    await expect(SurveyResultsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  test("redirects when user has no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(SurveyResultsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  test("renders survey results when user has permission", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", permissions: { "survey:results": true } },
    });
    const result = await SurveyResultsPage();
    render(result);
    expect(screen.getByText("Total responses: 5")).toBeInTheDocument();
    expect(screen.getByTestId("topbar")).toHaveTextContent("Survey Results");
  });
});
