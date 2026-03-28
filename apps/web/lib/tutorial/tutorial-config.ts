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
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="nav-report-issue"]',
        hintKey: "nav_report_issue",
      },
    ],
  },

  // ── Tier 2: User (6 steps) ─────────────────────────────────────────────
  {
    id: "explore_home",
    route: "/",
    targetSelector: '[data-tutorial="shoutbox"]',
    autoCompleteOnRoute: true,
    tier: 2,
    xpReward: 10,
  },
  {
    id: "create_post",
    route: /^\/boards\/[^/]+$/,
    targetSelector: '[data-tutorial="create-post-button"]',
    event: "tutorial:post_created",
    tier: 2,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: "/boards",
        targetSelector: '[data-tutorial="board-card"]',
        hintKey: "nav_click_board",
      },
    ],
  },
  {
    id: "write_comment",
    route: /^\/boards\/[^/]+\/[^/]+$/,
    targetSelector: '[data-tutorial="thread-composer"]',
    event: "tutorial:comment_created",
    tier: 2,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /^\/boards\/[^/]+$/,
        targetSelector: '[data-tutorial="post-link"]',
        hintKey: "nav_click_post",
      },
    ],
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
        targetSelector: '[data-tutorial="nav-quests"]',
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
        targetSelector: '[data-tutorial="nav-achievements"]',
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
        targetSelector: '[data-tutorial="nav-leaderboard"]',
        hintKey: "nav_click_leaderboard",
      },
    ],
  },

  // ── Tier 3: Admin (2 steps) ─────────────────────────────────────────────
  {
    id: "view_survey_results",
    route: "/admin/survey-results",
    targetSelector: '[data-tutorial="survey-results"]',
    autoCompleteOnRoute: true,
    tier: 3,
    xpReward: 10,
    navigationHints: [
      {
        fromRoute: /.*/,
        targetSelector: '[data-tutorial="nav-survey-results"]',
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
        targetSelector: '[data-tutorial="nav-gamification"]',
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
        targetSelector: '[data-tutorial="nav-manage-users"]',
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
