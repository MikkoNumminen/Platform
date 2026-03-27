import { Box, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import TopBar from "../../components/TopBar";
import PostListItem from "../../components/PostListItem";
import BoardAdminBar from "../../components/BoardAdminBar";
import { colors } from "../../styles";
import { getBoardBySlug } from "@/lib/board-queries";
import { getPostsByBoard } from "@/lib/post-queries";

interface BoardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const posts = await getPostsByBoard(board.id);

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title={board.name} backHref="/boards" />
      <Typography variant="body2" sx={{ color: colors.slate400, mb: 2 }}>
        {board.description}
      </Typography>
      <BoardAdminBar
        boardId={board.id}
        boardName={board.name}
        boardDescription={board.description ?? ""}
        boardSlug={board.slug}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {posts.map((post) => (
          <PostListItem
            key={post.id}
            title={post.title}
            slug={post.slug}
            authorName={post.authorName}
            date={post.createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            pinned={post.pinned}
            href={`/boards/${board.slug}/${post.slug}`}
          />
        ))}
      </Box>
    </Box>
  );
}
