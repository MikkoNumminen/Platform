export const dynamic = "force-dynamic";

import { Box } from "@mui/material";
import { redirect } from "next/navigation";
import TopBar from "../components/TopBar";
import { auth } from "@/auth";
import { getAllSurveyRounds } from "@/lib/survey-round-queries";
import FeedbackClient from "./FeedbackClient";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const user = session.user;
  if (user.role === "pending") redirect("/");

  const canManage = user.role === "superuser" || user.role === "vuohi";
  const canViewResults = Boolean((user.permissions as Record<string, boolean>)?.["survey:results"]);

  const rounds = await getAllSurveyRounds();

  return (
    <>
      <TopBar title="Feedback" backHref="/" />
      <Box data-tutorial="feedback-page" sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <FeedbackClient
          rounds={rounds}
          canManage={canManage}
          canViewResults={canViewResults}
          userId={user.id}
        />
      </Box>
    </>
  );
}
