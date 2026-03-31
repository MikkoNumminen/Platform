import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseSession = jest.fn();
const mockCreateShout = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock("@/lib/shout-actions", () => ({
  createShout: (...args: unknown[]) => mockCreateShout(...args),
}));

jest.mock("@/app/components/XpToastProvider", () => ({
  useXpToast: () => ({ onAction: jest.fn() }),
}));

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

jest.mock("@/lib/dm-actions", () => ({
  sendDirectMessage: jest.fn(),
  startConversation: jest.fn(),
}));

jest.mock("@/lib/dm-queries", () => ({
  getConversationMessages: jest.fn().mockResolvedValue([]),
  getDmUsers: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/setting-actions", () => ({
  setMotd: jest.fn().mockResolvedValue(undefined),
}));

import Shoutbox from "@/app/components/Shoutbox";
import type { ShoutData } from "@/lib/shout-queries";

const sampleShouts: ShoutData[] = [
  {
    id: "s1",
    message: "Hello!",
    alias: "Alice",
    role: "user",
    developerTag: "coder",
    createdAt: "2026-03-27T10:00:00Z",
  },
  {
    id: "s2",
    message: "Hey there",
    alias: "Bob",
    role: "superuser",
    developerTag: null,
    createdAt: "2026-03-27T10:01:00Z",
  },
];

describe("Shoutbox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", alias: "TestUser", name: "Test" } },
      status: "authenticated",
    });
    mockCreateShout.mockResolvedValue(undefined);
  });

  test("renders shout messages with IRC format", () => {
    render(<Shoutbox initialShouts={sampleShouts} initialConversations={[]} motd="Welcome." />);
    expect(screen.getByText("<Alice>")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("<Bob>")).toBeInTheDocument();
    expect(screen.getByText("Hey there")).toBeInTheDocument();
  });

  test("renders empty state when no shouts", () => {
    render(<Shoutbox initialShouts={[]} initialConversations={[]} motd="Welcome." />);
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  test("renders input field for authenticated users", () => {
    render(<Shoutbox initialShouts={[]} initialConversations={[]} motd="Welcome." />);
    expect(screen.getByPlaceholderText("Write a comment...")).toBeInTheDocument();
  });

  test("does not render input for unauthenticated users", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<Shoutbox initialShouts={[]} initialConversations={[]} motd="Welcome." />);
    expect(screen.queryByPlaceholderText("Write a comment...")).not.toBeInTheDocument();
  });

  test("submits a message", async () => {
    render(<Shoutbox initialShouts={[]} initialConversations={[]} motd="Welcome." />);
    const input = screen.getByPlaceholderText("Write a comment...");
    fireEvent.change(input, { target: { value: "Test shout" } });
    fireEvent.submit(input);

    await waitFor(() => {
      expect(mockCreateShout).toHaveBeenCalledWith("Test shout");
    });
  });

  test("shows optimistic message immediately", async () => {
    render(<Shoutbox initialShouts={[]} initialConversations={[]} motd="Welcome." />);
    const input = screen.getByPlaceholderText("Write a comment...");
    fireEvent.change(input, { target: { value: "Optimistic!" } });
    fireEvent.submit(input);

    expect(screen.getByText("Optimistic!")).toBeInTheDocument();
    expect(screen.getByText("<TestUser>")).toBeInTheDocument();
  });

  test("renders Guild tab", () => {
    render(<Shoutbox initialShouts={[]} initialConversations={[]} motd="Welcome." />);
    expect(screen.getByText("Guild")).toBeInTheDocument();
  });
});
