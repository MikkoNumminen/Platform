import { metadata } from "../layout";

describe("RootLayout metadata", () => {
  test("has correct title", () => {
    expect(metadata.title).toBe("Platform");
  });

  test("has no icons", () => {
    expect(metadata.icons).toEqual([]);
  });
});
