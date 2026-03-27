import { Box, Chip, Divider, Paper, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import LockIcon from "@mui/icons-material/Lock";
import TopBar from "../../../components/TopBar";
import { colors } from "../../../styles";

interface TopicData {
  title: string;
  slug: string;
  forumSlug: string;
  body: string;
  authorName: string;
  createdAt: string;
  pinned: boolean;
  locked: boolean;
}

const topicData: Record<string, Record<string, TopicData>> = {
  "general-discussion": {
    "welcome-to-the-community": {
      title: "Welcome to the community!",
      slug: "welcome-to-the-community",
      forumSlug: "general-discussion",
      body: "Hey everyone! Welcome to our community platform. This is a space for sharing ideas, asking questions, and connecting with others. Feel free to explore the forums, introduce yourself, and jump into any discussion that interests you.\n\nWe're glad to have you here. Let's build something great together.",
      authorName: "Admin",
      createdAt: "2026-03-01",
      pinned: true,
      locked: false,
    },
    "community-guidelines-and-rules": {
      title: "Community guidelines and rules",
      slug: "community-guidelines-and-rules",
      forumSlug: "general-discussion",
      body: "Please keep the following guidelines in mind when participating in discussions:\n\n1. Be respectful and constructive in all interactions.\n2. Stay on topic within each forum category.\n3. No spam, self-promotion, or low-effort posts.\n4. Report any content that violates these guidelines.\n\nThank you for helping us maintain a welcoming community.",
      authorName: "Admin",
      createdAt: "2026-03-01",
      pinned: true,
      locked: true,
    },
    "introduce-yourself-here": {
      title: "Introduce yourself here",
      slug: "introduce-yourself-here",
      forumSlug: "general-discussion",
      body: "I'll go first — I'm Mikko, a full-stack developer from Finland. I've been working with React and TypeScript for a few years now. Currently building this community platform as a portfolio project.\n\nWho are you and what brings you here?",
      authorName: "Mikko",
      createdAt: "2026-03-10",
      pinned: false,
      locked: false,
    },
    "what-are-you-working-on-this-week": {
      title: "What are you working on this week?",
      slug: "what-are-you-working-on-this-week",
      forumSlug: "general-discussion",
      body: "Share what projects or tasks you're tackling this week. I've been refactoring a legacy codebase and migrating it to TypeScript. It's tedious but satisfying work.",
      authorName: "Juhani",
      createdAt: "2026-03-20",
      pinned: false,
      locked: false,
    },
  },
  development: {
    "nextjs-15-app-router-tips": {
      title: "Next.js 15 App Router — tips and gotchas",
      slug: "nextjs-15-app-router-tips",
      forumSlug: "development",
      body: "I've been building with the Next.js 15 App Router for a while now and wanted to share some things I've learned:\n\n- Server components are the default, which is great for performance. Only add \"use client\" when you actually need interactivity.\n- The new async params in dynamic routes require awaiting the params object before accessing properties.\n- Layouts persist across navigations, so be careful about what state you put there.\n\nWhat tips have you picked up?",
      authorName: "Mikko",
      createdAt: "2026-03-05",
      pinned: true,
      locked: false,
    },
    "mui-theming-css-variables": {
      title: "Best practices for MUI theming with CSS variables",
      slug: "mui-theming-css-variables",
      forumSlug: "development",
      body: "I've been exploring CSS variable-based theming with MUI and it's a much cleaner approach than the traditional theme object. You define your variables once and reference them throughout your components. This makes dark/light mode switching almost trivial.\n\nHas anyone else tried this approach? Any pitfalls to watch out for?",
      authorName: "Liisa",
      createdAt: "2026-03-12",
      pinned: false,
      locked: false,
    },
    "typescript-strict-mode": {
      title: "TypeScript strict mode — worth it?",
      slug: "typescript-strict-mode",
      forumSlug: "development",
      body: "I've been debating whether to enable strict mode in our TypeScript config. On one hand, it catches more bugs at compile time. On the other, it can be painful to retrofit onto an existing codebase.\n\nFor new projects I'd say it's a no-brainer. For existing ones, what's your experience been with the migration?",
      authorName: "Juhani",
      createdAt: "2026-03-18",
      pinned: false,
      locked: false,
    },
  },
  "feedback-suggestions": {
    "feature-request-dark-mode": {
      title: "Feature request: dark mode toggle",
      slug: "feature-request-dark-mode",
      forumSlug: "feedback-suggestions",
      body: "It would be great to have a dark mode toggle in the top bar. Many of us code late at night and a dark theme would be much easier on the eyes.\n\nBonus points if it respects the system preference by default.",
      authorName: "Liisa",
      createdAt: "2026-03-08",
      pinned: false,
      locked: false,
    },
    "bug-page-flickers-navigation": {
      title: "Bug: page flickers on navigation",
      slug: "bug-page-flickers-navigation",
      forumSlug: "feedback-suggestions",
      body: "I'm noticing a brief flicker when navigating between pages. It looks like the layout re-mounts momentarily. This happens on both Chrome and Firefox.\n\nHas anyone else experienced this? Could be related to the MUI cache provider.",
      authorName: "Juhani",
      createdAt: "2026-03-15",
      pinned: false,
      locked: false,
    },
    "suggestion-user-profiles": {
      title: "Suggestion: add user profiles",
      slug: "suggestion-user-profiles",
      forumSlug: "feedback-suggestions",
      body: "It would be nice to have basic user profile pages showing a bio, avatar, and a list of recent posts. Nothing too elaborate — just enough to put a face to a name.\n\nThis would also make the forum feel more personal and encourage engagement.",
      authorName: "Mikko",
      createdAt: "2026-03-22",
      pinned: false,
      locked: false,
    },
  },
};

interface TopicPageProps {
  params: Promise<{ slug: string; topicSlug: string }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug, topicSlug } = await params;
  const forumTopics = topicData[slug];

  if (!forumTopics) {
    notFound();
  }

  const topic = forumTopics[topicSlug];

  if (!topic) {
    notFound();
  }

  return (
    <>
      <TopBar title={topic.title} backHref={`/forums/${slug}`} />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        {topic.locked && (
          <Chip
            icon={<LockIcon sx={{ fontSize: 16 }} />}
            label="This topic is locked"
            size="small"
            sx={{
              mb: 2,
              backgroundColor: colors.warning,
              color: colors.slate700,
              fontWeight: 600,
              "& .MuiChip-icon": { color: colors.slate700 },
            }}
          />
        )}

        <Paper
          elevation={0}
          sx={{
            backgroundColor: colors.slate700,
            border: `1px solid ${colors.slate300}`,
            borderRadius: "4px",
            p: { xs: 2, sm: 3 },
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colors.green400 }}>
              {topic.authorName}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.slate400 }}>
              &middot; {topic.createdAt}
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: colors.slate100,
              whiteSpace: "pre-line",
              lineHeight: 1.7,
            }}
          >
            {topic.body}
          </Typography>
        </Paper>

        <Divider sx={{ borderColor: colors.slate300, mb: 3 }} />

        <Paper
          elevation={0}
          sx={{
            backgroundColor: colors.slate700,
            border: `1px solid ${colors.slate300}`,
            borderRadius: "4px",
            p: { xs: 2, sm: 3 },
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: colors.slate400 }}>
            Replies and comments coming soon.
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
