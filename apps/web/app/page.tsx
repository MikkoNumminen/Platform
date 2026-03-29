import { Box } from "@mui/material";
import TopBar from "./components/TopBar";
import SurveyCTA from "./components/SurveyCTA";
import Shoutbox from "./components/Shoutbox";
import DevLog from "./components/DevLog";
import WelcomeHero from "./components/WelcomeHero";
import QuestReceivedCelebration from "./components/QuestReceivedCelebration";
import DemoWelcomeOverlay from "./components/DemoWelcomeOverlay";
import { getRecentShouts } from "@/lib/shout-queries";
import { getRecentCommits } from "@/lib/github-commits";
import { getMyCustomQuests } from "@/lib/custom-quest-queries";
import { getUserSurveyStatus } from "@/lib/survey-user-queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;
  const [shouts, commits] = await Promise.all([
    userId ? getRecentShouts() : Promise.resolve([]),
    getRecentCommits(),
  ]);

  let surveyCompleted = false;
  if (userId) {
    const status = await getUserSurveyStatus([userId]);
    surveyCompleted = status[userId] ?? false;
  }

  let customQuests: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    priority: string;
    creator: string;
  }[] = [];
  if (userId) {
    try {
      const quests = await getMyCustomQuests();
      customQuests = quests
        .filter((q) => q.status !== "completed")
        .map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          xpReward: q.xpReward,
          priority: q.priority,
          creator: q.creator.alias ?? q.creator.name ?? "Unknown",
        }));
    } catch {
      // CustomQuest table may not exist yet
    }
  }

  return (
    <>
      <DemoWelcomeOverlay />
      {customQuests.length > 0 && <QuestReceivedCelebration quests={customQuests} />}
      <TopBar title="Platform" />
      {session?.user ? (
        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
          <Shoutbox initialShouts={shouts} />
          <Box sx={{ mt: 2 }}>
            <DevLog commits={commits} />
          </Box>
          {!surveyCompleted && <SurveyCTA />}
        </Box>
      ) : (
        <>
          <WelcomeHero />
          <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 }, mt: 2 }}>
            <DevLog commits={commits} />
          </Box>
        </>
      )}
    </>
  );
}
