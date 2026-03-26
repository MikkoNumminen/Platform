import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import SingleSelect from "../components/survey/SingleSelect";

const options = ["Option A", "Option B", "Option C"];

describe("SingleSelect", () => {
  test("renders the label", () => {
    render(<SingleSelect label="Pick one" options={options} value="" onChange={jest.fn()} />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  test("renders all options", () => {
    render(<SingleSelect label="Pick one" options={options} value="" onChange={jest.fn()} />);
    for (const option of options) {
      expect(screen.getByLabelText(option)).toBeInTheDocument();
    }
  });

  test("calls onChange when an option is selected", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<SingleSelect label="Pick one" options={options} value="" onChange={handleChange} />);
    await user.click(screen.getByLabelText("Option B"));
    expect(handleChange).toHaveBeenCalledWith("Option B");
  });

  test("shows the selected value", () => {
    render(
      <SingleSelect label="Pick one" options={options} value="Option A" onChange={jest.fn()} />,
    );
    expect(screen.getByLabelText("Option A")).toBeChecked();
  });

  test("displays error message", () => {
    render(
      <SingleSelect
        label="Pick one"
        options={options}
        value=""
        onChange={jest.fn()}
        error="Required"
      />,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(
      <SingleSelect label="Pick one" options={options} value="" onChange={jest.fn()} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
