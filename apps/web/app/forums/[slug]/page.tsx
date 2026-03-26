import { Box, Paper, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import TopBar from "../../components/TopBar";
import TopicListItem from "../../components/TopicListItem";
import { colors } from "../../styles";

interface Topic {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  createdAt: string;
  pinned: boolean;
  locked: boolean;
}

interface Forum {
  name: string;
  slug: string;
  description: string;
  topics: Topic[];
}

const forumData: Record<string, Forum> = {
  "general-discussion": {
    name: "General Discussion",
    slug: "general-discussion",
    description:
      "Talk about anything related to the community. Introductions, news, and off-topic chat welcome.",
    topics: [
      {
        id: "1",
        title: "Welcome to the community!",
        slug: "welcome-to-the-community",
        authorName: "Admin",
        createdAt: "2026-03-01",
        pinned: true,
        locked: false,
      },
      {
        id: "2",
        title: "Community guidelines and rules",
        slug: "community-guidelines-and-rules",
        authorName: "Admin",
        createdAt: "2026-03-01",
        pinned: true,
        locked: true,
      },
      {
        id: "3",
        title: "Introduce yourself here",
        slug: "introduce-yourself-here",
        authorName: "Mikko",
        createdAt: "2026-03-10",
        pinned: false,
        locked: false,
      },
      {
        id: "4",
        title: "What are you working on this week?",
        slug: "what-are-you-working-on-this-week",
        authorName: "Juhani",
        createdAt: "2026-03-20",
        pinned: false,
        locked: false,
      },
    ],
  },
  development: {
    name: "Development",
    slug: "development",
    description: "Technical discussions about software development, tools, and best practices.",
    topics: [
      {
        id: "5",
        title: "Next.js 15 App Router — tips and gotchas",
        slug: "nextjs-15-app-router-tips",
        authorName: "Mikko",
        createdAt: "2026-03-05",
        pinned: true,
        locked: false,
      },
      {
        id: "6",
        title: "Best practices for MUI theming with CSS variables",
        slug: "mui-theming-css-variables",
        authorName: "Liisa",
        createdAt: "2026-03-12",
        pinned: false,
        locked: false,
      },
      {
        id: "7",
        title: "TypeScript strict mode — worth it?",
        slug: "typescript-strict-mode",
        authorName: "Juhani",
        createdAt: "2026-03-18",
        pinned: false,
        locked: false,
      },
    ],
  },
  "feedback-suggestions": {
    name: "Feedback & Suggestions",
    slug: "feedback-suggestions",
    description:
      "Share ideas for improving the platform. Bug reports and feature requests go here.",
    topics: [
      {
        id: "8",
        title: "Feature request: dark mode toggle",
        slug: "feature-request-dark-mode",
        authorName: "Liisa",
        createdAt: "2026-03-08",
        pinned: false,
        locked: false,
      },
      {
        id: "9",
        title: "Bug: page flickers on navigation",
        slug: "bug-page-flickers-navigation",
        authorName: "Juhani",
        createdAt: "2026-03-15",
        pinned: false,
        locked: false,
      },
      {
        id: "10",
        title: "Suggestion: add user profiles",
        slug: "suggestion-user-profiles",
        authorName: "Mikko",
        createdAt: "2026-03-22",
        pinned: false,
        locked: false,
      },
    ],
  },
};

interface ForumPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ForumPage({ params }: ForumPageProps) {
  const { slug } = await params;
  const forum = forumData[slug];

  if (!forum) {
    notFound();
  }

  const sortedTopics = [...forum.topics].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title={forum.name} />
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {forum.description}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: colors.slate700,
          border: `1px solid ${colors.slate300}`,
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {sortedTopics.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: colors.slate400 }}>
              No topics yet. Be the first to start a discussion.
            </Typography>
          </Box>
        ) : (
          sortedTopics.map((topic) => (
            <TopicListItem
              key={topic.id}
              title={topic.title}
              slug={topic.slug}
              forumSlug={forum.slug}
              authorName={topic.authorName}
              createdAt={topic.createdAt}
              pinned={topic.pinned}
              locked={topic.locked}
            />
          ))
        )}
      </Paper>
    </Box>
  );
}
