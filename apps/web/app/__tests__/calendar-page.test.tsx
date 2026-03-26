import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import CalendarPage from "../calendar/page";

jest.mock("../components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

describe("CalendarPage", () => {
  test("renders the TopBar with 'Calendar' title", () => {
    render(<CalendarPage />);
    const topbar = screen.getByTestId("topbar");
    expect(topbar).toHaveTextContent("Calendar");
  });

  test("renders the CalendarGrid with day headers", () => {
    render(<CalendarPage />);
    for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test("renders mock events from getMockEvents", () => {
    render(<CalendarPage />);
    // getMockEvents returns events including "Community Meetup"
    expect(screen.getByText("Community Meetup")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<CalendarPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
