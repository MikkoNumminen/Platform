import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Link from "next/link";
import TopBar from "../../components/TopBar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGamificationStats } from "@/lib/gamification/admin-queries";
import { LEVEL_THRESHOLDS, XP_AMOUNTS } from "@/lib/gamification/xp-config";
import {
  colors,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "../../styles";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["superuser", "vuohi"];

export default async function GamificationDashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect("/");
  }

  const stats = await getGamificationStats();
  const isDemoUser = Boolean(session?.user?.demoSessionId);
  const dashboardTitle = isDemoUser ? "Platform Dashboard" : "Vuohiliitto Dashboard";

  return (
    <>
      <TopBar title={dashboardTitle} backHref="/" />
      <Box
        data-tutorial="gamification-dashboard"
        sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}
      >
        {/* Manage Link */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            component={Link}
            href="/admin/dashboard/manage"
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
              {stats.levelDistribution.map((levelEntry) => {
                const threshold = LEVEL_THRESHOLDS.find((t) => t.level === levelEntry.level);
                const nextThreshold = LEVEL_THRESHOLDS.find(
                  (t) => t.level === levelEntry.level + 1,
                );
                const hasUsers = levelEntry.count > 0;

                return (
                  <Tooltip
                    key={levelEntry.level}
                    arrow
                    placement="top"
                    slotProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 360,
                          backgroundColor: colors.backdrop,
                          border: `1px solid ${colors.accentBorder}`,
                          p: 1.5,
                        },
                      },
                    }}
                    title={
                      <LevelTooltip
                        level={levelEntry.level}
                        title={levelEntry.title}
                        xpRequired={threshold?.xpRequired ?? 0}
                        nextXp={nextThreshold?.xpRequired ?? null}
                        userCount={levelEntry.count}
                      />
                    }
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        cursor: "pointer",
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        transition: "background-color 0.15s",
                        "&:hover": { backgroundColor: colors.hoverOverlay },
                      }}
                    >
                      {hasUsers ? (
                        <CheckCircleIcon
                          sx={{ fontSize: 18, color: colors.green400, flexShrink: 0 }}
                        />
                      ) : (
                        <RadioButtonUncheckedIcon
                          sx={{ fontSize: 18, color: colors.slate400, flexShrink: 0 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ minWidth: 140, color: colors.slate300 }}>
                        Lvl {levelEntry.level} — {levelEntry.title}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            stats.summary.totalUsersWithXp > 0
                              ? (levelEntry.count / stats.summary.totalUsersWithXp) * 100
                              : 0
                          }
                          sx={{
                            height: 20,
                            borderRadius: 2,
                            backgroundColor: colors.surfaceOverlay,
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 2,
                              background: hasUsers
                                ? colors.progressGradient
                                : colors.surfaceOverlay,
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ minWidth: 30, textAlign: "right", fontWeight: 600 }}
                      >
                        {levelEntry.count}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
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
                  {stats.topAchievements.map((topAchievement) => (
                    <Tooltip
                      key={topAchievement.achievement.id}
                      arrow
                      placement="left"
                      slotProps={{
                        tooltip: {
                          sx: {
                            maxWidth: 300,
                            backgroundColor: colors.backdrop,
                            border: `1px solid ${colors.accentBorder}`,
                            p: 1.5,
                          },
                        },
                      }}
                      title={
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: colors.green400 }}
                          >
                            {topAchievement.achievement.icon} {topAchievement.achievement.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.slate300, display: "block", mt: 0.5 }}
                          >
                            {topAchievement.achievement.description}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.slate400, display: "block", mt: 0.5 }}
                          >
                            Reward: <strong>{topAchievement.achievement.xpReward} XP</strong>
                            {topAchievement.achievement.tier &&
                              ` · ${topAchievement.achievement.tier} tier`}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.slate400, display: "block" }}
                          >
                            Unlocked by {topAchievement.count} user
                            {topAchievement.count !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                      }
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          cursor: "pointer",
                          borderRadius: 1,
                          px: 0.5,
                          py: 0.25,
                          transition: "background-color 0.15s",
                          "&:hover": { backgroundColor: colors.hoverOverlay },
                        }}
                      >
                        <Typography sx={{ fontSize: "1.2rem" }}>
                          {topAchievement.achievement.icon}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {topAchievement.achievement.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.slate400 }}>
                            {topAchievement.achievement.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${topAchievement.count} users`}
                          size="small"
                          sx={{ backgroundColor: colors.accentBgSubtle, color: colors.green400 }}
                        />
                      </Box>
                    </Tooltip>
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
                {stats.questCompletionRates.map((questRate) => (
                  <Tooltip
                    key={questRate.name}
                    arrow
                    placement="left"
                    slotProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 300,
                          backgroundColor: colors.backdrop,
                          border: `1px solid ${colors.accentBorder}`,
                          p: 1.5,
                        },
                      },
                    }}
                    title={
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: colors.green400 }}
                        >
                          {questRate.icon} {questRate.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.slate300, display: "block", mt: 0.5 }}
                        >
                          {questRate.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.slate400, display: "block", mt: 0.5 }}
                        >
                          Reward: <strong>{questRate.xpReward} XP</strong> · {questRate.type} quest
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.slate400, display: "block" }}
                        >
                          {questRate.completedCount} of {questRate.totalUsers} users completed (
                          {questRate.completionRate}%)
                        </Typography>
                      </Box>
                    }
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        borderRadius: 1,
                        px: 0.5,
                        py: 0.25,
                        transition: "background-color 0.15s",
                        "&:hover": { backgroundColor: colors.hoverOverlay },
                      }}
                    >
                      <Typography sx={{ fontSize: "1rem" }}>{questRate.icon}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" noWrap>
                            {questRate.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.slate400 }}>
                            {questRate.completionRate}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={questRate.completionRate}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.surfaceOverlay,
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 2,
                              backgroundColor: colors.green400,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Custom Quests */}
        {stats.customQuestStats.total > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assigned Quests
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Chip
                  label={`${stats.customQuestStats.completed} completed`}
                  size="small"
                  sx={{
                    backgroundColor: STATUS_COLORS.completed + "22",
                    color: STATUS_COLORS.completed,
                  }}
                />
                <Chip
                  label={`${stats.customQuestStats.inProgress} in progress`}
                  size="small"
                  sx={{
                    backgroundColor: STATUS_COLORS.in_progress + "22",
                    color: STATUS_COLORS.in_progress,
                  }}
                />
                <Chip
                  label={`${stats.customQuestStats.open} open`}
                  size="small"
                  sx={{ backgroundColor: STATUS_COLORS.open + "22", color: STATUS_COLORS.open }}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {stats.customQuestStats.quests.map((q) => (
                  <Box
                    key={q.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 0.5,
                      px: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <Chip
                      label={STATUS_LABELS[q.status] ?? q.status}
                      size="small"
                      sx={{
                        backgroundColor: (STATUS_COLORS[q.status] ?? colors.slate400) + "22",
                        color: STATUS_COLORS[q.status] ?? colors.slate400,
                        fontWeight: 600,
                        minWidth: 90,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                        {q.title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: colors.slate400 }}>
                      {q.assignee}
                    </Typography>
                    {q.priority && (
                      <Chip
                        label={PRIORITY_LABELS[q.priority] ?? q.priority}
                        size="small"
                        sx={{
                          backgroundColor: (PRIORITY_COLORS[q.priority] ?? colors.slate400) + "22",
                          color: PRIORITY_COLORS[q.priority] ?? colors.slate400,
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                    <Chip
                      label={`${q.xpReward} XP`}
                      size="small"
                      sx={{ backgroundColor: colors.accentBgSubtle, color: colors.green400 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

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
                      backgroundColor: colors.accentBgSubtle,
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

const XP_ACTION_LABELS: Record<string, string> = {
  "shout:create": "Send a shout",
  "issue:create": "Report an issue",
  "alias:set": "Set your alias",
  "survey:complete": "Complete the survey",
  "daily:login": "Daily login",
  "streak:7day": "7-day login streak",
  "streak:30day": "30-day login streak",
};

function LevelTooltip({
  level,
  title,
  xpRequired,
  nextXp,
  userCount,
}: {
  level: number;
  title: string;
  xpRequired: number;
  nextXp: number | null;
  userCount: number;
}) {
  const xpRange = nextXp
    ? `${xpRequired.toLocaleString()} – ${(nextXp - 1).toLocaleString()} XP`
    : `${xpRequired.toLocaleString()}+ XP`;

  // Calculate example actions to reach this level from zero
  const exampleActions = Object.entries(XP_AMOUNTS)
    .filter(([, xp]) => xp > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([action, xp]) => ({
      label: XP_ACTION_LABELS[action] ?? action,
      xp,
      count: Math.ceil(xpRequired / xp),
    }));

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.green400, mb: 0.5 }}>
        Lvl {level} — {title}
      </Typography>
      <Typography variant="caption" sx={{ color: colors.slate300, display: "block", mb: 1 }}>
        Requires {xpRange}
        {userCount > 0
          ? ` · ${userCount} user${userCount !== 1 ? "s" : ""} at this level`
          : " · No users yet"}
      </Typography>

      {xpRequired > 0 && (
        <>
          <Typography
            variant="caption"
            sx={{ color: colors.slate400, display: "block", mb: 0.5, fontWeight: 600 }}
          >
            How to earn XP:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {exampleActions.slice(0, 6).map((action) => (
              <Box component="li" key={action.label} sx={{ listStyle: "disc" }}>
                <Typography variant="caption" sx={{ color: colors.slate300 }}>
                  {action.label} — <strong>{action.xp} XP</strong>
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {xpRequired === 0 && (
        <Typography variant="caption" sx={{ color: colors.slate400, fontStyle: "italic" }}>
          Starting level — everyone begins here
        </Typography>
      )}
    </Box>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.green400 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.slate400 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
