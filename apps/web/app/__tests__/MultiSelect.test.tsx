import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import MultiSelect from "../components/survey/MultiSelect";

const options = ["Feature A", "Feature B", "Feature C"];

describe("MultiSelect", () => {
  test("renders the label", () => {
    render(<MultiSelect label="Pick features" options={options} value={[]} onChange={jest.fn()} />);
    expect(screen.getByText("Pick features")).toBeInTheDocument();
  });

  test("renders all options as checkboxes", () => {
    render(<MultiSelect label="Pick features" options={options} value={[]} onChange={jest.fn()} />);
    for (const option of options) {
      expect(screen.getByLabelText(option)).toBeInTheDocument();
    }
  });

  test("calls onChange with added item when checkbox clicked", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(
      <MultiSelect label="Pick features" options={options} value={[]} onChange={handleChange} />,
    );
    await user.click(screen.getByLabelText("Feature B"));
    expect(handleChange).toHaveBeenCalledWith(["Feature B"]);
  });

  test("calls onChange with item removed when unchecked", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(
      <MultiSelect
        label="Pick features"
        options={options}
        value={["Feature A", "Feature B"]}
        onChange={handleChange}
      />,
    );
    await user.click(screen.getByLabelText("Feature A"));
    expect(handleChange).toHaveBeenCalledWith(["Feature B"]);
  });

  test("shows checked state for selected values", () => {
    render(
      <MultiSelect
        label="Pick features"
        options={options}
        value={["Feature A"]}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Feature A")).toBeChecked();
    expect(screen.getByLabelText("Feature B")).not.toBeChecked();
  });

  test("displays error message", () => {
    render(
      <MultiSelect
        label="Pick features"
        options={options}
        value={[]}
        onChange={jest.fn()}
        error="Select at least one"
      />,
    );
    expect(screen.getByText("Select at least one")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(
      <MultiSelect label="Pick features" options={options} value={[]} onChange={jest.fn()} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
