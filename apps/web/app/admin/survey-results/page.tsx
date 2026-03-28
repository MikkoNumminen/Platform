import { Box, Typography, Divider } from "@mui/material";
import TopBar from "../../components/TopBar";
import ResultsBarChart from "../../components/survey/ResultsBarChart";
import TextResponseList from "../../components/survey/TextResponseList";
import { getSurveyResults } from "@/lib/survey-queries";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SurveyResultsPage() {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};
  if (!permissions["survey:results"]) {
    redirect("/");
  }

  const results = await getSurveyResults();

  return (
    <>
      <TopBar title="Survey Results" backHref="/" />
      <Box data-tutorial="survey-results" sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <Typography variant="h5" gutterBottom>
          Total responses: {results.totalResponses}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <ResultsBarChart
          title="Conversation Style Preference"
          items={results.conversationStyleCounts}
        />

        <ResultsBarChart title="Feature Popularity" items={results.featureCounts} />

        <Divider sx={{ my: 3 }} />

        <TextResponseList title="#1 Must-Have Feature" responses={results.mustHaveResponses} />

        <TextResponseList title="#1 Dealbreaker" responses={results.dealbreakerResponses} />

        <TextResponseList title="Other Feedback" responses={results.otherFeedbackResponses} />
      </Box>
    </>
  );
}
