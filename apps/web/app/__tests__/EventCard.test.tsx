import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import EventCard, { EventChip, EventDetailDialog } from "../components/EventCard";
import type { CalendarEvent } from "../data/mockEvents";

const sampleEvent: CalendarEvent = {
  id: "evt-1",
  title: "Community Meetup",
  description: "Monthly get-together for platform members.",
  location: "Helsinki Hub, Kamppi",
  startTime: new Date(2026, 2, 5, 18, 0),
  endTime: new Date(2026, 2, 5, 20, 0),
  allDay: false,
  authorId: "user-1",
};

const allDayEvent: CalendarEvent = {
  id: "evt-2",
  title: "Maintenance Window",
  description: "Scheduled downtime.",
  location: null,
  startTime: new Date(2026, 2, 12),
  endTime: new Date(2026, 2, 12),
  allDay: true,
  authorId: "user-2",
};

describe("EventChip", () => {
  test("renders the event title", () => {
    render(<EventChip event={sampleEvent} onClick={jest.fn()} />);
    expect(screen.getByText("Community Meetup")).toBeInTheDocument();
  });

  test("calls onClick with event when clicked", () => {
    const handleClick = jest.fn();
    render(<EventChip event={sampleEvent} onClick={handleClick} />);
    fireEvent.click(screen.getByText("Community Meetup"));
    expect(handleClick).toHaveBeenCalledWith(sampleEvent);
  });
});

describe("EventDetailDialog", () => {
  test("renders event details when open", () => {
    render(
      <EventDetailDialog event={sampleEvent} open={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Community Meetup")).toBeInTheDocument();
    expect(
      screen.getByText("Monthly get-together for platform members.")
    ).toBeInTheDocument();
    expect(screen.getByText("Helsinki Hub, Kamppi")).toBeInTheDocument();
  });

  test("shows 'All day' for all-day events", () => {
    render(
      <EventDetailDialog event={allDayEvent} open={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("All day")).toBeInTheDocument();
  });

  test("does not render when event is null", () => {
    const { container } = render(
      <EventDetailDialog event={null} open={false} onClose={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("EventCard", () => {
  test("renders the event title", () => {
    render(<EventCard event={sampleEvent} />);
    expect(screen.getByText("Community Meetup")).toBeInTheDocument();
  });

  test("renders the location when present", () => {
    render(<EventCard event={sampleEvent} />);
    expect(screen.getByText("Helsinki Hub, Kamppi")).toBeInTheDocument();
  });

  test("does not render location when null", () => {
    render(<EventCard event={allDayEvent} />);
    expect(screen.queryByText("Helsinki Hub, Kamppi")).not.toBeInTheDocument();
  });

  test("shows 'All day' for all-day events", () => {
    render(<EventCard event={allDayEvent} />);
    expect(screen.getByText("All day")).toBeInTheDocument();
  });

  test("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<EventCard event={sampleEvent} onClick={handleClick} />);
    fireEvent.click(screen.getByText("Community Meetup"));
    expect(handleClick).toHaveBeenCalledWith(sampleEvent);
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<EventCard event={sampleEvent} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
