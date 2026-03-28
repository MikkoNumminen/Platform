import { render, screen } from "@testing-library/react";
import PromotionGate from "../components/PromotionGate";

const mockSession = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockSession(),
}));

jest.mock("@/app/hooks/usePromotionPolling", () => ({
  usePromotionPolling: () => ({ shouldCelebrate: false, clearCelebration: jest.fn() }),
}));

jest.mock("@/app/components/PromotionCelebration", () => {
  return function MockCelebration() {
    return <div data-testid="celebration">CELEBRATION</div>;
  };
});

describe("PromotionGate", () => {
  test("renders nothing when hasSeenPromotion is true", () => {
    mockSession.mockReturnValue({
      data: { user: { role: "vuohi", hasSeenPromotion: true } },
    });
    const { container } = render(<PromotionGate />);
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when user is pending", () => {
    mockSession.mockReturnValue({
      data: { user: { role: "pending", hasSeenPromotion: true } },
    });
    const { container } = render(<PromotionGate />);
    expect(container.innerHTML).toBe("");
  });

  test("renders celebration when hasSeenPromotion is false and role is vuohi", () => {
    mockSession.mockReturnValue({
      data: { user: { role: "vuohi", hasSeenPromotion: false } },
    });
    render(<PromotionGate />);
    expect(screen.getByTestId("celebration")).toBeInTheDocument();
  });

  test("renders nothing when not authenticated", () => {
    mockSession.mockReturnValue({ data: null });
    const { container } = render(<PromotionGate />);
    expect(container.innerHTML).toBe("");
  });
});
