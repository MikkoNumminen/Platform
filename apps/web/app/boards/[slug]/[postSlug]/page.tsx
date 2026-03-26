import { Box, Chip, Divider, Typography } from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import TopBar from "../../../components/TopBar";
import { colors } from "../../../styles";

interface MockPost {
  title: string;
  slug: string;
  authorName: string;
  date: string;
  pinned: boolean;
  body: string;
}

const MOCK_POSTS: Record<string, Record<string, MockPost>> = {
  general: {
    "welcome-to-the-community": {
      title: "Welcome to the community!",
      slug: "welcome-to-the-community",
      authorName: "Mikko A.",
      date: "Mar 20, 2026",
      pinned: true,
      body: "Welcome everyone! We're excited to launch this community platform. This is the place to connect with fellow members, share ideas, and help each other out.\n\nFeel free to introduce yourself in the dedicated thread and don't hesitate to explore the different boards. We're building this together!",
    },
    "community-guidelines": {
      title: "Community guidelines and rules",
      slug: "community-guidelines",
      authorName: "Mikko A.",
      date: "Mar 20, 2026",
      pinned: true,
      body: "Please keep discussions respectful and constructive. Here are the key rules:\n\n1. Be kind and respectful to other members.\n2. Stay on topic within each board.\n3. No spam, self-promotion, or misleading content.\n4. Report any issues to the moderation team.\n\nViolations may result in warnings or account suspension.",
    },
    "introduce-yourself": {
      title: "Introduce yourself here",
      slug: "introduce-yourself",
      authorName: "Laura K.",
      date: "Mar 22, 2026",
      pinned: false,
      body: "Hey everyone! I thought it would be nice to have a thread where we can all introduce ourselves. I'll go first — I'm Laura, a frontend developer from Helsinki. Been coding for about five years now, mostly React and TypeScript. Looking forward to being part of this community!",
    },
    "what-are-you-working-on": {
      title: "What are you working on this week?",
      slug: "what-are-you-working-on",
      authorName: "Joonas T.",
      date: "Mar 25, 2026",
      pinned: false,
      body: "Thought it'd be fun to share what everyone's working on this week. I'm currently building a CLI tool for managing database migrations. It's written in Go and handles rollbacks automatically. What about you all?",
    },
  },
  "feature-requests": {
    "how-to-submit": {
      title: "How to submit a feature request",
      slug: "how-to-submit",
      authorName: "Mikko A.",
      date: "Mar 20, 2026",
      pinned: true,
      body: "To submit a feature request, create a new post in this board with a clear title and description. Include the problem you're trying to solve, your proposed solution, and any alternatives you've considered. The community can then discuss and vote on ideas.",
    },
    "dark-mode-mobile": {
      title: "Dark mode for mobile app",
      slug: "dark-mode-mobile",
      authorName: "Elina R.",
      date: "Mar 23, 2026",
      pinned: false,
      body: "Would love to see dark mode support in the mobile app. The web version already has great theme support — it would be nice to have the same options on mobile. My eyes would really appreciate it for late-night browsing!",
    },
    "markdown-support": {
      title: "Add markdown support in posts",
      slug: "markdown-support",
      authorName: "Joonas T.",
      date: "Mar 24, 2026",
      pinned: false,
      body: "It would be really useful to have markdown support in posts. Being able to format text with headers, code blocks, and lists would make technical discussions much easier to follow. A live preview while composing would be a nice bonus.",
    },
  },
  "help-support": {
    faq: {
      title: "FAQ — Read before posting",
      slug: "faq",
      authorName: "Mikko A.",
      date: "Mar 20, 2026",
      pinned: true,
      body: "Before creating a new support thread, please check if your question is answered here.\n\nQ: How do I change my display name?\nA: Go to Settings > Profile > Display Name.\n\nQ: Can I delete my account?\nA: Yes, contact support or go to Settings > Account > Delete Account.\n\nQ: How do I report a bug?\nA: Use the Help & Support board and tag your post with [Bug].",
    },
    "reset-password": {
      title: "How do I reset my password?",
      slug: "reset-password",
      authorName: "Niko V.",
      date: "Mar 24, 2026",
      pinned: false,
      body: "I forgot my password and the reset email isn't arriving. I've checked my spam folder too. Is there another way to reset it, or could an admin help me out? My account email is correct as far as I know.",
    },
    "notifications-firefox": {
      title: "Notifications not working on Firefox",
      slug: "notifications-firefox",
      authorName: "Laura K.",
      date: "Mar 25, 2026",
      pinned: false,
      body: "I'm not receiving any browser notifications on Firefox 128. I've allowed notifications in both the browser settings and the platform settings. Everything works fine on Chrome. Is this a known issue?",
    },
  },
};

interface PostPageProps {
  params: Promise<{ slug: string; postSlug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, postSlug } = await params;
  const post = MOCK_POSTS[slug]?.[postSlug];

  if (!post) {
    return (
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <TopBar title="Post not found" />
        <Typography sx={{ color: colors.slate400, mt: 2 }}>
          The post you are looking for does not exist.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title={post.title} />

      <Box
        sx={{
          backgroundColor: colors.slate600,
          border: `1px solid ${colors.slate300}`,
          borderRadius: "4px",
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" sx={{ color: colors.slate400 }}>
            {post.authorName}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.slate300 }}>
            &middot;
          </Typography>
          <Typography variant="body2" sx={{ color: colors.slate400 }}>
            {post.date}
          </Typography>
          {post.pinned && (
            <Chip
              icon={<PushPinIcon sx={{ fontSize: 14 }} />}
              label="Pinned"
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                backgroundColor: colors.green900,
                color: colors.green400,
                "& .MuiChip-icon": {
                  color: colors.green400,
                },
              }}
            />
          )}
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: colors.slate100,
            whiteSpace: "pre-line",
            lineHeight: 1.7,
          }}
        >
          {post.body}
        </Typography>
      </Box>

      <Divider sx={{ my: 3, borderColor: colors.slate300 }} />

      <Box
        sx={{
          backgroundColor: colors.slate600,
          border: `1px solid ${colors.slate300}`,
          borderRadius: "4px",
          p: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="h6" sx={{ color: colors.slate100, mb: 1 }}>
          Comments
        </Typography>
        <Typography variant="body2" sx={{ color: colors.slate400 }}>
          Comments are not yet available. This feature is coming soon.
        </Typography>
      </Box>
    </Box>
  );
}
