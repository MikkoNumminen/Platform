const REPO = "MikkoNumminen/Platform";
const COMMIT_COUNT = 10;
const CACHE_TTL = 600; // 10 minutes

export interface CommitEntry {
  sha: string;
  message: string;
  date: string;
  status: "success" | "failure" | "pending" | null;
}

export async function getRecentCommits(): Promise<CommitEntry[]> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(
      `https://api.github.com/repos/${REPO}/commits?per_page=${COMMIT_COUNT}`,
      { headers, next: { revalidate: CACHE_TTL } },
    );

    if (!res.ok) return [];

    const commits = await res.json();

    const entries: CommitEntry[] = await Promise.all(
      commits.map(
        async (c: { sha: string; commit: { message: string; committer: { date: string } } }) => {
          let status: CommitEntry["status"] = null;
          try {
            const statusRes = await fetch(
              `https://api.github.com/repos/${REPO}/commits/${c.sha}/status`,
              { headers, next: { revalidate: CACHE_TTL } },
            );
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.state === "success") status = "success";
              else if (statusData.state === "failure" || statusData.state === "error")
                status = "failure";
              else if (statusData.state === "pending") status = "pending";
            }
          } catch {
            // Status fetch failed — leave as null
          }

          return {
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            date: c.commit.committer.date,
            status,
          };
        },
      ),
    );

    return entries;
  } catch {
    return [];
  }
}
