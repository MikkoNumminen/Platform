import { NextResponse } from "next/server";
import { resetDailyQuests, resetWeeklyQuests } from "@/lib/gamification";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const isMonday = now.getUTCDay() === 1;

    const dailyReset = await resetDailyQuests();
    let weeklyReset = 0;

    if (isMonday) {
      weeklyReset = await resetWeeklyQuests();
    }

    return NextResponse.json({
      success: true,
      dailyReset,
      weeklyReset,
      isMonday,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error("Quest reset failed", error, "cron/reset-quests");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
