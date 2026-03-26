import { Box, Typography } from "@mui/material";
import TopBar from "./components/TopBar";

export default function Home() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title="Platform" />
      <Typography variant="body1">
        Community platform — coming soon.
      </Typography>
    </Box>
  );
}
