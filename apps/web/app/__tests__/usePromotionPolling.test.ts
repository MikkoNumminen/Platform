import { renderHook, act } from "@testing-library/react";
import { usePromotionPolling } from "../hooks/usePromotionPolling";

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ promoted: false, hasSeenPromotion: false }),
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("usePromotionPolling", () => {
  it("does not poll when role is not 'pending'", () => {
    renderHook(() => usePromotionPolling("member"));

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("polls every 5 seconds when role is 'pending'", () => {
    renderHook(() => usePromotionPolling("pending"));

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("sets shouldCelebrate=true when promoted and hasSeenPromotion=false", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ promoted: true, hasSeenPromotion: false }),
    });

    const { result } = renderHook(() => usePromotionPolling("pending"));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.shouldCelebrate).toBe(true);
  });

  it("stops polling when promoted and hasSeenPromotion=true (no celebration)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ promoted: true, hasSeenPromotion: true }),
    });

    const { result } = renderHook(() => usePromotionPolling("pending"));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.shouldCelebrate).toBe(false);

    (global.fetch as jest.Mock).mockClear();

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("clearCelebration resets shouldCelebrate to false", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ promoted: true, hasSeenPromotion: false }),
    });

    const { result } = renderHook(() => usePromotionPolling("pending"));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.shouldCelebrate).toBe(true);

    act(() => {
      result.current.clearCelebration();
    });

    expect(result.current.shouldCelebrate).toBe(false);
  });

  it("cleans up interval on unmount", () => {
    const { unmount } = renderHook(() => usePromotionPolling("pending"));

    unmount();

    (global.fetch as jest.Mock).mockClear();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("silently ignores fetch errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePromotionPolling("pending"));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.shouldCelebrate).toBe(false);
  });
});
