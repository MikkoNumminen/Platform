import { Box, Chip, Divider, Typography } from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import { notFound } from "next/navigation";
import TopBar from "../../../components/TopBar";
import PostAdminBar from "../../../components/PostAdminBar";
import ThreadList from "../../../components/ThreadList";
import { colors } from "../../../styles";
import { getBoardBySlug } from "@/lib/board-queries";
import { getPostBySlug } from "@/lib/post-queries";
import { getThreadsByParent } from "@/lib/thread-queries";

interface PostPageProps {
  params: Promise<{ slug: string; postSlug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, postSlug } = await params;

  const board = await getBoardBySlug(slug);
  if (!board) {
    notFound();
  }

  const post = await getPostBySlug(board.id, postSlug);
  if (!post) {
    notFound();
  }

  const threads = await getThreadsByParent("POST", post.id);

  const formattedDate = post.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <TopBar title={post.title} backHref={`/boards/${slug}`} />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <PostAdminBar
          postId={post.id}
          postTitle={post.title}
          postBody={post.body}
          pinned={post.pinned}
          boardId={board.id}
          boardSlug={slug}
        />

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
              {formattedDate}
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

        <ThreadList
          threads={threads}
          parentType="POST"
          parentId={post.id}
          revalidateUrl={`/boards/${slug}/${postSlug}`}
        />
      </Box>
    </>
  );
}
