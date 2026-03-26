import { Box, Typography } from "@mui/material";
import TopBar from "../../components/TopBar";
import PostListItem from "../../components/PostListItem";
import { colors } from "../../styles";

interface BoardPost {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  date: string;
  pinned: boolean;
}

interface MockBoard {
  name: string;
  slug: string;
  description: string;
  posts: BoardPost[];
}

const MOCK_BOARDS: Record<string, MockBoard> = {
  general: {
    name: "General Discussion",
    slug: "general",
    description:
      "A place for community-wide conversations, introductions, and anything that doesn't fit elsewhere.",
    posts: [
      {
        id: "1",
        title: "Welcome to the community!",
        slug: "welcome-to-the-community",
        authorName: "Mikko A.",
        date: "Mar 20, 2026",
        pinned: true,
      },
      {
        id: "2",
        title: "Community guidelines and rules",
        slug: "community-guidelines",
        authorName: "Mikko A.",
        date: "Mar 20, 2026",
        pinned: true,
      },
      {
        id: "3",
        title: "Introduce yourself here",
        slug: "introduce-yourself",
        authorName: "Laura K.",
        date: "Mar 22, 2026",
        pinned: false,
      },
      {
        id: "4",
        title: "What are you working on this week?",
        slug: "what-are-you-working-on",
        authorName: "Joonas T.",
        date: "Mar 25, 2026",
        pinned: false,
      },
    ],
  },
  "feature-requests": {
    name: "Feature Requests",
    slug: "feature-requests",
    description:
      "Suggest new features, vote on ideas, and discuss improvements to the platform.",
    posts: [
      {
        id: "5",
        title: "How to submit a feature request",
        slug: "how-to-submit",
        authorName: "Mikko A.",
        date: "Mar 20, 2026",
        pinned: true,
      },
      {
        id: "6",
        title: "Dark mode for mobile app",
        slug: "dark-mode-mobile",
        authorName: "Elina R.",
        date: "Mar 23, 2026",
        pinned: false,
      },
      {
        id: "7",
        title: "Add markdown support in posts",
        slug: "markdown-support",
        authorName: "Joonas T.",
        date: "Mar 24, 2026",
        pinned: false,
      },
    ],
  },
  "help-support": {
    name: "Help & Support",
    slug: "help-support",
    description:
      "Got a question or ran into an issue? Post here and the community will help you out.",
    posts: [
      {
        id: "8",
        title: "FAQ — Read before posting",
        slug: "faq",
        authorName: "Mikko A.",
        date: "Mar 20, 2026",
        pinned: true,
      },
      {
        id: "9",
        title: "How do I reset my password?",
        slug: "reset-password",
        authorName: "Niko V.",
        date: "Mar 24, 2026",
        pinned: false,
      },
      {
        id: "10",
        title: "Notifications not working on Firefox",
        slug: "notifications-firefox",
        authorName: "Laura K.",
        date: "Mar 25, 2026",
        pinned: false,
      },
    ],
  },
};

interface BoardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;
  const board = MOCK_BOARDS[slug];

  if (!board) {
    return (
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <TopBar title="Board not found" />
        <Typography sx={{ color: colors.slate400, mt: 2 }}>
          The board you are looking for does not exist.
        </Typography>
      </Box>
    );
  }

  const sortedPosts = [...board.posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return 0;
  });

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title={board.name} />
      <Typography
        variant="body2"
        sx={{ color: colors.slate400, mb: 2 }}
      >
        {board.description}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {sortedPosts.map((post) => (
          <PostListItem
            key={post.id}
            title={post.title}
            slug={post.slug}
            authorName={post.authorName}
            date={post.date}
            pinned={post.pinned}
            href={`/boards/${board.slug}/${post.slug}`}
          />
        ))}
      </Box>
    </Box>
  );
}
