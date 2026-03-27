import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSwitcher from "../components/LanguageSwitcher";

jest.mock("next-intl", () => ({
  useLocale: () => "fi",
}));

jest.mock("@/i18n/actions", () => ({
  setLocale: jest.fn(),
}));

describe("LanguageSwitcher", () => {
  test("renders language icon button", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByLabelText("Change language")).toBeInTheDocument();
  });

  test("opens menu with all 4 languages", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByLabelText("Change language"));
    expect(screen.getByText("Suomi")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Soomaali")).toBeInTheDocument();
  });

  test("highlights current locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByLabelText("Change language"));
    const finnishItem = screen.getByText("Suomi").closest("li");
    expect(finnishItem).toHaveClass("Mui-selected");
  });
});
