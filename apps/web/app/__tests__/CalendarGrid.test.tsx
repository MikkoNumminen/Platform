import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import CalendarGrid from "../components/CalendarGrid";
import type { CalendarEvent } from "../data/mockEvents";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const now = new Date();
  return {
    id: "evt-test",
    title: "Test Event",
    description: "A test event description",
    location: "Test Location",
    startTime: new Date(now.getFullYear(), now.getMonth(), 15, 10, 0),
    endTime: new Date(now.getFullYear(), now.getMonth(), 15, 12, 0),
    allDay: false,
    authorId: "user-1",
    ...overrides,
  };
}

describe("CalendarGrid", () => {
  test("renders the current month and year", () => {
    render(<CalendarGrid events={[]} />);
    const now = new Date();
    const expected = now.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  test("renders all day-of-week headers", () => {
    render(<CalendarGrid events={[]} />);
    for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test("navigates to the previous month", () => {
    render(<CalendarGrid events={[]} />);
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const expected = prevMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

    const prevButton = screen.getByTestId("ChevronLeftIcon").closest("button")!;
    fireEvent.click(prevButton);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  test("navigates to the next month", () => {
    render(<CalendarGrid events={[]} />);
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const expected = nextMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

    const nextButton = screen.getByTestId("ChevronRightIcon").closest("button")!;
    fireEvent.click(nextButton);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  test("renders event chips for events in the current month", () => {
    const event = makeEvent({ title: "My Calendar Event" });
    render(<CalendarGrid events={[event]} />);
    expect(screen.getByText("My Calendar Event")).toBeInTheDocument();
  });

  test("opens event detail dialog on chip click", () => {
    const event = makeEvent({
      title: "Clickable Event",
      description: "Detail description here",
    });
    render(<CalendarGrid events={[event]} />);

    fireEvent.click(screen.getByText("Clickable Event"));
    expect(screen.getByText("Detail description here")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<CalendarGrid events={[]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
