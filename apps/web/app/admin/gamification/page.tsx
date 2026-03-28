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
import { colors } from "../../styles";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["superuser", "vuohi"];

export default async function GamificationDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect("/");
  }

  const stats = await getGamificationStats();

  return (
    <>
      <TopBar title="Vuohiliitto Dashboard" backHref="/" />
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
              {stats.levelDistribution.map((ld) => {
                const threshold = LEVEL_THRESHOLDS.find((t) => t.level === ld.level);
                const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === ld.level + 1);
                const hasUsers = ld.count > 0;

                return (
                  <Tooltip
                    key={ld.level}
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
                        level={ld.level}
                        title={ld.title}
                        xpRequired={threshold?.xpRequired ?? 0}
                        nextXp={nextThreshold?.xpRequired ?? null}
                        userCount={ld.count}
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
                        {ld.count}
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
                        sx={{ backgroundColor: colors.accentBgSubtle, color: colors.green400 }}
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
                          backgroundColor: colors.surfaceOverlay,
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
  "post:create": "Create a post",
  "thread:create": "Write a comment",
  "topic:create": "Create a topic",
  "event:create": "Create an event",
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
