export const dynamic = "force-dynamic";

import { Box, Typography, Button } from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";
import { redirect } from "next/navigation";
import Link from "next/link";
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
      <TopBar title="Issues" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            component={Link}
            href="/report-issue"
            variant="contained"
            size="small"
            startIcon={<BugReportIcon />}
          >
            Report Issue
          </Button>
        </Box>
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
