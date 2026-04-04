"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Chip, Paper, Popper, Typography } from "@mui/material";
import { useTutorialMaybe } from "./TutorialProvider";
import { matchRoute } from "@/lib/tutorial/tutorial-config";
import { colors } from "../styles";

const SPOTLIGHT_CLASS = "tutorial-spotlight-target";

// When the user menu is open, highlight the specific menu item instead of the avatar
const STEP_MENU_ITEMS: Record<string, string> = {
  report_issue: '[data-tutorial="nav-issues"]',
  check_quests: '[data-tutorial="nav-quests"]',
  view_achievements: '[data-tutorial="nav-achievements"]',
  check_leaderboard: '[data-tutorial="nav-leaderboard"]',
  view_survey_results: '[data-tutorial="nav-feedback"]',
  view_gamification_dashboard: '[data-tutorial="nav-dashboard"]',
  manage_users: '[data-tutorial="nav-manage-users"]',
  approve_user: '[data-tutorial="nav-manage-users"]',
  edit_permissions: '[data-tutorial="nav-manage-users"]',
};

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

    const navHintSelector = isOnStepRoute ? null : findNavigationHintSelector(step, pathname);
    const primarySelector = isOnStepRoute ? step.targetSelector : navHintSelector;

    if (!primarySelector) {
      setAnchorEl(null);
      return;
    }

    function findTarget() {
      // Remove previous spotlight
      document.querySelectorAll(`.${SPOTLIGHT_CLASS}`).forEach((el) => {
        el.classList.remove(SPOTLIGHT_CLASS);
      });

      // When highlighting the user menu button, check if the menu is open
      // and a more specific menu item is now visible
      let el: HTMLElement | null = null;
      if (!isOnStepRoute && primarySelector === '[data-tutorial="user-menu-button"]' && step) {
        const menuItemSelector = STEP_MENU_ITEMS[step.id];
        if (menuItemSelector) {
          const menuItem = document.querySelector<HTMLElement>(menuItemSelector);
          if (menuItem) el = menuItem;
        }
      }

      // Fall back to the primary selector
      if (!el) {
        el = document.querySelector<HTMLElement>(primarySelector!);
      }

      if (el) {
        el.classList.add(SPOTLIGHT_CLASS);
        setAnchorEl(el);
        // Auto-scroll target into view when spotlight appears
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
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
          animation: tutorialPulse 1.5s ease-in-out infinite;
          border-radius: 4px;
        }
        @keyframes tutorialPulse {
          0%,
          100% {
            box-shadow:
              0 0 6px ${colors.accentBorder},
              inset 0 0 2px ${colors.accentBorder};
          }
          50% {
            box-shadow:
              0 0 20px ${colors.accentGlow},
              0 0 40px ${colors.accentBorder},
              inset 0 0 4px ${colors.accentGlow};
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
          onClick={() => anchorEl?.scrollIntoView({ behavior: "smooth", block: "center" })}
          sx={{
            p: 2,
            maxWidth: 320,
            border: `1px solid ${colors.accentBorder}`,
            backgroundColor: colors.backdrop,
            cursor: "pointer",
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
  send_shoutbox: "Send a shoutbox message",
  check_quests: "Check your quest log",
  view_achievements: "View achievements",
  check_leaderboard: "Check the leaderboard",
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
  hint_send_shoutbox: "Type a message and press Enter to chat with the community.",
  hint_check_quests: "See your active quests and track your progress.",
  hint_view_achievements: "Check out the badges you can unlock.",
  hint_check_leaderboard: "See how you rank against other members.",
  hint_view_survey_results: "See what the community thinks.",
  hint_view_gamification_dashboard: "Monitor community engagement and XP stats.",
  hint_resolve_issue: "Mark reported issues as resolved.",
  hint_manage_users: "View and manage all community members.",
  hint_approve_user: "Approve pending users to give them access.",
  hint_edit_permissions: "Customize individual user permissions.",
  nav_setup_alias: "Set your alias to get started.",
  nav_click_survey: "Take the community survey.",
  nav_report_issue: "Click your avatar to open the menu, then Report Issue.",
  nav_click_report_issue: "Click the Report Issue button.",
  nav_click_quests: "Click your avatar to open the menu, then Quests.",
  nav_click_achievements: "Click your avatar to open the menu, then Achievements.",
  nav_click_leaderboard: "Click your avatar to open the menu, then Leaderboard.",
  nav_click_survey_results: "Click your avatar to open the menu, then Feedback.",
  nav_click_gamification: "Click your avatar to open the menu, then Gamification Dashboard.",
  nav_click_issues: "Click your avatar to open the menu, then Issues.",
  nav_click_manage_users: "Click your avatar to open the menu, then Manage Users.",
};

function getHintText(hintKey: string): string {
  return HINT_TEXTS[hintKey] ?? "Follow the glowing highlight to continue.";
}
