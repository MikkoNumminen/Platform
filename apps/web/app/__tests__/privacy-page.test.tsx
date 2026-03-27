import { render, screen } from "@testing-library/react";
import PrivacyPolicyPage from "../privacy/page";

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

describe("PrivacyPolicyPage", () => {
  test("renders privacy policy heading", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Privacy Policy");
  });

  test("renders all sections", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText("1. What data we collect")).toBeInTheDocument();
    expect(screen.getByText("2. How we use your data")).toBeInTheDocument();
    expect(screen.getByText("3. Cookies and local storage")).toBeInTheDocument();
    expect(screen.getByText("4. Third-party sharing")).toBeInTheDocument();
    expect(screen.getByText("5. Data retention")).toBeInTheDocument();
    expect(screen.getByText("6. Your rights (GDPR)")).toBeInTheDocument();
    expect(screen.getByText("7. Security")).toBeInTheDocument();
    expect(screen.getByText("8. Contact")).toBeInTheDocument();
  });

  test("links to account settings page", () => {
    render(<PrivacyPolicyPage />);
    const links = screen.getAllByRole("link", { name: /account settings/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/account");
  });
});
