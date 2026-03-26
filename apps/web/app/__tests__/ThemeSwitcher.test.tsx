import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ThemeSwitcher from "../components/ThemeSwitcher";
import ThemeRegistry from "../components/ThemeRegistry";

function renderWithTheme() {
  return render(
    <ThemeRegistry>
      <ThemeSwitcher />
    </ThemeRegistry>,
  );
}

describe("ThemeSwitcher", () => {
  test("renders the palette button", () => {
    renderWithTheme();
    expect(screen.getByLabelText("Change theme")).toBeInTheDocument();
  });

  test("opens menu on click", () => {
    renderWithTheme();
    fireEvent.click(screen.getByLabelText("Change theme"));
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Cyberpunk")).toBeInTheDocument();
  });

  test("closes menu after selecting a theme", async () => {
    renderWithTheme();
    fireEvent.click(screen.getByLabelText("Change theme"));
    fireEvent.click(screen.getByText("Ocean"));
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });
});
