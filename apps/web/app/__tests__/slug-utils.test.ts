import { slugify } from "@/lib/slug-utils";

describe("slugify", () => {
  it("converts to lowercase and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("trims whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("removes special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("replaces underscores with hyphens", () => {
    expect(slugify("hello_world")).toBe("hello-world");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("-hello-world-")).toBe("hello-world");
  });

  it("handles mixed whitespace and underscores", () => {
    expect(slugify("hello _ world")).toBe("hello-world");
  });

  it("returns empty string for non-alphanumeric input", () => {
    expect(slugify("@#$%")).toBe("");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});
