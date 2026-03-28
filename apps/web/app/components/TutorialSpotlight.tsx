"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Chip, Paper, Popper, Typography } from "@mui/material";
import { useTutorialMaybe } from "./TutorialProvider";
import { matchRoute } from "@/lib/tutorial/tutorial-config";
import { colors } from "../styles";

const SPOTLIGHT_CLASS = "tutorial-spotlight-target";

export default function TutorialSpotlight() {
  const ctx = useTutorialMaybe();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const step = ctx?.currentStep;
  const isOnStepRoute = step ? matchRoute(step.route, pathname) : false;

  // Find and highlight the target element
  useEffect(() => {
    if (!step || !ctx?.isActive) {
      setAnchorEl(null);
      return;
    }

    const selector = isOnStepRoute
      ? step.targetSelector
      : findNavigationHintSelector(step, pathname);

    if (!selector) {
      setAnchorEl(null);
      return;
    }

    function findTarget() {
      const el = document.querySelector<HTMLElement>(selector!);
      if (el) {
        el.classList.add(SPOTLIGHT_CLASS);
        setAnchorEl(el);
      } else {
        setAnchorEl(null);
      }
    }

    findTarget();

    // Watch for DOM changes (elements appearing/disappearing)
    observerRef.current = new MutationObserver(() => findTarget());
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      // Remove spotlight class from all elements
      document.querySelectorAll(`.${SPOTLIGHT_CLASS}`).forEach((el) => {
        el.classList.remove(SPOTLIGHT_CLASS);
      });
      setAnchorEl(null);
    };
  }, [step, pathname, isOnStepRoute, ctx?.isActive]);

  if (!ctx?.isActive || !step || !anchorEl) return null;

  // Find the hint text
  const hintKey = isOnStepRoute ? `hint_${step.id}` : findNavigationHintKey(step, pathname);

  return (
    <>
      {/* Global spotlight CSS */}
      <style jsx global>{`
        .${SPOTLIGHT_CLASS} {
          position: relative;
          z-index: 1100;
          animation: tutorialPulse 2s ease-in-out infinite;
        }
        @keyframes tutorialPulse {
          0%,
          100% {
            box-shadow: 0 0 4px ${colors.accentBorder};
          }
          50% {
            box-shadow:
              0 0 16px ${colors.accentGlow},
              0 0 32px ${colors.accentBorder};
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .${SPOTLIGHT_CLASS} {
            animation: none;
            box-shadow: 0 0 8px ${colors.accentGlow};
          }
        }
      `}</style>

      <Popper
        open
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[
          { name: "offset", options: { offset: [0, 12] } },
          { name: "preventOverflow", options: { padding: 16 } },
        ]}
        sx={{ zIndex: 1200 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 2,
            maxWidth: 320,
            border: `1px solid ${colors.accentBorder}`,
            backgroundColor: colors.backdrop,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Chip
              label={`${ctx.completedCount + 1}/${ctx.totalSteps}`}
              size="small"
              sx={{
                backgroundColor: colors.accentBorder,
                color: colors.green400,
                fontWeight: 700,
                fontSize: "0.75rem",
                height: 22,
              }}
            />
            <Typography variant="subtitle2" sx={{ color: colors.slate100, fontWeight: 600 }}>
              {getStepTitle(step.id)}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: colors.slate400, fontSize: "0.8rem" }}>
            {getHintText(hintKey ?? `hint_${step.id}`)}
          </Typography>
        </Paper>
      </Popper>
    </>
  );
}

function findNavigationHintSelector(
  step: { navigationHints?: Array<{ fromRoute: string | RegExp; targetSelector: string }> },
  pathname: string,
): string | null {
  if (!step.navigationHints) return null;
  for (const hint of step.navigationHints) {
    if (matchRoute(hint.fromRoute, pathname)) {
      return hint.targetSelector;
    }
  }
  return null;
}

function findNavigationHintKey(
  step: { navigationHints?: Array<{ fromRoute: string | RegExp; hintKey: string }> },
  pathname: string,
): string | null {
  if (!step.navigationHints) return null;
  for (const hint of step.navigationHints) {
    if (matchRoute(hint.fromRoute, pathname)) {
      return hint.hintKey;
    }
  }
  return null;
}

// Step titles — these map to i18n keys but for now use static English
const STEP_TITLES: Record<string, string> = {
  set_alias: "Set your alias",
  complete_survey: "Complete the survey",
  report_issue: "Report an issue",
  explore_home: "Explore the homepage",
  browse_boards: "Browse the boards",
  create_post: "Create your first post",
  write_comment: "Write a comment",
  check_quests: "Check your quest log",
  view_achievements: "View achievements",
  check_leaderboard: "Check the leaderboard",
  create_board: "Create a board",
  view_survey_results: "View survey results",
  view_gamification_dashboard: "View gamification stats",
  resolve_issue: "Resolve an issue",
  manage_users: "Open user management",
  approve_user: "Approve a pending user",
  edit_permissions: "Edit user permissions",
};

function getStepTitle(stepId: string): string {
  return STEP_TITLES[stepId] ?? stepId;
}

// Hint texts
const HINT_TEXTS: Record<string, string> = {
  hint_set_alias: "Choose a display name that other members will see.",
  hint_complete_survey: "Tell us what features matter most to you.",
  hint_report_issue: "Found a bug? Let us know so we can fix it.",
  hint_explore_home: "Welcome! This is the community hub with the shoutbox.",
  hint_browse_boards: "Boards are where community discussions happen.",
  hint_create_post: "Click the + button to share something with the community.",
  hint_write_comment: "Join the conversation by leaving a comment.",
  hint_check_quests: "See your active quests and track your progress.",
  hint_view_achievements: "Check out the badges you can unlock.",
  hint_check_leaderboard: "See how you rank against other members.",
  hint_create_board: "As an admin, you can create new discussion boards.",
  hint_view_survey_results: "See what the community thinks.",
  hint_view_gamification_dashboard: "Monitor community engagement and XP stats.",
  hint_resolve_issue: "Mark reported issues as resolved.",
  hint_manage_users: "View and manage all community members.",
  hint_approve_user: "Approve pending users to give them access.",
  hint_edit_permissions: "Customize individual user permissions.",
  nav_setup_alias: "Set your alias to get started.",
  nav_click_survey: "Take the community survey.",
  nav_report_issue: "Open the menu to report an issue.",
  nav_click_boards: "Navigate to the Boards section.",
  nav_click_board: "Click a board to see its posts.",
  nav_click_post: "Click a post to read and comment.",
  nav_click_quests: "Open your quest log from the menu.",
  nav_click_achievements: "View your achievements from the menu.",
  nav_click_leaderboard: "Check the leaderboard from the menu.",
  nav_click_survey_results: "Open Survey Results from the admin menu.",
  nav_click_gamification: "Open Gamification Stats from the admin menu.",
  nav_click_issues: "Go to the Issue Tracker.",
  nav_click_manage_users: "Open Manage Users from the admin menu.",
};

function getHintText(hintKey: string): string {
  return HINT_TEXTS[hintKey] ?? "Follow the glowing highlight to continue.";
}
