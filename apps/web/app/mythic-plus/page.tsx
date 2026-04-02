export const dynamic = "force-dynamic";

import { Box } from "@mui/material";
import TopBar from "../components/TopBar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTeamCharacters } from "@/lib/mythicplus-queries";
import MythicPlusClient from "./MythicPlusClient";

export default async function MythicPlusPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const role = (session.user as { role?: string })?.role;
  if (role === "pending") redirect("/");

  const characters = await getTeamCharacters();

  return (
    <>
      <TopBar title="Mythic+ Team" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <MythicPlusClient characters={characters} />
      </Box>
    </>
  );
}
