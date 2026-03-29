import React from "react";
import { render, screen } from "@testing-library/react";
import DevLog from "@/app/components/DevLog";
import type { CommitEntry } from "@/lib/github-commits";

const now = Date.now();

const sampleCommits: CommitEntry[] = [
  {
    sha: "abc1234",
    message: "feat(web): add dark mode toggle",
    date: new Date(now - 30 * 60 * 1000).toISOString(), // 30m ago
    status: "success",
  },
  {
    sha: "def5678",
    message: "fix(web): broken calendar layout",
    date: new Date(now - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
    status: "failure",
  },
  {
    sha: "ghi9012",
    message: "chore: update dependencies",
    date: new Date(now - 2 * 60 * 1000).toISOString(), // 2m ago
    status: "pending",
  },
  {
    sha: "jkl3456",
    message: "docs: update README",
    date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2d ago
    status: null,
  },
];

describe("DevLog", () => {
  test("renders title", () => {
    render(<DevLog commits={[]} />);
    expect(screen.getByText("Dev Log")).toBeInTheDocument();
  });

  test("renders empty state when no commits", () => {
    render(<DevLog commits={[]} />);
    expect(screen.getByText("No commits loaded.")).toBeInTheDocument();
  });

  test("renders commit messages", () => {
    render(<DevLog commits={sampleCommits} />);
    expect(screen.getByText("feat(web): add dark mode toggle")).toBeInTheDocument();
    expect(screen.getByText("fix(web): broken calendar layout")).toBeInTheDocument();
    expect(screen.getByText("chore: update dependencies")).toBeInTheDocument();
    expect(screen.getByText("docs: update README")).toBeInTheDocument();
  });

  test("does not show empty state when commits exist", () => {
    render(<DevLog commits={sampleCommits} />);
    expect(screen.queryByText("No commits loaded.")).not.toBeInTheDocument();
  });

  test("renders relative timestamps", () => {
    render(<DevLog commits={sampleCommits} />);
    expect(screen.getByText("30m ago")).toBeInTheDocument();
    expect(screen.getByText("3h ago")).toBeInTheDocument();
    expect(screen.getByText("2m ago")).toBeInTheDocument();
    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  test("renders status dots for each commit", () => {
    render(<DevLog commits={sampleCommits} />);
    // ● for success and failure, ○ for pending and null
    const dots = screen.getAllByText(/[●○]/);
    expect(dots).toHaveLength(4);
  });

  test("renders filled dot for success status", () => {
    render(<DevLog commits={[sampleCommits[0]]} />);
    expect(screen.getByText("●")).toBeInTheDocument();
  });

  test("renders filled dot for failure status", () => {
    render(<DevLog commits={[sampleCommits[1]]} />);
    expect(screen.getByText("●")).toBeInTheDocument();
  });

  test("renders hollow dot for pending status", () => {
    render(<DevLog commits={[sampleCommits[2]]} />);
    expect(screen.getByText("○")).toBeInTheDocument();
  });

  test("renders hollow dot for null status", () => {
    render(<DevLog commits={[sampleCommits[3]]} />);
    expect(screen.getByText("○")).toBeInTheDocument();
  });

  test("shows 'now' for very recent commits", () => {
    const recentCommit: CommitEntry = {
      sha: "recent1",
      message: "just pushed",
      date: new Date(now - 10 * 1000).toISOString(), // 10 seconds ago
      status: "success",
    };
    render(<DevLog commits={[recentCommit]} />);
    expect(screen.getByText("now")).toBeInTheDocument();
  });

  test("renders single commit correctly", () => {
    render(<DevLog commits={[sampleCommits[0]]} />);
    expect(screen.getByText("feat(web): add dark mode toggle")).toBeInTheDocument();
    expect(screen.getByText("30m ago")).toBeInTheDocument();
    expect(screen.getByText("●")).toBeInTheDocument();
  });
});
