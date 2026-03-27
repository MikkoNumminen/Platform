import { Box } from "@mui/material";
import TopBar from "../components/TopBar";
import SurveyForm from "../components/survey/SurveyForm";

export default function SurveyPage() {
  return (
    <>
      <TopBar title="Community Survey" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <SurveyForm />
      </Box>
    </>
  );
}
