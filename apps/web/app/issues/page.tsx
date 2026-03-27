export const dynamic = "force-dynamic";

import { Box, Typography } from "@mui/material";
import { redirect } from "next/navigation";
import TopBar from "../components/TopBar";
import { auth } from "@/auth";
import { getIssueReports } from "@/lib/issue-queries";
import IssueList from "./IssueList";

export default async function IssuesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = session.user.role;
  if (role === "pending") {
    redirect("/");
  }

  const isSuperuser = role === "superuser";
  const issues = await getIssueReports();
  const open = issues.filter((i) => !i.resolved);
  const resolved = issues.filter((i) => i.resolved);

  return (
    <>
      <TopBar title="Issue Reports" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        {issues.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
            No issues reported yet.
          </Typography>
        ) : (
          <IssueList open={open} resolved={resolved} canResolve={isSuperuser} />
        )}
      </Box>
    </>
  );
}
