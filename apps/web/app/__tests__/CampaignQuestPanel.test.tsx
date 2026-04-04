/* eslint-disable testing-library/no-node-access, testing-library/no-container */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseSession = jest.fn();
const mockGetActiveCampaign = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock("@/lib/campaign-queries", () => ({
  getActiveCampaign: (...args: unknown[]) => mockGetActiveCampaign(...args),
}));

jest.mock("@/app/components/survey/CustomSurveyForm", () => {
  return function MockCustomSurveyForm({ onComplete }: { onComplete: () => void }) {
    return (
      <div data-testid="custom-survey-form">
        <button onClick={onComplete}>Submit Survey</button>
      </div>
    );
  };
});

import CampaignQuestPanel from "@/app/components/CampaignQuestPanel";

const mockCampaign = {
  roundId: "round-1",
  roundTitle: "DM Testing Campaign",
  roundDescription: "Test the messaging system",
  deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  customQuestions: [{ id: "q1", text: "How was it?", type: "single", options: ["Good", "Bad"] }],
  quests: [
    { id: "q1", title: "Send a private message", status: "completed", xpReward: 15 },
    { id: "q2", title: "Start a new conversation", status: "open", xpReward: 15 },
    { id: "q3", title: "Complete Survey: DM Testing", status: "open", xpReward: 15 },
  ],
};

describe("CampaignQuestPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", alias: "TestUser" } },
      status: "authenticated",
    });
    mockGetActiveCampaign.mockResolvedValue(mockCampaign);
  });

  test("renders nothing while loading", () => {
    mockGetActiveCampaign.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<CampaignQuestPanel />);
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing when no campaign exists", async () => {
    mockGetActiveCampaign.mockResolvedValue(null);
    const { container } = render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test("renders nothing for demo users", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", alias: "Demo", demoSessionId: "demo-123" } },
      status: "authenticated",
    });
    mockGetActiveCampaign.mockResolvedValue(mockCampaign);
    const { container } = render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test("renders campaign title and progress when loaded", async () => {
    render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(screen.getByText("DM Testing Campaign")).toBeInTheDocument();
    });
    expect(screen.getByText(/1 of 3 complete/)).toBeInTheDocument();
  });

  test("shows XP chip with total reward", async () => {
    render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(screen.getByText("45 XP")).toBeInTheDocument();
    });
  });

  test("shows deadline with days remaining", async () => {
    render(<CampaignQuestPanel />);
    await waitFor(() => {
      // Should show "3 days left" or "2 days left" depending on timing
      expect(screen.getByText(/\d+ days left/)).toBeInTheDocument();
    });
  });

  test("expanding panel shows quest list", async () => {
    render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(screen.getByText("DM Testing Campaign")).toBeInTheDocument();
    });

    // Click to expand
    fireEvent.click(screen.getByText("DM Testing Campaign"));

    expect(screen.getByText("Send a private message")).toBeInTheDocument();
    expect(screen.getByText("Start a new conversation")).toBeInTheDocument();
    expect(screen.getByText("Complete the feedback survey")).toBeInTheDocument();
  });

  test("shows description when expanded", async () => {
    render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(screen.getByText("DM Testing Campaign")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DM Testing Campaign"));

    expect(screen.getByText("Test the messaging system")).toBeInTheDocument();
  });

  test("completed quest has line-through styling", async () => {
    render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(screen.getByText("DM Testing Campaign")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DM Testing Campaign"));

    const completedText = screen.getByText("Send a private message");
    expect(completedText).toHaveStyle({ textDecoration: "line-through" });
  });

  test("clicking survey quest opens survey dialog", async () => {
    render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(screen.getByText("DM Testing Campaign")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DM Testing Campaign"));
    fireEvent.click(screen.getByText("Complete the feedback survey"));

    expect(screen.getByTestId("custom-survey-form")).toBeInTheDocument();
  });

  test("returns null when all quests are complete", async () => {
    const allComplete = {
      ...mockCampaign,
      quests: mockCampaign.quests.map((q) => ({ ...q, status: "completed" })),
    };
    mockGetActiveCampaign.mockResolvedValue(allComplete);

    const { container } = render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(container.querySelector("[class*='MuiPaper']")).toBeNull();
    });
  });

  test("renders nothing when not authenticated", async () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    mockGetActiveCampaign.mockResolvedValue(null);
    const { container } = render(<CampaignQuestPanel />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
