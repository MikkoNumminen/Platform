export const XP_AMOUNTS = {
  "post:create": 20,
  "thread:create": 10,
  "topic:create": 15,
  "event:create": 20,
  "shout:create": 5,
  "issue:create": 15,
  "alias:set": 25,
  "survey:complete": 100,
  "daily:login": 10,
  "streak:7day": 50,
  "streak:30day": 200,
  "quest:complete": 0,
} as const;

export type XpSource = keyof typeof XP_AMOUNTS;

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0, title: "Newcomer" },
  { level: 2, xpRequired: 100, title: "Member" },
  { level: 3, xpRequired: 300, title: "Active Member" },
  { level: 4, xpRequired: 600, title: "Contributor" },
  { level: 5, xpRequired: 1000, title: "Regular" },
  { level: 6, xpRequired: 1500, title: "Veteran" },
  { level: 7, xpRequired: 2500, title: "Champion" },
  { level: 8, xpRequired: 4000, title: "Hero" },
  { level: 9, xpRequired: 6000, title: "Legend" },
  { level: 10, xpRequired: 10000, title: "Mythic" },
];

export function getLevelForXp(totalXp: number): LevelThreshold {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].xpRequired) {
      return LEVEL_THRESHOLDS[i];
    }
  }
  return LEVEL_THRESHOLDS[0];
}

export function getNextLevel(currentLevel: number): LevelThreshold | null {
  const idx = LEVEL_THRESHOLDS.findIndex((l) => l.level === currentLevel);
  if (idx === -1 || idx === LEVEL_THRESHOLDS.length - 1) return null;
  return LEVEL_THRESHOLDS[idx + 1];
}

export function getXpProgress(totalXp: number): {
  current: LevelThreshold;
  next: LevelThreshold | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const current = getLevelForXp(totalXp);
  const next = getNextLevel(current.level);
  if (!next) {
    return { current, next: null, xpIntoLevel: 0, xpForNextLevel: 0, progressPercent: 100 };
  }
  const xpIntoLevel = totalXp - current.xpRequired;
  const xpForNextLevel = next.xpRequired - current.xpRequired;
  const progressPercent = Math.min(100, Math.floor((xpIntoLevel / xpForNextLevel) * 100));
  return { current, next, xpIntoLevel, xpForNextLevel, progressPercent };
}

export const DAILY_SHOUT_XP_CAP = 25;
