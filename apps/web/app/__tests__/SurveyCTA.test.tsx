import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import SurveyCTA from "../components/SurveyCTA";

describe("SurveyCTA", () => {
  test("renders survey CTA with heading and link", () => {
    render(<SurveyCTA />);
    expect(screen.getByText("Help us build this")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /take the survey/i })).toHaveAttribute(
      "href",
      "/survey",
    );
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<SurveyCTA />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
