import "@testing-library/jest-dom";
import "jest-axe/extend-expect";

// Globally mock next/cache so unstable_cache becomes a passthrough in tests
jest.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_noStore: jest.fn(),
}));
