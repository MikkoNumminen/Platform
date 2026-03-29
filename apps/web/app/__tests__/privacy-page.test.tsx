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
    expect(screen.getByText("5a. Demo mode")).toBeInTheDocument();
    expect(screen.getByText("6. Your rights (GDPR)")).toBeInTheDocument();
    expect(screen.getByText("7. Security")).toBeInTheDocument();
    expect(screen.getByText("8. Breach notification")).toBeInTheDocument();
    expect(screen.getByText("9. Data processing")).toBeInTheDocument();
    expect(screen.getByText("10. Contact")).toBeInTheDocument();
  });

  test("includes contact email", () => {
    render(<PrivacyPolicyPage />);
    const emailLink = screen.getByRole("link", { name: /privacy@vuohiliitto\.com/i });
    expect(emailLink).toHaveAttribute("href", "mailto:privacy@vuohiliitto.com");
  });

  test("documents breach notification process", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/72 hours/)).toBeInTheDocument();
  });

  test("documents demo mode data handling", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/demo sessions are automatically deleted/i)).toBeInTheDocument();
  });

  test("explains DPO status", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/Data Protection Officer/)).toBeInTheDocument();
  });

  test("documents legal bases for data processing", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/Legitimate interest/)).toBeInTheDocument();
  });

  test("links to account settings page", () => {
    render(<PrivacyPolicyPage />);
    const links = screen.getAllByRole("link", { name: /account settings/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/account");
  });
});
