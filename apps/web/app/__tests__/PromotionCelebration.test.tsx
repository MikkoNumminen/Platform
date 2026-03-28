import { render, screen, act } from "@testing-library/react";
import PromotionCelebration from "../components/PromotionCelebration";

jest.mock("@/lib/promotion-actions", () => ({
  markPromotionSeen: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterProps(props)}>{children}</div>
    ),
    // eslint-disable-next-line @next/next/no-img-element
    img: (props: Record<string, unknown>) => <img {...filterProps(props)} />,
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...filterProps(props)}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function filterProps(props: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!["initial", "animate", "transition", "exit", "whileHover", "whileTap"].includes(k)) {
      safe[k] = v;
    }
  }
  return safe;
}

describe("PromotionCelebration", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders chaos phase initially with goat image", () => {
    render(<PromotionCelebration />);
    expect(screen.getByAltText("GOAT")).toBeInTheDocument();
  });

  test("renders chaos text elements", () => {
    render(<PromotionCelebration />);
    expect(screen.getByText("TERVETULOA")).toBeInTheDocument();
    expect(screen.getByText("VUOHI")).toBeInTheDocument();
  });

  test("transitions to calm phase with welcome text", () => {
    render(<PromotionCelebration />);

    act(() => {
      jest.advanceTimersByTime(4500);
    });

    expect(screen.getByText("Tervetuloa Vuohiliittoon.")).toBeInTheDocument();
  });

  test("calls onComplete and markPromotionSeen after full sequence", async () => {
    const { markPromotionSeen } =
      jest.requireMock<typeof import("@/lib/promotion-actions")>("@/lib/promotion-actions");
    const onComplete = jest.fn();
    render(<PromotionCelebration onComplete={onComplete} />);

    await act(async () => {
      jest.advanceTimersByTime(6500);
    });

    expect(markPromotionSeen).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
