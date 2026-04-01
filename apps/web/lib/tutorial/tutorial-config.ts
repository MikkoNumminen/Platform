// ─── Tutorial Step Registry ─────────────────────────────────────────────────
// To add a new tutorial step:
// 1. Add a step object to TUTORIAL_STEPS with: id, route, targetSelector, tier, xpReward
// 2. Add optional: event (for action-triggered completion), autoCompleteOnRoute (for visit-based)
// 3. Add navigation hints if needed (fromRoute → targetSelector mapping)
// 4. Add data-tutorial="your-selector" attribute to the target UI element
// 5. Add i18n key: tutorial.step_<id> in all locale files
// Steps are cumulative — higher tiers include all lower-tier steps.
// ────────────────────────────────────────────────────────────────────────────

export interface NavigationHint {
  fromRoute: string | RegExp;
  targetSelector: string;
  hintKey: string;
}

export interface TutorialStep {
  id: string;
  route: string | RegExp;
  targetSelector: string;
  event?: string;
  autoCompleteOnRoute?: boolean;
  navigationHints?: NavigationHint[];
  tier: number; // 1=pending, 2=user, 3=admin, 4=vuohi/superuser
  xpReward: number;
}

// Role → minimum tier they must complete
export const ROLE_TIER: Record<string, number> = {
  pending: 1,
  user: 2,
  admin: 3,
  vuohi: 4,
  superuser: 4,
};

export function getStepsForRole(role: string): TutorialStep[] {
  const maxTier = ROLE_TIER[role] ?? 1;
  return TUTORIAL_STEPS.filter((s) => s.tier <= maxTier);
}

export function matchRoute(pattern: string | RegExp, pathname: string): boolean {
  if (typeof pattern === "string") return pathname === pattern;
  return pattern.test(pathname);
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ── Tier 1: Pending (3 steps) ──────────────────────────────────────────
  {
    id: "set_alias",
    route: "/setup-alias",
    targetSelector: '[data-tutorial="alias-form"]',
    event: "tutorial:alias_set",
    tier: 1,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="alias-form"]',
        hintKey: "nav_setup_alias",
      },
    ],
  },
  {
    id: "complete_survey",
    route: "/survey",
    targetSelector: '[data-tutorial="survey-form"]',
    event: "tutorial:survey_complete",
    tier: 1,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /^\/$/,
        targetSelector: '[data-tutorial="survey-cta"]',
        hintKey: "nav_click_survey",
      },
    ],
  },
  {
    id: "report_issue",
    route: "/report-issue",
    targetSelector: '[data-tutorial="report-issue-form"]',
    event: "tutorial:issue_reported",
    tier: 1,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: "/issues",
        targetSelector: '[data-tutorial="report-issue-button"]',
        hintKey: "nav_click_report_issue",
      },
      {
        fromRoute: /^\/issues/,
        targetSelector: '[data-tutorial="report-issue-button"]',
        hintKey: "nav_click_report_issue",
      },
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_report_issue",
      },
    ],
  },

  // ── Tier 2: User (5 steps) ─────────────────────────────────────────────
  {
    id: "explore_home",
    route: "/",
    targetSelector: '[data-tutorial="shoutbox"]',
    autoCompleteOnRoute: true,
    tier: 2,
    xpReward: 10,
  },
  {
    id: "write_comment",
    route: "/",
    targetSelector: '[data-tutorial="shoutbox-input"]',
    event: "tutorial:write_comment",
    tier: 2,
    xpReward: 10,
  },
  {
    id: "check_quests",
    route: "/quests",
    targetSelector: '[data-tutorial="quest-list"]',
    autoCompleteOnRoute: true,
    tier: 2,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_click_quests",
      },
    ],
  },
  {
    id: "view_achievements",
    route: "/achievements",
    targetSelector: '[data-tutorial="achievement-grid"]',
    autoCompleteOnRoute: true,
    tier: 2,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_click_achievements",
      },
    ],
  },
  {
    id: "check_leaderboard",
    route: "/leaderboard",
    targetSelector: '[data-tutorial="leaderboard-list"]',
    autoCompleteOnRoute: true,
    tier: 2,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_click_leaderboard",
      },
    ],
  },

  // ── Tier 3: Admin (2 steps) ─────────────────────────────────────────────
  {
    id: "view_survey_results",
    route: "/feedback",
    targetSelector: '[data-tutorial="feedback-page"]',
    autoCompleteOnRoute: true,
    tier: 3,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_click_survey_results",
      },
    ],
  },
  {
    id: "view_gamification_dashboard",
    route: "/admin/gamification",
    targetSelector: '[data-tutorial="gamification-dashboard"]',
    autoCompleteOnRoute: true,
    tier: 3,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_click_gamification",
      },
    ],
  },

  // ── Tier 4: Vuohi/Superuser (3 steps) ──────────────────────────────────
  {
    id: "manage_users",
    route: "/admin/users",
    targetSelector: '[data-tutorial="users-table"]',
    autoCompleteOnRoute: true,
    tier: 4,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_click_manage_users",
      },
    ],
  },
  {
    id: "approve_user",
    route: "/admin/users",
    targetSelector: '[data-tutorial="approve-button"]',
    event: "tutorial:user_approved",
    tier: 4,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="user-menu-button"]',
        hintKey: "nav_click_manage_users",
      },
    ],
  },
  {
    id: "edit_permissions",
    route: "/admin/users",
    targetSelector: '[data-tutorial="permission-editor"]',
    event: "tutorial:permissions_edited",
    tier: 4,
    xpReward: 10,
  },
];

export const TIER_NAMES: Record<number, string> = {
  1: "Getting Started",
  2: "Community Explorer",
  3: "Admin Basics",
  4: "Team Leader",
};

export const TIER_XP_BONUS: Record<number, number> = {
  1: 50,
  2: 100,
  3: 75,
  4: 75,
};
