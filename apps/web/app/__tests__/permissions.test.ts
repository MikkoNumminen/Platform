import { resolvePermissions, ROLES, PERMISSIONS } from "@/lib/permissions";

describe("permissions", () => {
  test("ROLES contains superuser, admin, user, pending", () => {
    expect(ROLES).toEqual(["superuser", "admin", "user", "pending"]);
  });

  test("PERMISSIONS has expected keys", () => {
    expect(PERMISSIONS).toHaveProperty("admin:users");
    expect(PERMISSIONS).toHaveProperty("post:create");
    expect(PERMISSIONS).toHaveProperty("survey:results");
  });

  describe("resolvePermissions", () => {
    test("superuser gets all permissions", () => {
      const perms = resolvePermissions("superuser");
      const allTrue = Object.values(perms).every((v) => v === true);
      expect(allTrue).toBe(true);
      expect(Object.keys(perms).length).toBe(Object.keys(PERMISSIONS).length);
    });

    test("user gets limited permissions", () => {
      const perms = resolvePermissions("user");
      expect(perms["post:create"]).toBe(true);
      expect(perms["thread:create"]).toBe(true);
      expect(perms["admin:users"]).toBe(false);
      expect(perms["board:delete"]).toBe(false);
    });

    test("admin gets most permissions but not admin:users", () => {
      const perms = resolvePermissions("admin");
      expect(perms["board:create"]).toBe(true);
      expect(perms["survey:results"]).toBe(true);
      expect(perms["admin:users"]).toBe(false);
    });

    test("pending role gets zero permissions", () => {
      const perms = resolvePermissions("pending");
      const allFalse = Object.values(perms).every((v) => v === false);
      expect(allFalse).toBe(true);
    });

    test("unknown role defaults to pending permissions (zero)", () => {
      const perms = resolvePermissions("unknown");
      const pendingPerms = resolvePermissions("pending");
      expect(perms).toEqual(pendingPerms);
    });

    test("overrides can grant additional permissions", () => {
      const perms = resolvePermissions("user", [{ key: "admin:users", granted: true }]);
      expect(perms["admin:users"]).toBe(true);
    });

    test("overrides can revoke default permissions", () => {
      const perms = resolvePermissions("admin", [{ key: "board:create", granted: false }]);
      expect(perms["board:create"]).toBe(false);
    });

    test("overrides with unknown keys are ignored", () => {
      const perms = resolvePermissions("user", [{ key: "fake:perm", granted: true }]);
      expect(perms).not.toHaveProperty("fake:perm");
    });
  });
});
