import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import EventFormDialog from "../components/EventFormDialog";

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
};

function getTitleInput() {
  return screen.getByRole("textbox", { name: /title/i });
}

describe("EventFormDialog", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders create form when no event prop", () => {
    render(<EventFormDialog {...defaultProps} />);
    expect(screen.getByText("Create Event")).toBeInTheDocument();
    expect(getTitleInput()).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /location/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /all day/i })).toBeInTheDocument();
  });

  test("renders edit form when event prop is provided", () => {
    const event = {
      id: "evt-1",
      title: "Existing Event",
      description: "Details",
      location: "Room 1",
      startTime: new Date(2026, 2, 26, 10, 0),
      endTime: new Date(2026, 2, 26, 11, 0),
      allDay: false,
      authorId: "user-1",
    };
    render(<EventFormDialog {...defaultProps} event={event} />);
    expect(screen.getByText("Edit Event")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Event")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Details")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Room 1")).toBeInTheDocument();
  });

  test("shows date pickers when all day is checked", () => {
    render(<EventFormDialog {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox", { name: /all day/i });
    fireEvent.click(checkbox);
    // With allDay checked, we should see date inputs instead of datetime-local
    const dateInputs = screen.getAllByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  test("calls onSubmit with form data", async () => {
    render(<EventFormDialog {...defaultProps} />);
    fireEvent.change(getTitleInput(), { target: { value: "New Event" } });

    const createButton = screen.getByRole("button", { name: /create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Event",
        allDay: false,
      }),
    );
  });

  test("calls onClose after successful submit", async () => {
    render(<EventFormDialog {...defaultProps} />);
    fireEvent.change(getTitleInput(), { target: { value: "Test" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  test("shows error when submit fails", async () => {
    const failingSubmit = jest.fn().mockRejectedValue(new Error("fail"));
    render(<EventFormDialog {...defaultProps} onSubmit={failingSubmit} />);
    fireEvent.change(getTitleInput(), { target: { value: "Test" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to save event. Please try again.")).toBeInTheDocument();
    });
  });

  test("Create button is disabled when title is empty", () => {
    render(<EventFormDialog {...defaultProps} />);
    // Clear the default value that might be empty
    fireEvent.change(getTitleInput(), { target: { value: "" } });
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
  });

  test("Cancel button calls onClose", () => {
    render(<EventFormDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<EventFormDialog {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
