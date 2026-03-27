import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import TopBar from "./components/TopBar";
import SurveyCTA from "./components/SurveyCTA";
import { colors } from "./styles";

const sections = [
  {
    title: "Boards",
    description: "Community discussion boards for sharing ideas and conversations.",
    href: "/boards",
  },
  {
    title: "Forums",
    description: "Structured forums for in-depth topics and threaded discussions.",
    href: "/forums",
  },
  {
    title: "Calendar",
    description: "Upcoming events, meetups, and important dates.",
    href: "/calendar",
  },
];

export default function Home() {
  return (
    <>
      <TopBar title="Platform" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
        <SurveyCTA />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
            mt: 2,
          }}
        >
          {sections.map((section) => (
            <Card
              key={section.href}
              sx={{
                backgroundColor: colors.slate600,
                border: `1px solid ${colors.slate300}`,
                transition: "border-color 0.2s ease",
                "&:hover": { borderColor: colors.green400 },
              }}
              elevation={0}
            >
              <CardActionArea component={Link} href={section.href}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: colors.slate100, fontWeight: 600, mb: 0.5 }}
                  >
                    {section.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.slate400, lineHeight: 1.5 }}>
                    {section.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    </>
  );
}
