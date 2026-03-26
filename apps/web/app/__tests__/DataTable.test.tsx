import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import DataTable, { type Column } from "../components/DataTable";

interface TestRow {
  id: string;
  name: string;
  age: number;
}

const columns: Column<TestRow>[] = [
  { id: "name", label: "Name", accessor: (r) => r.name },
  { id: "age", label: "Age", accessor: (r) => r.age },
];

const rows: TestRow[] = [
  { id: "1", name: "Alice", age: 30 },
  { id: "2", name: "Bob", age: 25 },
  { id: "3", name: "Charlie", age: 35 },
];

const keyAccessor = (r: TestRow) => r.id;

describe("DataTable", () => {
  test("renders column headers", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
  });

  test("renders all rows", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  test("renders empty message when no rows", () => {
    render(<DataTable columns={columns} rows={[]} keyAccessor={keyAccessor} />);
    expect(screen.getByText("No data to display.")).toBeInTheDocument();
  });

  test("renders custom empty message", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        keyAccessor={keyAccessor}
        emptyMessage="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  test("filters rows by search query", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />);
    const search = screen.getByPlaceholderText("Search...");
    fireEvent.change(search, { target: { value: "alice" } });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
  });

  test("search is case-insensitive", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />);
    const search = screen.getByPlaceholderText("Search...");
    fireEvent.change(search, { target: { value: "BOB" } });
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("shows empty message when search matches nothing", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />);
    const search = screen.getByPlaceholderText("Search...");
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText("No data to display.")).toBeInTheDocument();
  });

  test("uses custom search placeholder", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        keyAccessor={keyAccessor}
        searchPlaceholder="Find users..."
      />,
    );
    expect(screen.getByPlaceholderText("Find users...")).toBeInTheDocument();
  });

  test("sorts by column when header is clicked", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />);
    // Click Age to sort ascending
    fireEvent.click(screen.getByText("Age"));
    const cells = screen.getAllByRole("cell");
    // Find age values (every second cell)
    const ages = cells.filter((_, i) => i % 2 === 1).map((c) => c.textContent);
    expect(ages).toEqual(["25", "30", "35"]);
  });

  test("reverses sort direction on second click", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />);
    fireEvent.click(screen.getByText("Age"));
    fireEvent.click(screen.getByText("Age"));
    const cells = screen.getAllByRole("cell");
    const ages = cells.filter((_, i) => i % 2 === 1).map((c) => c.textContent);
    expect(ages).toEqual(["35", "30", "25"]);
  });

  test("paginates when rows exceed pageSize", () => {
    const manyRows = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      age: 20 + i,
    }));
    render(<DataTable columns={columns} rows={manyRows} keyAccessor={keyAccessor} pageSize={5} />);
    // First page shows 5 rows
    expect(screen.getByText("User 0")).toBeInTheDocument();
    expect(screen.getByText("User 4")).toBeInTheDocument();
    expect(screen.queryByText("User 5")).not.toBeInTheDocument();
    // Pagination controls should be visible
    expect(screen.getByText(/1–5 of 15/)).toBeInTheDocument();
  });

  test("does not show pagination when all rows fit", () => {
    render(<DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} pageSize={10} />);
    expect(screen.queryByText(/1–/)).not.toBeInTheDocument();
  });

  test("uses custom render function for column", () => {
    const columnsWithRender: Column<TestRow>[] = [
      {
        id: "name",
        label: "Name",
        accessor: (r) => r.name,
        render: (r) => <strong data-testid="bold-name">{r.name}</strong>,
      },
    ];
    render(<DataTable columns={columnsWithRender} rows={rows} keyAccessor={keyAccessor} />);
    expect(screen.getAllByTestId("bold-name")).toHaveLength(3);
  });

  test("non-sortable column does not have sort label", () => {
    const cols: Column<TestRow>[] = [
      { id: "name", label: "Name", accessor: (r) => r.name, sortable: false },
    ];
    render(<DataTable columns={cols} rows={rows} keyAccessor={keyAccessor} />);
    // The header should just be text, not a button
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Name" })).not.toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(
      <DataTable columns={columns} rows={rows} keyAccessor={keyAccessor} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
