import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import SurveyCTA from "../components/SurveyCTA";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("SurveyCTA", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test("renders survey CTA when not submitted", () => {
    render(<SurveyCTA />);
    expect(screen.getByText("Help us build this")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /take the survey/i })).toHaveAttribute(
      "href",
      "/survey",
    );
  });

  test("shows redo link when already submitted", () => {
    localStorageMock.setItem("platform_survey_submitted", "true");
    render(<SurveyCTA />);
    expect(screen.getByText("Thanks for your feedback!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /redo the survey/i })).toHaveAttribute(
      "href",
      "/survey",
    );
  });

  test("has no accessibility violations when not submitted", async () => {
    const { container } = render(<SurveyCTA />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("has no accessibility violations when submitted", async () => {
    localStorageMock.setItem("platform_survey_submitted", "true");
    const { container } = render(<SurveyCTA />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
