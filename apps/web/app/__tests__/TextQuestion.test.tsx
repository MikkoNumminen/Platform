import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import TextQuestion from "../components/survey/TextQuestion";

describe("TextQuestion", () => {
  test("renders the label", () => {
    render(
      <TextQuestion
        label="Your thoughts"
        placeholder="Type here..."
        value=""
        onChange={jest.fn()}
        maxLength={200}
      />,
    );
    expect(screen.getByText("Your thoughts")).toBeInTheDocument();
  });

  test("shows required asterisk when required", () => {
    render(
      <TextQuestion
        label="Your thoughts"
        placeholder="Type here..."
        value=""
        onChange={jest.fn()}
        maxLength={200}
        required
      />,
    );
    expect(screen.getByText("Your thoughts *")).toBeInTheDocument();
  });

  test("renders placeholder text", () => {
    render(
      <TextQuestion
        label="Your thoughts"
        placeholder="Type here..."
        value=""
        onChange={jest.fn()}
        maxLength={200}
      />,
    );
    expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
  });

  test("calls onChange when typing", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(
      <TextQuestion
        label="Your thoughts"
        placeholder="Type here..."
        value=""
        onChange={handleChange}
        maxLength={200}
      />,
    );
    await user.type(screen.getByRole("textbox"), "Hello");
    expect(handleChange).toHaveBeenCalled();
  });

  test("displays character count", () => {
    render(
      <TextQuestion
        label="Your thoughts"
        placeholder="Type here..."
        value="Hello"
        onChange={jest.fn()}
        maxLength={200}
      />,
    );
    expect(screen.getByText("5/200")).toBeInTheDocument();
  });

  test("displays error message instead of character count", () => {
    render(
      <TextQuestion
        label="Your thoughts"
        placeholder="Type here..."
        value=""
        onChange={jest.fn()}
        maxLength={200}
        error="This field is required"
      />,
    );
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(
      <TextQuestion
        label="Your thoughts"
        placeholder="Type here..."
        value=""
        onChange={jest.fn()}
        maxLength={200}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
