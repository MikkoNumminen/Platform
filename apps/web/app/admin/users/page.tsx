export const dynamic = "force-dynamic";

import {
  Avatar,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import TopBar from "../../components/TopBar";
import { getUsers } from "@/lib/user-queries";
import { getUserSurveyStatus } from "@/lib/survey-user-queries";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { colors } from "../../styles";
import UserRoleSelect from "./UserRoleSelect";

export default async function AdminUsersPage() {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};

  if (!permissions["admin:users"]) {
    redirect("/");
  }

  const users = await getUsers();
  const pendingUserIds = users.filter((u) => u.role === "pending").map((u) => u.id);
  const surveyStatus = await getUserSurveyStatus(pendingUserIds);

  return (
    <>
      <TopBar title="Manage Users" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: colors.slate400, borderColor: colors.slate300 }}>
                  User
                </TableCell>
                <TableCell sx={{ color: colors.slate400, borderColor: colors.slate300 }}>
                  Email
                </TableCell>
                <TableCell sx={{ color: colors.slate400, borderColor: colors.slate300 }}>
                  Role
                </TableCell>
                <TableCell sx={{ color: colors.slate400, borderColor: colors.slate300 }}>
                  Joined
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell sx={{ borderColor: colors.slate300 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={user.image ?? undefined}
                        alt={user.alias ?? user.name ?? "User"}
                        sx={{ width: 32, height: 32, fontSize: "0.8rem" }}
                      >
                        {(user.alias ?? user.name)?.[0]?.toUpperCase() ?? "?"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: colors.slate100 }}>
                          {user.alias ?? user.name ?? "—"}
                        </Typography>
                        {user.alias && user.name && (
                          <Typography variant="caption" sx={{ color: colors.slate400 }}>
                            {user.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: colors.slate300 }}>
                    <Typography variant="body2" sx={{ color: colors.slate400 }}>
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: colors.slate300 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <UserRoleSelect
                        userId={user.id}
                        currentRole={user.role}
                        isSelf={user.id === session?.user?.id}
                      />
                      {user.role === "pending" && (
                        <>
                          <Chip
                            label="Needs approval"
                            size="small"
                            sx={{
                              backgroundColor: colors.warning,
                              color: colors.slate700,
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                          <Chip
                            label={surveyStatus[user.id] ? "Survey done" : "Survey pending"}
                            size="small"
                            sx={{
                              backgroundColor: surveyStatus[user.id]
                                ? colors.green400
                                : colors.slate300,
                              color: colors.slate700,
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: colors.slate300 }}>
                    <Typography variant="body2" sx={{ color: colors.slate400 }}>
                      {user.createdAt.toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {users.length === 0 && (
          <Typography sx={{ color: colors.slate400, textAlign: "center", mt: 4 }}>
            No users found.
          </Typography>
        )}
      </Box>
    </>
  );
}
