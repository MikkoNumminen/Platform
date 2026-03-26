import { Box } from "@mui/material";
import TopBar from "./components/TopBar";
import SurveyCTA from "./components/SurveyCTA";

export default function Home() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title="Platform" />
      <SurveyCTA />
    </Box>
  );
}
