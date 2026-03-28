import { render, screen, fireEvent } from "@testing-library/react";
import BoardFormDialog from "../components/BoardFormDialog";

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

jest.mock("@/lib/board-actions", () => ({
  createBoard: jest.fn().mockResolvedValue(undefined),
  updateBoard: jest.fn().mockResolvedValue(undefined),
}));

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  mode: "create" as const,
};

describe("BoardFormDialog", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders create title in create mode", () => {
    render(<BoardFormDialog {...defaultProps} />);
    expect(screen.getByText("Create Board")).toBeInTheDocument();
  });

  test("renders edit title in edit mode", () => {
    render(<BoardFormDialog {...defaultProps} mode="edit" boardId="b1" initialName="Old Name" />);
    expect(screen.getByText("Edit Board")).toBeInTheDocument();
  });

  test("renders name and description fields", () => {
    render(<BoardFormDialog {...defaultProps} />);
    expect(screen.getByLabelText("Board name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description (optional)")).toBeInTheDocument();
  });

  test("create button is disabled when name is empty", () => {
    render(<BoardFormDialog {...defaultProps} />);
    expect(screen.getByText("Create")).toBeDisabled();
  });

  test("create button is enabled when name is entered", () => {
    render(<BoardFormDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Board name"), { target: { value: "Test" } });
    expect(screen.getByText("Create")).toBeEnabled();
  });

  test("pre-fills fields in edit mode", () => {
    render(
      <BoardFormDialog
        {...defaultProps}
        mode="edit"
        boardId="b1"
        initialName="My Board"
        initialDescription="A description"
      />,
    );
    expect(screen.getByLabelText("Board name")).toHaveValue("My Board");
    expect(screen.getByLabelText("Description (optional)")).toHaveValue("A description");
  });

  test("renders cancel and submit buttons", () => {
    render(<BoardFormDialog {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  test("shows Save button in edit mode", () => {
    render(<BoardFormDialog {...defaultProps} mode="edit" boardId="b1" initialName="Name" />);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(<BoardFormDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Create Board")).not.toBeInTheDocument();
  });
});
