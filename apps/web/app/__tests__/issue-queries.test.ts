const mockFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    issueReport: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { getIssueReports } from "@/lib/issue-queries";

describe("getIssueReports", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns issues with alias and resolved status", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "i1",
        title: "Bug",
        description: "Broken",
        url: "/boards",
        resolvedAt: null,
        createdAt: new Date("2026-03-27T10:00:00Z"),
        author: { alias: "Alice", name: "Alice Real" },
      },
      {
        id: "i2",
        title: "Fixed bug",
        description: "Was broken",
        url: null,
        resolvedAt: new Date("2026-03-27T11:00:00Z"),
        createdAt: new Date("2026-03-26T10:00:00Z"),
        author: { alias: null, name: "Bob Real" },
      },
    ]);

    const issues = await getIssueReports();
    expect(issues).toHaveLength(2);
    expect(issues[0].authorAlias).toBe("Alice");
    expect(issues[0].resolved).toBe(false);
    expect(issues[1].authorAlias).toBe("Bob Real");
    expect(issues[1].resolved).toBe(true);
  });

  test("returns empty array when no issues", async () => {
    mockFindMany.mockResolvedValue([]);
    const issues = await getIssueReports();
    expect(issues).toEqual([]);
  });
});
