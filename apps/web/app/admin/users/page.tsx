export const dynamic = "force-dynamic";

import React from "react";
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
import { getUsers, getUsersWithOverrides } from "@/lib/user-queries";
import { getUserSurveyStatus } from "@/lib/survey-user-queries";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { colors } from "../../styles";
import UserRoleSelect from "./UserRoleSelect";
import ApproveButton from "./ApproveButton";
import UserPermissionEditor from "./UserPermissionEditor";

export default async function AdminUsersPage() {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};

  if (!permissions["admin:users"]) {
    redirect("/");
  }

  const users = await getUsers();
  const allUserIds = users.map((u) => u.id);
  const surveyStatus = await getUserSurveyStatus(allUserIds);
  const usersWithOverrides = await getUsersWithOverrides(allUserIds);

  return (
    <>
      <TopBar title="Manage Users" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <TableContainer data-tutorial="users-table">
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
                <React.Fragment key={user.id}>
                  <TableRow>
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
                          actorRole={(session?.user as { role?: string })?.role ?? "pending"}
                        />
                        {user.role === "pending" && <ApproveButton userId={user.id} />}
                        {!surveyStatus[user.id] && (
                          <Chip
                            label="Survey pending"
                            size="small"
                            sx={{
                              backgroundColor: colors.slate300,
                              color: colors.slate700,
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderColor: colors.slate300 }}>
                      <Typography variant="body2" sx={{ color: colors.slate400 }}>
                        {user.createdAt.toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ borderColor: colors.slate300, py: 0, px: 2 }}>
                      <UserPermissionEditor
                        userId={user.id}
                        userRole={user.role}
                        isSelf={user.id === session?.user?.id}
                        initialHasOverrides={usersWithOverrides.has(user.id)}
                      />
                    </TableCell>
                  </TableRow>
                </React.Fragment>
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
