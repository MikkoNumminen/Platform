import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Typography,
} from "@mui/material";
import Link from "next/link";
import TopBar from "../../components/TopBar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGamificationStats } from "@/lib/gamification/admin-queries";
import { colors } from "../../styles";

export const dynamic = "force-dynamic";

export default async function GamificationDashboardPage() {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};
  if (!permissions["admin:users"]) {
    redirect("/");
  }

  const stats = await getGamificationStats();

  return (
    <>
      <TopBar title="Gamification Dashboard" backHref="/" />
      <Box
        data-tutorial="gamification-dashboard"
        sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}
      >
        {/* Manage Link */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            component={Link}
            href="/admin/gamification/manage"
            variant="outlined"
            sx={{ color: colors.green400, borderColor: colors.green400 }}
          >
            Manage Achievements & Quests
          </Button>
        </Box>

        {/* Summary Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard label="Active Players" value={stats.summary.totalUsersWithXp} />
          <StatCard
            label="Total XP Awarded"
            value={stats.summary.totalXpAwarded.toLocaleString()}
          />
          <StatCard label="Average XP" value={stats.summary.averageXp.toLocaleString()} />
          <StatCard label="Highest XP" value={stats.summary.highestXp.toLocaleString()} />
        </Box>

        {/* Level Distribution */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Level Distribution
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {stats.levelDistribution.map((ld) => (
                <Box key={ld.level} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 140, color: colors.slate300 }}>
                    Lvl {ld.level} — {ld.title}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        stats.summary.totalUsersWithXp > 0
                          ? (ld.count / stats.summary.totalUsersWithXp) * 100
                          : 0
                      }
                      sx={{
                        height: 20,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 2,
                          background: "linear-gradient(90deg, #4ade80, #22d3ee)",
                        },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ minWidth: 30, textAlign: "right", fontWeight: 600 }}
                  >
                    {ld.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Top Achievements */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Unlocked Achievements
              </Typography>
              {stats.topAchievements.length === 0 ? (
                <Typography variant="body2" sx={{ color: colors.slate400 }}>
                  No achievements unlocked yet.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {stats.topAchievements.map((ta) => (
                    <Box
                      key={ta.achievement.id}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Typography sx={{ fontSize: "1.2rem" }}>{ta.achievement.icon}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ta.achievement.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.slate400 }}>
                          {ta.achievement.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${ta.count} users`}
                        size="small"
                        sx={{ backgroundColor: "rgba(74,222,128,0.15)", color: colors.green400 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quest Completion */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quest Completion Rates
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {stats.questCompletionRates.map((qc) => (
                  <Box key={qc.name} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "1rem" }}>{qc.icon}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" noWrap>
                          {qc.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.slate400 }}>
                          {qc.completionRate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={qc.completionRate}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "rgba(255,255,255,0.05)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 2,
                            backgroundColor: colors.green400,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Recent Activity */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent XP Activity
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {stats.recentActivity.map((activity, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.5 }}>
                  <Chip
                    label={`+${activity.amount}`}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(74,222,128,0.15)",
                      color: colors.green400,
                      fontWeight: 600,
                      minWidth: 50,
                    }}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    <strong>{activity.user}</strong> — {activity.source}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.slate400 }}>
                    {new Date(activity.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              ))}
              {stats.recentActivity.length === 0 && (
                <Typography variant="body2" sx={{ color: colors.slate400 }}>
                  No activity yet.
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#4ade80" }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
