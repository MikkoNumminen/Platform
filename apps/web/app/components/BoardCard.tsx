import { Card, CardActionArea, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import { colors } from "../styles";

interface BoardCardProps {
  name: string;
  slug: string;
  description: string;
  postCount: number;
}

export default function BoardCard({ name, slug, description, postCount }: BoardCardProps) {
  return (
    <Card
      sx={{
        backgroundColor: colors.slate600,
        border: `1px solid ${colors.slate300}`,
        transition: "border-color 0.2s ease",
        "&:hover": {
          borderColor: colors.green400,
        },
      }}
      elevation={0}
    >
      <CardActionArea component={Link} href={`/boards/${slug}`}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              color: colors.slate100,
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.slate400,
              mb: 1.5,
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: colors.green400,
              fontWeight: 500,
            }}
          >
            {postCount} {postCount === 1 ? "post" : "posts"}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
