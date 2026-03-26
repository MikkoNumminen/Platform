import { Box } from "@mui/material";
import TopBar from "../components/TopBar";
import BoardCard from "../components/BoardCard";
import BoardActions from "../components/BoardActions";
import { getBoards } from "@/lib/board-queries";

export default async function BoardsPage() {
  const boards = await getBoards();

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title="Boards" />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <BoardActions />
      </Box>
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
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            name={board.name}
            slug={board.slug}
            description={board.description ?? ""}
            postCount={board.postCount}
          />
        ))}
      </Box>
    </Box>
  );
}
