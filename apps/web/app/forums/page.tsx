import { Box, Stack, Typography } from "@mui/material";
import TopBar from "../components/TopBar";
import ForumCard from "../components/ForumCard";

const forums = [
  {
    id: "1",
    name: "General Discussion",
    slug: "general-discussion",
    description:
      "Talk about anything related to the community. Introductions, news, and off-topic chat welcome.",
    sortOrder: 1,
    topicCount: 4,
  },
  {
    id: "2",
    name: "Development",
    slug: "development",
    description: "Technical discussions about software development, tools, and best practices.",
    sortOrder: 2,
    topicCount: 3,
  },
  {
    id: "3",
    name: "Feedback & Suggestions",
    slug: "feedback-suggestions",
    description:
      "Share ideas for improving the platform. Bug reports and feature requests go here.",
    sortOrder: 3,
    topicCount: 3,
  },
];

export default function ForumsPage() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title="Forums" />
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Browse community discussions by category.
      </Typography>
      <Stack spacing={1.5}>
        {forums.map((forum) => (
          <ForumCard
            key={forum.id}
            name={forum.name}
            slug={forum.slug}
            description={forum.description}
            topicCount={forum.topicCount}
          />
        ))}
      </Stack>
    </Box>
  );
}
