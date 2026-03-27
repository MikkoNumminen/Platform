import { Box } from "@mui/material";
import TopBar from "./components/TopBar";
import SurveyCTA from "./components/SurveyCTA";
import Shoutbox from "./components/Shoutbox";
import { getRecentShouts } from "@/lib/shout-queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const shouts = session?.user ? await getRecentShouts() : [];

  return (
    <>
      <TopBar title="Platform" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        {session?.user && <Shoutbox initialShouts={shouts} />}
        <SurveyCTA />
      </Box>
    </>
  );
}
