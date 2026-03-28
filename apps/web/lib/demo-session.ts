"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  DEMO_USERS,
  DEMO_BOARDS,
  DEMO_POSTS,
  DEMO_THREADS,
  DEMO_SHOUTS,
  DEMO_EVENTS,
  DEMO_ISSUES,
  DEMO_SURVEY_RESPONSES,
  DEMO_XP_PROFILES,
} from "./demo-seeds";

// Used by auth.ts signIn callback to identify demo users
const _DEMO_EMAIL = "demo@platform.app";
const DEMO_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function getDemoSessionId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.demoSessionId ?? null;
}

export async function seedDemoData(sessionId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const userMap = new Map<number, string>();

    for (let i = 0; i < DEMO_USERS.length; i++) {
      const seed = DEMO_USERS[i];
      const user = await tx.user.create({
        data: {
          email: `${seed.email}-${sessionId.slice(0, 8)}`,
          name: seed.name,
          alias: `${seed.alias}_${sessionId.slice(0, 6)}`,
          role: seed.role,
          wantsToDevelop: seed.wantsToDevelop,
          developerTag: seed.developerTag,
          developmentSkills: [...seed.developmentSkills],
          hasSeenPromotion: true,
          sessionId,
        },
      });
      userMap.set(i, user.id);
    }

    const boardMap = new Map<number, string>();
    for (let i = 0; i < DEMO_BOARDS.length; i++) {
      const seed = DEMO_BOARDS[i];
      const board = await tx.board.create({
        data: {
          name: seed.name,
          slug: `${seed.slug}-${sessionId.slice(0, 8)}`,
          description: seed.description,
          sortOrder: i,
          sessionId,
        },
      });
      boardMap.set(i, board.id);
    }

    const postMap = new Map<number, string>();
    for (let i = 0; i < DEMO_POSTS.length; i++) {
      const seed = DEMO_POSTS[i];
      const post = await tx.post.create({
        data: {
          title: seed.title,
          slug: `${seed.slug}-${sessionId.slice(0, 8)}`,
          body: seed.body,
          pinned: seed.pinned,
          authorId: userMap.get(seed.authorIndex)!,
          boardId: boardMap.get(seed.boardIndex)!,
          sessionId,
        },
      });
      postMap.set(i, post.id);
    }

    const threadMap = new Map<number, string>();
    for (let i = 0; i < DEMO_THREADS.length; i++) {
      const seed = DEMO_THREADS[i];
      const thread = await tx.thread.create({
        data: {
          body: seed.body,
          parentType: "POST",
          parentId: postMap.get(seed.postIndex)!,
          authorId: userMap.get(seed.authorIndex)!,
          replyToId: seed.replyToIndex !== null ? (threadMap.get(seed.replyToIndex) ?? null) : null,
          sessionId,
        },
      });
      threadMap.set(i, thread.id);
    }

    for (const seed of DEMO_SHOUTS) {
      await tx.shout.create({
        data: {
          message: seed.message,
          authorId: userMap.get(seed.authorIndex)!,
          sessionId,
        },
      });
    }

    const now = new Date();
    for (const seed of DEMO_EVENTS) {
      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() + seed.daysFromNow);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(startTime);
      if (seed.allDay) {
        endTime.setHours(23, 59, 0, 0);
      } else {
        endTime.setHours(10 + seed.durationHours, 0, 0, 0);
      }

      await tx.calendarEvent.create({
        data: {
          title: seed.title,
          description: seed.description,
          location: seed.location,
          startTime,
          endTime,
          allDay: seed.allDay,
          authorId: userMap.get(seed.authorIndex)!,
          sessionId,
        },
      });
    }

    for (const seed of DEMO_ISSUES) {
      await tx.issueReport.create({
        data: {
          title: seed.title,
          description: seed.description,
          url: seed.url,
          authorId: userMap.get(seed.authorIndex)!,
          resolvedAt: seed.resolved ? new Date() : null,
          sessionId,
        },
      });
    }

    for (const seed of DEMO_SURVEY_RESPONSES) {
      await tx.surveyResponse.create({
        data: {
          conversationStyle: seed.conversationStyle,
          features: [...seed.features],
          mustHave: seed.mustHave,
          dealbreaker: seed.dealbreaker,
          otherFeedback: seed.otherFeedback,
          wantsToDevelop: seed.wantsToDevelop,
          developmentSkills: [...seed.developmentSkills],
          userId: seed.authorIndex !== null ? (userMap.get(seed.authorIndex) ?? null) : null,
          sessionId,
        },
      });
    }

    for (const seed of DEMO_XP_PROFILES) {
      const userId = userMap.get(seed.userIndex)!;

      await tx.userLevel.create({
        data: {
          userId,
          totalXp: seed.totalXp,
          level: seed.level,
          sessionId,
        },
      });

      await tx.xpTransaction.create({
        data: {
          userId,
          amount: seed.totalXp,
          source: "demo:seed",
          sessionId,
        },
      });

      await tx.loginStreak.create({
        data: {
          userId,
          currentStreak: seed.level,
          longestStreak: seed.level * 2,
          lastLoginDate: new Date(),
          sessionId,
        },
      });
    }
  });
}

export async function cleanupStaleDemoSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - DEMO_SESSION_MAX_AGE_MS);

  const staleSessions = await prisma.demoSession.findMany({
    where: { lastActiveAt: { lt: cutoff } },
    select: { id: true },
  });

  if (staleSessions.length === 0) return 0;

  for (const session of staleSessions) {
    const sid = session.id;

    await prisma.userTourProgress.deleteMany({ where: { sessionId: sid } });
    await prisma.userQuestProgress.deleteMany({ where: { sessionId: sid } });
    await prisma.userAchievement.deleteMany({ where: { sessionId: sid } });
    await prisma.xpTransaction.deleteMany({ where: { sessionId: sid } });
    await prisma.userLevel.deleteMany({ where: { sessionId: sid } });
    await prisma.loginStreak.deleteMany({ where: { sessionId: sid } });
    await prisma.thread.deleteMany({ where: { sessionId: sid } });
    await prisma.post.deleteMany({ where: { sessionId: sid } });
    await prisma.board.deleteMany({ where: { sessionId: sid } });
    await prisma.topic.deleteMany({ where: { sessionId: sid } });
    await prisma.forum.deleteMany({ where: { sessionId: sid } });
    await prisma.shout.deleteMany({ where: { sessionId: sid } });
    await prisma.calendarEvent.deleteMany({ where: { sessionId: sid } });
    await prisma.issueReport.deleteMany({ where: { sessionId: sid } });
    await prisma.surveyResponse.deleteMany({ where: { sessionId: sid } });
    await prisma.user.deleteMany({ where: { sessionId: sid } });
    await prisma.demoSession.delete({ where: { id: sid } });
  }

  return staleSessions.length;
}
