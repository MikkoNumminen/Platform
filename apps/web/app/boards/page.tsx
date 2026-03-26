import { Box } from "@mui/material";
import TopBar from "../components/TopBar";
import BoardCard from "../components/BoardCard";

const MOCK_BOARDS = [
  {
    id: "1",
    name: "General Discussion",
    slug: "general",
    description:
      "A place for community-wide conversations, introductions, and anything that doesn't fit elsewhere.",
    postCount: 12,
  },
  {
    id: "2",
    name: "Feature Requests",
    slug: "feature-requests",
    description:
      "Suggest new features, vote on ideas, and discuss improvements to the platform.",
    postCount: 8,
  },
  {
    id: "3",
    name: "Help & Support",
    slug: "help-support",
    description:
      "Got a question or ran into an issue? Post here and the community will help you out.",
    postCount: 5,
  },
];

export default function BoardsPage() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title="Boards" />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {MOCK_BOARDS.map((board) => (
          <BoardCard
            key={board.id}
            name={board.name}
            slug={board.slug}
            description={board.description}
            postCount={board.postCount}
          />
        ))}
      </Box>
    </Box>
  );
}
