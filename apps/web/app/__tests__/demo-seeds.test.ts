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
  DEMO_CUSTOM_QUESTS,
  DEMO_ACHIEVEMENT_UNLOCKS,
  DEMO_QUEST_PROGRESS,
  DEMO_SURVEY_ROUND,
  DEMO_DM_CONVERSATIONS,
} from "@/lib/demo-seeds";

describe("demo-seeds — data completeness", () => {
  describe("DEMO_USERS", () => {
    test("has 6 users", () => {
      expect(DEMO_USERS).toHaveLength(6);
    });

    test("every user has required fields", () => {
      for (const user of DEMO_USERS) {
        expect(user.name).toBeTruthy();
        expect(user.alias).toBeTruthy();
        expect(user.email).toMatch(/@demo\.platform$/);
        expect(["superuser", "vuohi", "admin", "user", "pending"]).toContain(user.role);
        expect(typeof user.wantsToDevelop).toBe("boolean");
      }
    });

    test("has unique emails", () => {
      const emails = DEMO_USERS.map((u) => u.email);
      expect(new Set(emails).size).toBe(emails.length);
    });

    test("has unique aliases", () => {
      const aliases = DEMO_USERS.map((u) => u.alias);
      expect(new Set(aliases).size).toBe(aliases.length);
    });

    test("covers all needed roles for demo", () => {
      const roles = new Set(DEMO_USERS.map((u) => u.role));
      expect(roles).toContain("vuohi");
      expect(roles).toContain("admin");
      expect(roles).toContain("user");
      expect(roles).toContain("pending");
    });

    test("has at least one developer and one non-developer", () => {
      expect(DEMO_USERS.some((u) => u.wantsToDevelop)).toBe(true);
      expect(DEMO_USERS.some((u) => !u.wantsToDevelop)).toBe(true);
    });

    test("developers have skills and tags", () => {
      for (const user of DEMO_USERS.filter((u) => u.wantsToDevelop && u.developerTag)) {
        expect(user.developmentSkills.length).toBeGreaterThan(0);
        expect(user.developerTag).toBeTruthy();
      }
    });
  });

  describe("DEMO_BOARDS", () => {
    test("has 2 boards", () => {
      expect(DEMO_BOARDS).toHaveLength(2);
    });

    test("every board has required fields", () => {
      for (const board of DEMO_BOARDS) {
        expect(board.name).toBeTruthy();
        expect(board.slug).toBeTruthy();
        expect(board.description).toBeTruthy();
      }
    });

    test("slugs are unique and prefixed with demo-", () => {
      const slugs = DEMO_BOARDS.map((b) => b.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) {
        expect(slug).toMatch(/^demo-/);
      }
    });
  });

  describe("DEMO_POSTS", () => {
    test("has 5 posts", () => {
      expect(DEMO_POSTS).toHaveLength(5);
    });

    test("every post references valid board and author indices", () => {
      for (const post of DEMO_POSTS) {
        expect(post.boardIndex).toBeGreaterThanOrEqual(0);
        expect(post.boardIndex).toBeLessThan(DEMO_BOARDS.length);
        expect(post.authorIndex).toBeGreaterThanOrEqual(0);
        expect(post.authorIndex).toBeLessThan(DEMO_USERS.length);
        expect(post.title).toBeTruthy();
        expect(post.slug).toBeTruthy();
        expect(post.body).toBeTruthy();
      }
    });

    test("has at least one pinned post", () => {
      expect(DEMO_POSTS.some((p) => p.pinned)).toBe(true);
    });

    test("slugs are unique and prefixed with demo-", () => {
      const slugs = DEMO_POSTS.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) {
        expect(slug).toMatch(/^demo-/);
      }
    });

    test("posts span both boards", () => {
      const boardIndices = new Set(DEMO_POSTS.map((p) => p.boardIndex));
      expect(boardIndices.size).toBe(DEMO_BOARDS.length);
    });
  });

  describe("DEMO_THREADS", () => {
    test("has 12 threads", () => {
      expect(DEMO_THREADS).toHaveLength(12);
    });

    test("every thread references valid post and author indices", () => {
      for (const thread of DEMO_THREADS) {
        expect(thread.postIndex).toBeGreaterThanOrEqual(0);
        expect(thread.postIndex).toBeLessThan(DEMO_POSTS.length);
        expect(thread.authorIndex).toBeGreaterThanOrEqual(0);
        expect(thread.authorIndex).toBeLessThan(DEMO_USERS.length);
        expect(thread.body).toBeTruthy();
        expect(thread.parentType).toBe("POST");
      }
    });

    test("reply-to indices reference earlier threads", () => {
      for (let i = 0; i < DEMO_THREADS.length; i++) {
        const replyTo = DEMO_THREADS[i].replyToIndex;
        if (replyTo !== null) {
          expect(replyTo).toBeLessThan(i);
          expect(replyTo).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("threads cover multiple posts", () => {
      const postIndices = new Set(DEMO_THREADS.map((t) => t.postIndex));
      expect(postIndices.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("DEMO_SHOUTS", () => {
    test("has 10 shouts", () => {
      expect(DEMO_SHOUTS).toHaveLength(10);
    });

    test("every shout has valid author index and message", () => {
      for (const shout of DEMO_SHOUTS) {
        expect(shout.authorIndex).toBeGreaterThanOrEqual(0);
        expect(shout.authorIndex).toBeLessThan(DEMO_USERS.length);
        expect(shout.message).toBeTruthy();
      }
    });

    test("shouts come from multiple users", () => {
      const authors = new Set(DEMO_SHOUTS.map((s) => s.authorIndex));
      expect(authors.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("DEMO_EVENTS", () => {
    test("has 6 events", () => {
      expect(DEMO_EVENTS).toHaveLength(6);
    });

    test("every event has required fields", () => {
      for (const event of DEMO_EVENTS) {
        expect(event.authorIndex).toBeGreaterThanOrEqual(0);
        expect(event.authorIndex).toBeLessThan(DEMO_USERS.length);
        expect(event.title).toBeTruthy();
        expect(event.description).toBeTruthy();
        expect(typeof event.daysFromNow).toBe("number");
        expect(event.daysFromNow).toBeGreaterThan(0);
        expect(typeof event.allDay).toBe("boolean");
      }
    });

    test("has at least one all-day event", () => {
      expect(DEMO_EVENTS.some((e) => e.allDay)).toBe(true);
    });

    test("events are in the future (positive daysFromNow)", () => {
      for (const event of DEMO_EVENTS) {
        expect(event.daysFromNow).toBeGreaterThan(0);
      }
    });

    test("non-allday events have positive duration", () => {
      for (const event of DEMO_EVENTS.filter((e) => !e.allDay)) {
        expect(event.durationHours).toBeGreaterThan(0);
      }
    });
  });

  describe("DEMO_ISSUES", () => {
    test("has 4 issues", () => {
      expect(DEMO_ISSUES).toHaveLength(4);
    });

    test("every issue has required fields", () => {
      for (const issue of DEMO_ISSUES) {
        expect(issue.authorIndex).toBeGreaterThanOrEqual(0);
        expect(issue.authorIndex).toBeLessThan(DEMO_USERS.length);
        expect(issue.title).toBeTruthy();
        expect(issue.description).toBeTruthy();
        expect(typeof issue.resolved).toBe("boolean");
      }
    });

    test("has mix of resolved and unresolved", () => {
      expect(DEMO_ISSUES.some((i) => i.resolved)).toBe(true);
      expect(DEMO_ISSUES.some((i) => !i.resolved)).toBe(true);
    });
  });

  describe("DEMO_SURVEY_RESPONSES", () => {
    test("has 5 responses", () => {
      expect(DEMO_SURVEY_RESPONSES).toHaveLength(5);
    });

    test("every response has required fields", () => {
      for (const resp of DEMO_SURVEY_RESPONSES) {
        expect(resp.conversationStyle).toBeTruthy();
        expect(resp.features.length).toBeGreaterThan(0);
        expect(resp.mustHave).toBeTruthy();
        expect(typeof resp.wantsToDevelop).toBe("boolean");
      }
    });

    test("has at least one anonymous response (null authorIndex)", () => {
      expect(DEMO_SURVEY_RESPONSES.some((r) => r.authorIndex === null)).toBe(true);
    });

    test("non-anonymous responses reference valid user indices", () => {
      for (const resp of DEMO_SURVEY_RESPONSES.filter((r) => r.authorIndex !== null)) {
        expect(resp.authorIndex).toBeGreaterThanOrEqual(0);
        expect(resp.authorIndex!).toBeLessThan(DEMO_USERS.length);
      }
    });
  });

  describe("DEMO_XP_PROFILES", () => {
    test("has 4 profiles", () => {
      expect(DEMO_XP_PROFILES).toHaveLength(4);
    });

    test("every profile has valid user index, XP, and level", () => {
      for (const profile of DEMO_XP_PROFILES) {
        expect(profile.userIndex).toBeGreaterThanOrEqual(0);
        expect(profile.userIndex).toBeLessThan(DEMO_USERS.length);
        expect(profile.totalXp).toBeGreaterThan(0);
        expect(profile.level).toBeGreaterThanOrEqual(1);
      }
    });

    test("higher XP means higher level", () => {
      const sorted = [...DEMO_XP_PROFILES].sort((a, b) => a.totalXp - b.totalXp);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].level).toBeGreaterThanOrEqual(sorted[i - 1].level);
      }
    });

    test("profiles reference unique users", () => {
      const indices = DEMO_XP_PROFILES.map((p) => p.userIndex);
      expect(new Set(indices).size).toBe(indices.length);
    });
  });

  describe("DEMO_CUSTOM_QUESTS", () => {
    test("has 4 quests", () => {
      expect(DEMO_CUSTOM_QUESTS).toHaveLength(4);
    });

    test("every quest has required fields", () => {
      for (const quest of DEMO_CUSTOM_QUESTS) {
        expect(quest.title).toBeTruthy();
        expect(quest.description).toBeTruthy();
        expect(quest.xpReward).toBeGreaterThan(0);
        expect(["open", "in_progress", "completed"]).toContain(quest.status);
        expect(["low", "normal", "high", "urgent"]).toContain(quest.priority);
        expect(quest.assigneeIndex).toBeGreaterThanOrEqual(0);
        expect(quest.assigneeIndex).toBeLessThan(DEMO_USERS.length);
        expect(quest.creatorIndex).toBeGreaterThanOrEqual(0);
        expect(quest.creatorIndex).toBeLessThan(DEMO_USERS.length);
      }
    });

    test("completed quests have completed flag", () => {
      for (const quest of DEMO_CUSTOM_QUESTS) {
        if (quest.status === "completed") {
          expect(quest.completed).toBe(true);
        }
      }
    });

    test("has mix of statuses", () => {
      const statuses = new Set(DEMO_CUSTOM_QUESTS.map((q) => q.status));
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe("DEMO_ACHIEVEMENT_UNLOCKS", () => {
    test("has 4 user entries", () => {
      expect(DEMO_ACHIEVEMENT_UNLOCKS).toHaveLength(4);
    });

    test("every entry has valid user index and non-empty achievement keys", () => {
      for (const entry of DEMO_ACHIEVEMENT_UNLOCKS) {
        expect(entry.userIndex).toBeGreaterThanOrEqual(0);
        expect(entry.userIndex).toBeLessThan(DEMO_USERS.length);
        expect(entry.achievementKeys.length).toBeGreaterThan(0);
      }
    });

    test("all users have the 'welcome' achievement", () => {
      for (const entry of DEMO_ACHIEVEMENT_UNLOCKS) {
        expect(entry.achievementKeys).toContain("welcome");
      }
    });

    test("higher-XP users have more achievements", () => {
      const xpMap = new Map(DEMO_XP_PROFILES.map((p) => [p.userIndex, p.totalXp]));
      const sorted = [...DEMO_ACHIEVEMENT_UNLOCKS]
        .filter((a) => xpMap.has(a.userIndex))
        .sort((a, b) => (xpMap.get(a.userIndex) ?? 0) - (xpMap.get(b.userIndex) ?? 0));
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].achievementKeys.length).toBeGreaterThanOrEqual(
          sorted[i - 1].achievementKeys.length,
        );
      }
    });
  });

  describe("DEMO_QUEST_PROGRESS", () => {
    test("has 13 entries", () => {
      expect(DEMO_QUEST_PROGRESS).toHaveLength(13);
    });

    test("every entry has valid user index and quest key", () => {
      for (const entry of DEMO_QUEST_PROGRESS) {
        expect(entry.userIndex).toBeGreaterThanOrEqual(0);
        expect(entry.userIndex).toBeLessThan(DEMO_USERS.length);
        expect(entry.questKey).toBeTruthy();
        expect(entry.progress).toBeGreaterThanOrEqual(1);
        expect(typeof entry.completed).toBe("boolean");
      }
    });

    test("completed entries have progress >= 1", () => {
      for (const entry of DEMO_QUEST_PROGRESS.filter((e) => e.completed)) {
        expect(entry.progress).toBeGreaterThanOrEqual(1);
      }
    });

    test("includes onboarding quests", () => {
      const keys = DEMO_QUEST_PROGRESS.map((e) => e.questKey);
      expect(keys).toContain("onboarding_alias");
      expect(keys).toContain("onboarding_survey");
    });

    test("includes daily quests", () => {
      const keys = DEMO_QUEST_PROGRESS.map((e) => e.questKey);
      expect(keys).toContain("daily_login");
    });
  });

  describe("DEMO_SURVEY_ROUND", () => {
    test("has required fields", () => {
      expect(DEMO_SURVEY_ROUND.number).toBe(1);
      expect(DEMO_SURVEY_ROUND.title).toBeTruthy();
      expect(DEMO_SURVEY_ROUND.description).toBeTruthy();
      expect(DEMO_SURVEY_ROUND.status).toBe("active");
      expect(DEMO_SURVEY_ROUND.xpReward).toBeGreaterThan(0);
      expect(DEMO_SURVEY_ROUND.creatorIndex).toBeGreaterThanOrEqual(0);
      expect(DEMO_SURVEY_ROUND.creatorIndex).toBeLessThan(DEMO_USERS.length);
    });
  });

  describe("DEMO_DM_CONVERSATIONS", () => {
    test("has 2 conversations", () => {
      expect(DEMO_DM_CONVERSATIONS).toHaveLength(2);
    });

    test("every conversation has valid participant indices", () => {
      for (const conv of DEMO_DM_CONVERSATIONS) {
        expect(conv.participantAIndex).toBeGreaterThanOrEqual(0);
        expect(conv.participantAIndex).toBeLessThan(DEMO_USERS.length);
        expect(conv.participantBIndex).toBeGreaterThanOrEqual(0);
        expect(conv.participantBIndex).toBeLessThan(DEMO_USERS.length);
        expect(conv.participantAIndex).not.toBe(conv.participantBIndex);
      }
    });

    test("every message has valid sender index and non-empty message", () => {
      for (const conv of DEMO_DM_CONVERSATIONS) {
        for (const msg of conv.messages) {
          expect(msg.senderIndex).toBeGreaterThanOrEqual(0);
          expect(msg.senderIndex).toBeLessThan(DEMO_USERS.length);
          expect(msg.message).toBeTruthy();
          // Sender must be one of the participants
          expect([conv.participantAIndex, conv.participantBIndex]).toContain(msg.senderIndex);
        }
      }
    });

    test("conversations have multiple messages", () => {
      for (const conv of DEMO_DM_CONVERSATIONS) {
        expect(conv.messages.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("cross-referential integrity", () => {
    test("XP profile users are non-pending (active members)", () => {
      for (const profile of DEMO_XP_PROFILES) {
        const user = DEMO_USERS[profile.userIndex];
        expect(user.role).not.toBe("pending");
      }
    });

    test("post authors are non-pending users", () => {
      for (const post of DEMO_POSTS) {
        const user = DEMO_USERS[post.authorIndex];
        expect(user.role).not.toBe("pending");
      }
    });

    test("quest assignees exist in users array", () => {
      for (const quest of DEMO_CUSTOM_QUESTS) {
        expect(DEMO_USERS[quest.assigneeIndex]).toBeDefined();
        expect(DEMO_USERS[quest.creatorIndex]).toBeDefined();
      }
    });

    test("survey round creator is vuohi or higher", () => {
      const creator = DEMO_USERS[DEMO_SURVEY_ROUND.creatorIndex];
      expect(["superuser", "vuohi"]).toContain(creator.role);
    });

    test("achievement unlock users match XP profile users", () => {
      const xpUserIndices = new Set(DEMO_XP_PROFILES.map((p) => p.userIndex));
      for (const unlock of DEMO_ACHIEVEMENT_UNLOCKS) {
        expect(xpUserIndices.has(unlock.userIndex)).toBe(true);
      }
    });
  });
});
