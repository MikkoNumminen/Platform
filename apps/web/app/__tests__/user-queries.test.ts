const mockUserFindMany = jest.fn();
const mockUserFindFirst = jest.fn();
const mockUserPermissionFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
    },
    userPermission: {
      findMany: (...args: unknown[]) => mockUserPermissionFindMany(...args),
    },
  },
}));

import {
  getUsers,
  getUserById,
  getUserPermissionOverrides,
  getUsersWithOverrides,
} from "@/lib/user-queries";

describe("getUsers", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns all non-deleted users ordered by createdAt desc", async () => {
    const users = [
      {
        id: "1",
        email: "a@a.com",
        name: "A",
        alias: null,
        image: null,
        role: "user",
        createdAt: new Date(),
      },
      {
        id: "2",
        email: "b@b.com",
        name: "B",
        alias: null,
        image: null,
        role: "admin",
        createdAt: new Date(),
      },
    ];
    mockUserFindMany.mockResolvedValue(users);

    const result = await getUsers();
    expect(result).toEqual(users);
    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        alias: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });
  });

  test("returns empty array when no users exist", async () => {
    mockUserFindMany.mockResolvedValue([]);
    const result = await getUsers();
    expect(result).toEqual([]);
  });
});

describe("getUserById", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns user by id", async () => {
    const user = {
      id: "1",
      email: "a@a.com",
      name: "A",
      alias: null,
      image: null,
      role: "user",
      createdAt: new Date(),
    };
    mockUserFindFirst.mockResolvedValue(user);

    const result = await getUserById("1");
    expect(result).toEqual(user);
    expect(mockUserFindFirst).toHaveBeenCalledWith({
      where: { id: "1", deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        alias: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });
  });

  test("returns null when user not found", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    const result = await getUserById("nonexistent");
    expect(result).toBeNull();
  });
});

describe("getUserPermissionOverrides", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns mapped permission overrides for user", async () => {
    mockUserPermissionFindMany.mockResolvedValue([
      { permission: { key: "post:create" }, granted: true },
      { permission: { key: "post:delete" }, granted: false },
    ]);

    const result = await getUserPermissionOverrides("user-1");
    expect(result).toEqual([
      { key: "post:create", granted: true },
      { key: "post:delete", granted: false },
    ]);
    expect(mockUserPermissionFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      include: { permission: true },
    });
  });

  test("returns empty array when no overrides exist", async () => {
    mockUserPermissionFindMany.mockResolvedValue([]);
    const result = await getUserPermissionOverrides("user-1");
    expect(result).toEqual([]);
  });
});

describe("getUsersWithOverrides", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns set of userIds that have overrides", async () => {
    mockUserPermissionFindMany.mockResolvedValue([{ userId: "user-1" }, { userId: "user-3" }]);

    const result = await getUsersWithOverrides(["user-1", "user-2", "user-3"]);
    expect(result).toEqual(new Set(["user-1", "user-3"]));
    expect(mockUserPermissionFindMany).toHaveBeenCalledWith({
      where: { userId: { in: ["user-1", "user-2", "user-3"] } },
      select: { userId: true },
      distinct: ["userId"],
    });
  });

  test("returns empty set for empty input array", async () => {
    const result = await getUsersWithOverrides([]);
    expect(result).toEqual(new Set());
    expect(mockUserPermissionFindMany).not.toHaveBeenCalled();
  });

  test("returns empty set when no overrides found", async () => {
    mockUserPermissionFindMany.mockResolvedValue([]);
    const result = await getUsersWithOverrides(["user-1"]);
    expect(result).toEqual(new Set());
  });
});
