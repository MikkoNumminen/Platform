import { Card, CardActionArea, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import { colors } from "../styles";

interface ForumCardProps {
  name: string;
  slug: string;
  description: string;
  topicCount: number;
}

export default function ForumCard({ name, slug, description, topicCount }: ForumCardProps) {
  return (
    <Card
      sx={{
        backgroundColor: colors.slate700,
        border: `1px solid ${colors.slate300}`,
        "&:hover": {
          backgroundColor: colors.rowHover,
        },
      }}
      elevation={0}
    >
      <CardActionArea component={Link} href={`/forums/${slug}`}>
        <CardContent>
          <Typography variant="h6" sx={{ color: colors.green400, fontWeight: 600, mb: 0.5 }}>
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.slate100, mb: 1.5 }}>
            {description}
          </Typography>
          <Typography variant="caption" sx={{ color: colors.slate400 }}>
            {topicCount} {topicCount === 1 ? "topic" : "topics"}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
