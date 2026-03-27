import { Box } from "@mui/material";
import { redirect } from "next/navigation";
import TopBar from "../components/TopBar";
import SurveyForm from "../components/survey/SurveyForm";
import { auth } from "@/auth";

export default async function SurveyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <>
      <TopBar title="Community Survey" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <SurveyForm />
      </Box>
    </>
  );
}
