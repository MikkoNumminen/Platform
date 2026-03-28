import { render, screen } from "@testing-library/react";

const mockNotFound = jest.fn();

jest.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NOT_FOUND");
  },
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

import TopicPage from "../forums/[slug]/[topicSlug]/page";

const makeParams = (slug: string, topicSlug: string) => Promise.resolve({ slug, topicSlug });

describe("TopicPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls notFound for non-existent forum", async () => {
    await expect(TopicPage({ params: makeParams("fake", "fake") })).rejects.toThrow("NOT_FOUND");
  });

  test("calls notFound for non-existent topic", async () => {
    await expect(
      TopicPage({ params: makeParams("general-discussion", "nonexistent") }),
    ).rejects.toThrow("NOT_FOUND");
  });

  test("renders topic title in TopBar", async () => {
    const page = await TopicPage({
      params: makeParams("general-discussion", "welcome-to-the-community"),
    });
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Welcome to the community!");
  });

  test("renders topic body and author", async () => {
    const page = await TopicPage({
      params: makeParams("general-discussion", "introduce-yourself-here"),
    });
    render(page);
    expect(screen.getByText(/I'm Mikko/)).toBeInTheDocument();
    expect(screen.getByText("Mikko")).toBeInTheDocument();
  });

  test("renders locked chip for locked topic", async () => {
    const page = await TopicPage({
      params: makeParams("general-discussion", "community-guidelines-and-rules"),
    });
    render(page);
    expect(screen.getByText("This topic is locked")).toBeInTheDocument();
  });

  test("does not render locked chip for unlocked topic", async () => {
    const page = await TopicPage({
      params: makeParams("development", "typescript-strict-mode"),
    });
    render(page);
    expect(screen.queryByText("This topic is locked")).not.toBeInTheDocument();
  });

  test("renders coming soon message for replies", async () => {
    const page = await TopicPage({
      params: makeParams("development", "nextjs-15-app-router-tips"),
    });
    render(page);
    expect(screen.getByText("Replies and comments coming soon.")).toBeInTheDocument();
  });
});
