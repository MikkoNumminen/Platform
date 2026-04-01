import SurveyResultsPage from "../admin/survey-results/page";

const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

describe("SurveyResultsPage", () => {
  test("redirects to /feedback", () => {
    expect(() => SurveyResultsPage()).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/feedback");
  });
});
