import { z } from "zod";

export const AchievementCriteriaSchema = z.object({
  type: z.string(),
  action: z.string(),
  threshold: z.number(),
});

export const QuestCriteriaSchema = z.object({
  action: z.string(),
  count: z.number(),
});

export type AchievementCriteria = z.infer<typeof AchievementCriteriaSchema>;
export type QuestCriteria = z.infer<typeof QuestCriteriaSchema>;
