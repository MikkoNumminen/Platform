import { prisma } from "./db";
import { getDemoSessionId } from "./demo-session";

export interface SurveyRoundData {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  xpReward: number;
  customQuestions: unknown[] | null;
  deadline: Date | null;
  responseCount: number;
  creatorName: string;
  closedAt: Date | null;
  createdAt: Date;
}

export async function getAllSurveyRounds(): Promise<SurveyRoundData[]> {
  const _sessionId = await getDemoSessionId();
  const rounds = await prisma.surveyRound.findMany({
    orderBy: { number: "desc" },
    include: {
      _count: { select: { responses: true } },
      creator: { select: { alias: true, name: true } },
    },
  });

  return rounds.map((r) => ({
    id: r.id,
    number: r.number,
    title: r.title,
    description: r.description,
    status: r.status,
    xpReward: r.xpReward,
    customQuestions: r.customQuestions as unknown[] | null,
    deadline: r.deadline,
    responseCount: r._count.responses,
    creatorName: r.creator.alias ?? r.creator.name ?? "Unknown",
    closedAt: r.closedAt,
    createdAt: r.createdAt,
  }));
}

export async function getActiveSurveyRound(): Promise<SurveyRoundData | null> {
  const round = await prisma.surveyRound.findFirst({
    where: { status: "active" },
    include: {
      _count: { select: { responses: true } },
      creator: { select: { alias: true, name: true } },
    },
  });

  if (!round) return null;

  return {
    id: round.id,
    number: round.number,
    title: round.title,
    description: round.description,
    status: round.status,
    xpReward: round.xpReward,
    customQuestions: round.customQuestions as unknown[] | null,
    deadline: round.deadline,
    responseCount: round._count.responses,
    creatorName: round.creator.alias ?? round.creator.name ?? "Unknown",
    closedAt: round.closedAt,
    createdAt: round.createdAt,
  };
}
