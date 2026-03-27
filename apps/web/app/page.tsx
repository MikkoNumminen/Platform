import { Box } from "@mui/material";
import TopBar from "./components/TopBar";
import SurveyCTA from "./components/SurveyCTA";
import Shoutbox from "./components/Shoutbox";
import WelcomeHero from "./components/WelcomeHero";
import { getRecentShouts } from "@/lib/shout-queries";
import { getUserSurveyStatus } from "@/lib/survey-user-queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;
  const shouts = userId ? await getRecentShouts() : [];

  let surveyCompleted = false;
  if (userId) {
    const status = await getUserSurveyStatus([userId]);
    surveyCompleted = status[userId] ?? false;
  }

  return (
    <>
      <TopBar title="Platform" />
      {session?.user ? (
        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
          <Shoutbox initialShouts={shouts} />
          {!surveyCompleted && <SurveyCTA />}
        </Box>
      ) : (
        <WelcomeHero />
      )}
    </>
  );
}
