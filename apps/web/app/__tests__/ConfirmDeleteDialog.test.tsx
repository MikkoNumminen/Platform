import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onConfirm: jest.fn().mockResolvedValue(undefined),
  title: "Delete Item",
  message: "Are you sure you want to delete this?",
};

describe("ConfirmDeleteDialog", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders the title", () => {
    render(<ConfirmDeleteDialog {...defaultProps} />);
    expect(screen.getByText("Delete Item")).toBeInTheDocument();
  });

  test("renders the message", () => {
    render(<ConfirmDeleteDialog {...defaultProps} />);
    expect(screen.getByText("Are you sure you want to delete this?")).toBeInTheDocument();
  });

  test("renders cancel and delete buttons", () => {
    render(<ConfirmDeleteDialog {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  test("calls onClose when cancel is clicked", () => {
    render(<ConfirmDeleteDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("does not render when closed", () => {
    render(<ConfirmDeleteDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Delete Item")).not.toBeInTheDocument();
  });
});
