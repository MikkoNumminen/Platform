export const dynamic = "force-dynamic";

import { Box } from "@mui/material";
import TopBar from "../../components/TopBar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAuditLogs, getAuditActionTypes } from "@/lib/audit-queries";
import AuditLogTable from "./AuditLogTable";

export default async function AuditLogPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "superuser") {
    redirect("/");
  }

  const [{ logs, total }, actionTypes] = await Promise.all([
    getAuditLogs({ page: 0, pageSize: 50 }),
    getAuditActionTypes(),
  ]);

  const serializedLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    details: log.details as Record<string, unknown> | null,
  }));

  return (
    <>
      <TopBar title="Audit Log" backHref="/" />
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        <AuditLogTable logs={serializedLogs} total={total} actionTypes={actionTypes} />
      </Box>
    </>
  );
}
