import { Box } from "@mui/material";
import TopBar from "../components/TopBar";
import CalendarGrid from "../components/CalendarGrid";
import { getMockEvents } from "../data/mockEvents";

export default function CalendarPage() {
  const events = getMockEvents();

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title="Calendar" />
      <CalendarGrid events={events} />
    </Box>
  );
}
