import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

jest.mock("@/lib/db", () => ({
  prisma: {
    calendarEvent: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock("@/auth", () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: "u1", permissions: {} },
  }),
}));

jest.mock("@/lib/calendar-actions", () => ({
  fetchEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

jest.mock("../components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

import CalendarPage from "../calendar/page";

describe("CalendarPage", () => {
  test("renders the TopBar with 'Calendar' title", async () => {
    const Page = await CalendarPage();
    render(Page);
    const topbar = screen.getByTestId("topbar");
    expect(topbar).toHaveTextContent("Calendar");
  });

  test("renders the CalendarGrid with day headers", async () => {
    const Page = await CalendarPage();
    render(Page);
    for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test("has no accessibility violations", async () => {
    const Page = await CalendarPage();
    const { container } = render(Page);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
