import { Box } from "@mui/material";
import TopBar from "./components/TopBar";
import SurveyCTA from "./components/SurveyCTA";
import Shoutbox from "./components/Shoutbox";
import { getRecentShouts } from "@/lib/shout-queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const shouts = await getRecentShouts();

  return (
    <>
      <TopBar title="Platform" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <Shoutbox initialShouts={shouts} />
        <SurveyCTA />
      </Box>
    </>
  );
}
