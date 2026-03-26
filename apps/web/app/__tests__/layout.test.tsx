import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "../layout";

describe("RootLayout", () => {
  test("renders children", () => {
    render(
      <RootLayout>
        <p>test content</p>
      </RootLayout>
    );
    expect(screen.getByText("test content")).toBeInTheDocument();
  });

  test("sets lang to fi", () => {
    const { container } = render(
      <RootLayout>
        <p>test</p>
      </RootLayout>
    );
    const html = container.closest("html");
    expect(html).toHaveAttribute("lang", "fi");
  });

  test("exports correct metadata", () => {
    expect(metadata.title).toBe("Platform");
    expect(metadata.icons).toEqual([]);
  });
});
