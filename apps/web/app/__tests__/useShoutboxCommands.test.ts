import { renderHook } from "@testing-library/react";

const mockSetMotdAction = jest.fn();
const mockGetDmUserDetails = jest.fn();

jest.mock("@/lib/setting-actions", () => ({
  setMotd: (...args: unknown[]) => mockSetMotdAction(...args),
}));

jest.mock("@/lib/dm-queries", () => ({
  getDmUserDetails: (...args: unknown[]) => mockGetDmUserDetails(...args),
  getConversationMessages: jest.fn().mockResolvedValue([]),
  getDmUsers: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/developer-config", () => ({
  DEVELOPER_TAG_LABELS: { coder: "Coder", architect: "Architect" },
  DEVELOPER_TAG_ICONS: { coder: "💻", architect: "🏗️" },
}));

import { useShoutboxCommands } from "@/app/components/shoutbox/useShoutboxCommands";
import type { SystemLine } from "@/app/components/shoutbox/SystemMessages";

const helpLines: SystemLine[] = [
  { label: "[System]", text: "Available commands:" },
  { label: "/help", text: "— show this help" },
];

function buildParams(overrides = {}) {
  return {
    ensureUsersLoaded: jest.fn().mockResolvedValue([]),
    setLocalSystemMsgs: jest.fn(),
    helpLines,
    canChangeMotd: true,
    setCurrentMotd: jest.fn(),
    userRole: "user" as string | undefined,
    ...overrides,
  };
}

describe("useShoutboxCommands", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleHelpCommand", () => {
    test("appends helpLines to localSystemMsgs", () => {
      const setLocalSystemMsgs = jest.fn();
      const params = buildParams({ setLocalSystemMsgs });
      const { result } = renderHook(() => useShoutboxCommands(params));

      result.current.handleHelpCommand();

      expect(setLocalSystemMsgs).toHaveBeenCalledTimes(1);
      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const prev: SystemLine[] = [];
      expect(updater(prev)).toEqual(helpLines);
    });
  });

  describe("handleWhoCommand", () => {
    test("adds not found message when alias does not match", async () => {
      const setLocalSystemMsgs = jest.fn();
      const ensureUsersLoaded = jest
        .fn()
        .mockResolvedValue([{ id: "u1", alias: "Alice", role: "user", developerTag: null }]);
      const params = buildParams({ setLocalSystemMsgs, ensureUsersLoaded });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleWhoCommand("Unknown");

      expect(setLocalSystemMsgs).toHaveBeenCalledTimes(1);
      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const added = updater([]);
      expect(added[0].text).toContain('"Unknown"');
    });

    test("adds player info when alias matches", async () => {
      const setLocalSystemMsgs = jest.fn();
      const ensureUsersLoaded = jest
        .fn()
        .mockResolvedValue([{ id: "u1", alias: "Alice", role: "user", developerTag: null }]);
      const params = buildParams({ setLocalSystemMsgs, ensureUsersLoaded });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleWhoCommand("Alice");

      expect(setLocalSystemMsgs).toHaveBeenCalledTimes(1);
      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const added = updater([]);
      expect(added[0].label).toBe("[Who]");
      expect(added[0].text).toContain("Alice");
    });

    test("includes developer tag icon and label in info", async () => {
      const setLocalSystemMsgs = jest.fn();
      const ensureUsersLoaded = jest
        .fn()
        .mockResolvedValue([{ id: "u1", alias: "Dev", role: "user", developerTag: "coder" }]);
      const params = buildParams({ setLocalSystemMsgs, ensureUsersLoaded });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleWhoCommand("Dev");

      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const added = updater([]);
      expect(added[0].text).toContain("💻");
      expect(added[0].text).toContain("Coder");
    });

    test("shows superuser label for superuser role", async () => {
      const setLocalSystemMsgs = jest.fn();
      const ensureUsersLoaded = jest
        .fn()
        .mockResolvedValue([{ id: "u1", alias: "Admin", role: "superuser", developerTag: null }]);
      const params = buildParams({ setLocalSystemMsgs, ensureUsersLoaded });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleWhoCommand("Admin");

      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const added = updater([]);
      expect(added[0].text).toContain("⭐ Superuser");
    });

    test("fetches extra details when caller is superuser", async () => {
      mockGetDmUserDetails.mockResolvedValue({ name: "Alice Smith", email: "alice@example.com" });
      const setLocalSystemMsgs = jest.fn();
      const ensureUsersLoaded = jest
        .fn()
        .mockResolvedValue([{ id: "u1", alias: "Alice", role: "user", developerTag: null }]);
      const params = buildParams({ setLocalSystemMsgs, ensureUsersLoaded, userRole: "superuser" });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleWhoCommand("Alice");

      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const added = updater([]);
      expect(added[0].text).toContain("Alice Smith");
      expect(added[0].text).toContain("alice@example.com");
    });
  });

  describe("handleMotdCommand", () => {
    test("does nothing when canChangeMotd is false", async () => {
      const setCurrentMotd = jest.fn();
      const params = buildParams({ canChangeMotd: false, setCurrentMotd });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleMotdCommand("New MOTD");

      expect(mockSetMotdAction).not.toHaveBeenCalled();
      expect(setCurrentMotd).not.toHaveBeenCalled();
    });

    test("updates motd on success", async () => {
      mockSetMotdAction.mockResolvedValue(undefined);
      const setCurrentMotd = jest.fn();
      const setLocalSystemMsgs = jest.fn();
      const params = buildParams({ setCurrentMotd, setLocalSystemMsgs });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleMotdCommand("Hello World");

      expect(setCurrentMotd).toHaveBeenCalledWith("Hello World");
      expect(setLocalSystemMsgs).toHaveBeenCalledTimes(1);
      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const added = updater([]);
      expect(added[0].text).toContain("Hello World");
    });

    test("shows error message when setMotd returns error", async () => {
      mockSetMotdAction.mockResolvedValue({ error: "Permission denied" });
      const setCurrentMotd = jest.fn();
      const setLocalSystemMsgs = jest.fn();
      const params = buildParams({ setCurrentMotd, setLocalSystemMsgs });
      const { result } = renderHook(() => useShoutboxCommands(params));

      await result.current.handleMotdCommand("New MOTD");

      expect(setCurrentMotd).not.toHaveBeenCalled();
      expect(setLocalSystemMsgs).toHaveBeenCalledTimes(1);
      const updater = setLocalSystemMsgs.mock.calls[0][0];
      const added = updater([]);
      expect(added[0].text).toBe("Permission denied");
    });
  });
});
